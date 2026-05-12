param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$keepFiles = @(
  ".gitignore",
  "index.html",
  "package.json",
  "package-lock.json",
  "PROJECT_CHANGELOG.md",
  "README.md",
  "tsconfig.json",
  "vite.config.ts"
)

$keepDirs = @(
  ".github",
  "docs",
  "local-editor",
  "public",
  "scripts",
  "src"
)

$archiveFilePatterns = @(
  "PROJECT_CHANGELOG_APPEND_*.md",
  "REPLACEMENT_PACK_NOTES.md",
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

$localIgnoredDirs = @(
  "asset-archive",
  "asset-reports",
  "dist",
  "node_modules",
  "source-images",
  "assets-to-import",
  ".drive-browser-profile"
)

$items = @(Get-ChildItem -Force | Where-Object { $_.Name -ne ".git" })
$rows = @()

foreach ($item in $items) {
  $classification = "review"
  $reason = "Not matched by cleanup policy."

  if ($item.PSIsContainer -and ($keepDirs -contains $item.Name)) {
    $classification = "keep"
    $reason = "Primary project directory."
  }
  elseif (-not $item.PSIsContainer -and ($keepFiles -contains $item.Name)) {
    $classification = "keep"
    $reason = "Primary project root file."
  }
  elseif ($item.PSIsContainer -and ($archiveDirs -contains $item.Name)) {
    $classification = "archive-candidate"
    $reason = "Generated or stale root folder."
  }
  elseif ($item.PSIsContainer -and ($localIgnoredDirs -contains $item.Name)) {
    $classification = "local-ignored"
    $reason = "Local cache/archive/report/source folder."
  }
  else {
    foreach ($pattern in $archiveFilePatterns) {
      if (-not $item.PSIsContainer -and $item.Name -like $pattern) {
        $classification = "archive-candidate"
        $reason = "Generated pack/report/changelog fragment."
      }
    }
  }

  $tracked = @(git ls-files -- $item.Name)

  $rows += [PSCustomObject]@{
    name = $item.Name
    type = if ($item.PSIsContainer) { "directory" } else { "file" }
    classification = $classification
    trackedByGit = $tracked.Count -gt 0
    reason = $reason
  }
}

$rows | Export-Csv -NoTypeInformation -Path "$reportDir\workspace-root-artifact-audit.csv"

$lines = @()
$lines += "Workspace root artifact audit"
$lines += ""
foreach ($group in ($rows | Group-Object classification | Sort-Object Name)) {
  $lines += "$($group.Name): $($group.Count)"
}
$lines += ""
foreach ($row in ($rows | Sort-Object classification, name)) {
  $lines += "$($row.classification) | tracked=$($row.trackedByGit) | $($row.type) | $($row.name) | $($row.reason)"
}

Set-Content -Path "$reportDir\workspace-root-artifact-audit.txt" -Value $lines

Write-Host ""
Write-Host "Workspace root artifact audit written to asset-reports\workspace-root-artifact-audit.txt" -ForegroundColor Cyan
