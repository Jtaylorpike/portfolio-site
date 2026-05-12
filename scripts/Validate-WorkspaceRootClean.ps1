param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$failures = @()

$forbiddenFiles = @(
  "REPLACEMENT_PACK_NOTES.md",
  "_chat-uploads.zip",
  "asset-reports.zip"
)

foreach ($file in $forbiddenFiles) {
  if (Test-Path $file) {
    $failures += "Root artifact should be archived: $file"
  }
}

if (@(Get-ChildItem "PROJECT_CHANGELOG_APPEND_*.md" -File -ErrorAction SilentlyContinue).Count -gt 0) {
  $failures += "PROJECT_CHANGELOG_APPEND_*.md fragments remain at root."
}

if (@(Get-ChildItem "TaylorPikePortfolio-*.zip" -File -ErrorAction SilentlyContinue).Count -gt 0) {
  $failures += "TaylorPikePortfolio-*.zip files remain at root."
}

$forbiddenDirs = @(
  "_chat-uploads",
  "portfolio-public-site-polish-pack",
  "public\data",
  "src\gallery\_legacy"
)

foreach ($dir in $forbiddenDirs) {
  if (Test-Path $dir) {
    $failures += "Stale/generated directory should be archived or removed from active tree: $dir"
  }
}

$trackedArchive = @(git ls-files asset-archive)
$trackedReports = @(git ls-files asset-reports)
$trackedSourceImages = @(git ls-files source-images)

if ($trackedArchive.Count -gt 0) {
  $failures += "asset-archive is tracked by Git."
}

if ($trackedReports.Count -gt 0) {
  $failures += "asset-reports is tracked by Git."
}

if ($trackedSourceImages.Count -gt 0) {
  $failures += "source-images is tracked by Git."
}

Write-Host ""
if ($failures.Count -eq 0) {
  Write-Host "Workspace root cleanup validation passed." -ForegroundColor Green
  exit 0
}

Write-Host "Workspace root cleanup validation failed:" -ForegroundColor Red
foreach ($failure in $failures) {
  Write-Host "  - $failure"
}

exit 1
