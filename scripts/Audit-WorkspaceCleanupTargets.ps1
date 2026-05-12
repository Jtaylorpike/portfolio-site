param([string]$ProjectRoot = ".")
$ErrorActionPreference = "Stop"
$root = Resolve-Path $ProjectRoot
Set-Location $root

$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$keepRootFiles = @(".gitignore","index.html","package.json","package-lock.json","PROJECT_CHANGELOG.md","README.md","tsconfig.json","vite.config.ts")
$keepRootDirs = @(".github","docs","local-editor","public","scripts","src")
$localRootDirs = @(".drive-browser-profile","_chat-uploads","asset-archive","asset-reports","dist","node_modules","portfolio-public-site-polish-pack")
$rootArchivePatterns = @("PROJECT_CHANGELOG_APPEND_*.md","REPLACEMENT_PACK_*.md","asset-reports.zip","_chat-uploads.zip","New-TaylorPikePortfolioChatUpload.ps1")

$items = @(Get-ChildItem -Force | Where-Object { $_.Name -ne ".git" })
$rows = @()

foreach ($item in $items) {
  $tracked = $false
  $trackedMatch = @(git ls-files -- $item.Name)
  if ($trackedMatch.Count -gt 0) { $tracked = $true }

  $classification = "review"
  $reason = "Not recognized by cleanup policy."

  if ($item.PSIsContainer -and ($keepRootDirs -contains $item.Name)) {
    $classification = "keep"
    $reason = "Primary project source/config directory."
  } elseif (-not $item.PSIsContainer -and ($keepRootFiles -contains $item.Name)) {
    $classification = "keep"
    $reason = "Primary project source/config file."
  } elseif ($item.PSIsContainer -and ($localRootDirs -contains $item.Name)) {
    $classification = "local-only"
    $reason = "Generated/local/cache/archive folder. Should not be committed."
  } else {
    foreach ($pattern in $rootArchivePatterns) {
      if ($item.Name -like $pattern) {
        $classification = "archive-candidate"
        $reason = "Generated handoff/report/changelog-fragment artifact."
      }
    }
  }

  $rows += [PSCustomObject]@{
    name = $item.Name
    type = if ($item.PSIsContainer) { "directory" } else { "file" }
    classification = $classification
    trackedByGit = $tracked
    reason = $reason
  }
}

$rows | Export-Csv -NoTypeInformation -Path "$reportDir\workspace-root-cleanup-targets.csv"

$lines = @()
$lines += "Workspace root cleanup audit"
$lines += ""
foreach ($group in ($rows | Group-Object classification | Sort-Object Name)) {
  $lines += "$($group.Name): $($group.Count)"
}
$lines += ""
foreach ($row in $rows | Sort-Object classification,name) {
  $lines += "$($row.classification) | tracked=$($row.trackedByGit) | $($row.type) | $($row.name) | $($row.reason)"
}
Set-Content -Path "$reportDir\workspace-root-cleanup-targets.txt" -Value $lines

Write-Host ""
Write-Host "Workspace root cleanup audit written to asset-reports\workspace-root-cleanup-targets.txt" -ForegroundColor Cyan

if (Test-Path "public\images") {
  $imageRows = @(Get-ChildItem "public\images" -File -Recurse | ForEach-Object {
    $relative = $_.FullName.Substring((Resolve-Path "public\images").Path.Length).TrimStart("\")
    $parts = $relative -split "\\"
    [PSCustomObject]@{
      path = $_.FullName.Substring($root.Path.Length + 1)
      topFolder = if ($parts.Count -gt 0) { $parts[0] } else { "" }
      secondFolder = if ($parts.Count -gt 1) { $parts[1] } else { "" }
      sizeBytes = $_.Length
    }
  })

  $imageRows | Export-Csv -NoTypeInformation -Path "$reportDir\public-image-files-by-folder.csv"

  $imageSummary = @($imageRows | Group-Object topFolder | Sort-Object Name | ForEach-Object {
    [PSCustomObject]@{
      topFolder = $_.Name
      files = $_.Count
      sizeBytes = ($_.Group | Measure-Object sizeBytes -Sum).Sum
    }
  })

  $imageSummary | Export-Csv -NoTypeInformation -Path "$reportDir\public-image-root-folder-summary.csv"

  $imageLines = @("Public image root folder summary","")
  foreach ($row in $imageSummary) {
    $imageLines += "$($row.topFolder): $($row.files) files, $($row.sizeBytes) bytes"
  }
  Set-Content -Path "$reportDir\public-image-root-folder-summary.txt" -Value $imageLines

  Write-Host "Public image folder summary written to asset-reports\public-image-root-folder-summary.txt" -ForegroundColor Cyan
}
