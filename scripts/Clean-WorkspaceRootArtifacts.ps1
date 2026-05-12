param(
  [string]$ProjectRoot = ".",
  [switch]$Apply,
  [switch]$SkipChangelogAppend,
  [switch]$SkipChatUploads,
  [switch]$CopyThenRemove
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportDir = "asset-reports"
$archiveRoot = "asset-archive\workspace-root-artifacts-$timestamp"
$fragmentArchive = "asset-archive\changelog-fragments-$timestamp"
$packNotesArchive = "asset-archive\replacement-pack-notes-$timestamp"

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$archiveFilePatterns = @(
  "_chat-uploads.zip",
  "asset-reports.zip",
  "TaylorPikePortfolio-*.zip",
  "Taylor_Pike_Portfolio_*.zip",
  "*ChatUpload*.zip"
)

$archiveDirs = @(
  "_chat-uploads",
  "portfolio-public-site-polish-pack"
)

if ($SkipChatUploads) {
  $archiveDirs = @($archiveDirs | Where-Object { $_ -ne "_chat-uploads" })
}

$rows = @()

foreach ($pattern in $archiveFilePatterns) {
  foreach ($file in @(Get-ChildItem $pattern -File -ErrorAction SilentlyContinue)) {
    $rows += [PSCustomObject]@{
      sourcePath = $file.FullName.Substring($root.Path.Length + 1)
      targetPath = Join-Path $archiveRoot $file.Name
      type = "file"
      action = "archive"
    }
  }
}

foreach ($dirName in $archiveDirs) {
  if (Test-Path $dirName) {
    $rows += [PSCustomObject]@{
      sourcePath = $dirName
      targetPath = Join-Path $archiveRoot $dirName
      type = "directory"
      action = "archive"
    }
  }
}

$fragments = @(Get-ChildItem "PROJECT_CHANGELOG_APPEND_*.md" -File -ErrorAction SilentlyContinue | Sort-Object Name)
foreach ($fragment in $fragments) {
  $rows += [PSCustomObject]@{
    sourcePath = $fragment.Name
    targetPath = Join-Path $fragmentArchive $fragment.Name
    type = "file"
    action = if ($SkipChangelogAppend) { "archive" } else { "append-and-archive" }
  }
}

if (Test-Path "REPLACEMENT_PACK_NOTES.md") {
  $rows += [PSCustomObject]@{
    sourcePath = "REPLACEMENT_PACK_NOTES.md"
    targetPath = Join-Path $packNotesArchive "REPLACEMENT_PACK_NOTES.md"
    type = "file"
    action = "archive"
  }
}

$rows | Export-Csv -NoTypeInformation -Path "$reportDir\workspace-root-cleanup-plan.csv"

$lines = @()
$lines += "Workspace root cleanup plan"
$lines += "Generated: $timestamp"
$lines += ""
$lines += "Apply enabled: $($Apply.IsPresent)"
$lines += "Skip changelog append: $($SkipChangelogAppend.IsPresent)"
$lines += "Skip chat uploads: $($SkipChatUploads.IsPresent)"
$lines += "Copy then remove: $($CopyThenRemove.IsPresent)"
$lines += "Rows: $($rows.Count)"
$lines += ""

if ($rows.Count -eq 0) {
  $lines += "No cleanup targets found."
} else {
  foreach ($row in $rows) {
    $lines += "$($row.action) | $($row.type) | $($row.sourcePath) -> $($row.targetPath)"
  }
}

Set-Content -Path "$reportDir\workspace-root-cleanup-plan.txt" -Value $lines

Write-Host ""
Write-Host "Workspace root cleanup targets: $($rows.Count)"
Write-Host "Plan written to asset-reports\workspace-root-cleanup-plan.txt" -ForegroundColor Cyan

if ($rows.Count -eq 0) {
  exit 0
}

if (-not $Apply) {
  Write-Host "Dry run only. Re-run with -Apply after reviewing the plan." -ForegroundColor Yellow
  exit 0
}

$results = @()

if (-not $SkipChangelogAppend -and $fragments.Count -gt 0) {
  if (-not (Test-Path "PROJECT_CHANGELOG.md")) {
    throw "PROJECT_CHANGELOG.md was not found."
  }

  Add-Content -Path "PROJECT_CHANGELOG.md" -Value ""
  Add-Content -Path "PROJECT_CHANGELOG.md" -Value "---"
  Add-Content -Path "PROJECT_CHANGELOG.md" -Value ""
  Add-Content -Path "PROJECT_CHANGELOG.md" -Value "## Appended changelog fragments - $timestamp"
  Add-Content -Path "PROJECT_CHANGELOG.md" -Value ""

  foreach ($fragment in $fragments) {
    Add-Content -Path "PROJECT_CHANGELOG.md" -Value ""
    Add-Content -Path "PROJECT_CHANGELOG.md" -Value (Get-Content $fragment.FullName -Raw)
  }
}

foreach ($row in $rows) {
  $status = "skipped"
  $message = ""

  try {
    if (-not (Test-Path $row.sourcePath)) {
      $status = "missing-source"
      $message = "Source no longer exists."
    }
    else {
      New-Item -ItemType Directory -Force -Path (Split-Path $row.targetPath -Parent) | Out-Null

      if ($row.type -eq "directory" -and $CopyThenRemove) {
        Copy-Item -Force -Recurse $row.sourcePath $row.targetPath

        try {
          Remove-Item -Force -Recurse $row.sourcePath
          $status = "copied-and-removed"
          $message = "Directory copied to archive and removed from root."
        }
        catch {
          $status = "copied-but-not-removed"
          $message = "Directory was copied to archive, but root copy could not be removed: $($_.Exception.Message)"
        }
      }
      else {
        Move-Item -Force $row.sourcePath $row.targetPath
        $status = "moved"
        $message = "Moved to archive."
      }
    }
  }
  catch {
    $status = "failed"
    $message = $_.Exception.Message
  }

  $results += [PSCustomObject]@{
    sourcePath = $row.sourcePath
    targetPath = $row.targetPath
    type = $row.type
    action = $row.action
    status = $status
    message = $message
  }

  if ($status -eq "failed" -or $status -eq "copied-but-not-removed") {
    Write-Host "WARN: $($row.sourcePath) -> $status - $message" -ForegroundColor Yellow
  }
}

$results | Export-Csv -NoTypeInformation -Path "$reportDir\workspace-root-cleanup-results.csv"

$resultLines = @()
$resultLines += "Workspace root cleanup results"
$resultLines += "Generated: $timestamp"
$resultLines += ""
foreach ($result in $results) {
  $resultLines += "$($result.status) | $($result.type) | $($result.sourcePath) -> $($result.targetPath) | $($result.message)"
}
Set-Content -Path "$reportDir\workspace-root-cleanup-results.txt" -Value $resultLines

$failed = @($results | Where-Object { $_.status -eq "failed" })
$partial = @($results | Where-Object { $_.status -eq "copied-but-not-removed" })

Write-Host ""
Write-Host "Workspace cleanup results written to asset-reports\workspace-root-cleanup-results.txt" -ForegroundColor Cyan
Write-Host "Moved/copied rows: $(@($results | Where-Object { $_.status -in @("moved","copied-and-removed","copied-but-not-removed") }).Count)"
Write-Host "Failed rows:       $($failed.Count)"
Write-Host "Partial rows:      $($partial.Count)"

if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "Some rows failed. Close Explorer/VS Code/terminals that may be using those folders, then rerun." -ForegroundColor Yellow
}

if ($partial.Count -gt 0) {
  Write-Host ""
  Write-Host "Some folders were copied to archive but could not be removed from root. Verify the archived copy, then remove the root folder manually later." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Do not commit asset-archive or asset-reports." -ForegroundColor Yellow
