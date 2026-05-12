param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$staged = @(git diff --cached --name-status)
$unstaged = @(git diff --name-status)
$untracked = @(git status --short | Where-Object { $_ -like "?? *" })

$failures = @()
$warnings = @()

function Add-Failure {
  param([string]$Message)
  $script:failures += $Message
}

function Add-Warning {
  param([string]$Message)
  $script:warnings += $Message
}

function Get-StagedRows {
  param([string[]]$Lines)

  $rows = @()

  foreach ($line in $Lines) {
    if ([string]::IsNullOrWhiteSpace($line)) {
      continue
    }

    $parts = $line -split "`t"
    $status = $parts[0]

    if ($status -like "R*") {
      $rows += [PSCustomObject]@{
        status = $status
        path = $parts[2]
        oldPath = $parts[1]
        raw = $line
      }
    }
    else {
      $rows += [PSCustomObject]@{
        status = $status
        path = $parts[1]
        oldPath = ""
        raw = $line
      }
    }
  }

  return @($rows)
}

$rows = Get-StagedRows -Lines $staged

$trackedArchive = @(git ls-files asset-archive)
$trackedReports = @(git ls-files asset-reports)
$trackedSourceImages = @(git ls-files source-images)

if ($trackedArchive.Count -gt 0) {
  Add-Failure "asset-archive has tracked files."
}

if ($trackedReports.Count -gt 0) {
  Add-Failure "asset-reports has tracked files."
}

if ($trackedSourceImages.Count -gt 0) {
  Add-Failure "source-images has tracked files."
}

foreach ($row in $rows) {
  $path = $row.path

  if ($path -match "^asset-archive/") {
    Add-Failure "Staged file is inside asset-archive: $path"
  }

  if ($path -match "^asset-reports/") {
    Add-Failure "Staged file is inside asset-reports: $path"
  }

  if ($path -match "^source-images/") {
    Add-Failure "Staged file is inside source-images: $path"
  }

  if ($row.status -ne "D" -and $path -like "PROJECT_CHANGELOG_APPEND_*.md") {
    Add-Failure "Changelog append fragment is staged as a live file instead of deletion: $path"
  }

  if ($row.status -ne "D" -and $path -eq "REPLACEMENT_PACK_NOTES.md") {
    Add-Failure "REPLACEMENT_PACK_NOTES.md is staged as a live file instead of deletion."
  }

  if ($row.status -ne "D" -and $path -match "^_chat-uploads/") {
    Add-Failure "_chat-uploads file is staged as a live file instead of deletion: $path"
  }

  if ($row.status -ne "D" -and $path -match "^public/data/") {
    Add-Failure "public/data file is staged as a live file. Active data should be in src/data: $path"
  }

  if ($row.status -ne "D" -and $path -match "^src/gallery/_legacy/") {
    Add-Failure "Legacy gallery source is staged as a live file: $path"
  }
}

$requiredUiCards = @(
  "public/images/ui/cards/climbing.webp",
  "public/images/ui/cards/commercial.webp",
  "public/images/ui/cards/personal.webp",
  "public/images/ui/cards/portraits.webp",
  "public/images/ui/cards/product-brand.webp"
)

foreach ($file in $requiredUiCards) {
  if (-not (Test-Path $file)) {
    Add-Failure "Required UI card image is missing from working tree: $file"
  }

  $tracked = @(git ls-files $file)
  $stagedAdd = @($rows | Where-Object { $_.path -eq $file -and $_.status -ne "D" })

  if ($tracked.Count -eq 0 -and $stagedAdd.Count -eq 0) {
    Add-Failure "Required UI card image is not tracked or staged: $file"
  }
}

$deletedChatUploads = @($rows | Where-Object { $_.status -eq "D" -and $_.path -match "^_chat-uploads/" })
$deletedAppendFragments = @($rows | Where-Object { $_.status -eq "D" -and $_.path -like "PROJECT_CHANGELOG_APPEND_*.md" })
$deletedOldPublicImages = @($rows | Where-Object {
  $_.status -eq "D" -and (
    $_.path -match "^public/images/card-optimized/" -or
    $_.path -match "^public/images/climbing/" -or
    $_.path -match "^public/images/landscape/" -or
    $_.path -match "^public/images/personal/"
  )
})

if ($deletedChatUploads.Count -gt 0) {
  Add-Warning "$($deletedChatUploads.Count) tracked _chat-uploads files are staged for deletion. This is expected if cleaning old tracked transfer bundles."
}

if ($deletedAppendFragments.Count -gt 0) {
  Add-Warning "$($deletedAppendFragments.Count) changelog append fragments are staged for deletion. This is expected after consolidation."
}

if ($deletedOldPublicImages.Count -gt 0) {
  Add-Warning "$($deletedOldPublicImages.Count) old public image files are staged for deletion. This is expected after migration."
}

$summary = @()
$summary += "Staged commit audit"
$summary += ""
$summary += "Staged rows:              $($rows.Count)"
$summary += "Unstaged rows:            $($unstaged.Count)"
$summary += "Untracked rows:           $($untracked.Count)"
$summary += "Failures:                 $($failures.Count)"
$summary += "Warnings:                 $($warnings.Count)"
$summary += ""
$summary += "Status counts:"
foreach ($group in ($rows | Group-Object status | Sort-Object Name)) {
  $summary += "  $($group.Name): $($group.Count)"
}
$summary += ""
$summary += "Warnings:"
if ($warnings.Count -eq 0) {
  $summary += "  none"
}
else {
  foreach ($warning in $warnings) {
    $summary += "  - $warning"
  }
}
$summary += ""
$summary += "Failures:"
if ($failures.Count -eq 0) {
  $summary += "  none"
}
else {
  foreach ($failure in $failures) {
    $summary += "  - $failure"
  }
}
$summary += ""
$summary += "Staged files:"
foreach ($row in $rows) {
  if ($row.oldPath) {
    $summary += "  $($row.status) $($row.oldPath) -> $($row.path)"
  }
  else {
    $summary += "  $($row.status) $($row.path)"
  }
}

Set-Content -Path "$reportDir\staged-commit-audit.txt" -Value $summary
$rows | Export-Csv -NoTypeInformation -Path "$reportDir\staged-commit-files.csv"

Write-Host ""
Write-Host "Staged commit audit"
Write-Host "Staged rows:    $($rows.Count)"
Write-Host "Failures:       $($failures.Count)"
Write-Host "Warnings:       $($warnings.Count)"
Write-Host "Report:         asset-reports\staged-commit-audit.txt" -ForegroundColor Cyan

if ($warnings.Count -gt 0) {
  Write-Host ""
  Write-Host "Warnings:" -ForegroundColor Yellow
  foreach ($warning in $warnings) {
    Write-Host "  - $warning" -ForegroundColor Yellow
  }
}

if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "Failures:" -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host "  - $failure" -ForegroundColor Red
  }

  exit 1
}

Write-Host ""
Write-Host "Staged commit audit passed." -ForegroundColor Green
