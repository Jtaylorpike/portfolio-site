param(
  [string]$ProjectRoot = ".",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$publicDataPath = "public\data"
$reportDir = "asset-reports"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveRoot = "asset-archive\stale-public-data-$timestamp"

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

if (-not (Test-Path $publicDataPath)) {
  Write-Host "No public\data folder found. Nothing to archive." -ForegroundColor Green
  exit 0
}

$files = @(Get-ChildItem $publicDataPath -File -Recurse)

$rows = @(
  foreach ($file in $files) {
    $relativeFromPublicData = $file.FullName.Substring((Resolve-Path $publicDataPath).Path.Length).TrimStart("\")
    $target = Join-Path $archiveRoot $relativeFromPublicData

    [PSCustomObject]@{
      sourcePath = $file.FullName.Substring($root.Path.Length + 1)
      archivePath = $target
      sizeBytes = $file.Length
    }
  }
)

$rows | Export-Csv -NoTypeInformation -Path "$reportDir\archive-stale-public-data-plan.csv"

$lines = @()
$lines += "Archive stale public data plan"
$lines += "Generated: $timestamp"
$lines += ""
$lines += "Reason:"
$lines += "Active app data now lives in src/data. public/data contains stale runtime JSON that can reference deleted or moved image paths."
$lines += ""
if ($rows.Count -eq 0) {
  $lines += "No files found under public/data."
} else {
  foreach ($row in $rows) {
    $lines += "$($row.sourcePath) -> $($row.archivePath)"
  }
}
Set-Content -Path "$reportDir\archive-stale-public-data-plan.txt" -Value $lines

Write-Host ""
Write-Host "Stale public data files found: $($rows.Count)"
Write-Host "Archive target: $archiveRoot"
Write-Host "Plan written to asset-reports\archive-stale-public-data-plan.txt" -ForegroundColor Cyan
Write-Host ""

if ($rows.Count -eq 0) {
  exit 0
}

if (-not $Apply) {
  Write-Host "Dry run only. Re-run with -Apply after reviewing the plan." -ForegroundColor Yellow
  exit 0
}

foreach ($row in $rows) {
  New-Item -ItemType Directory -Force -Path (Split-Path $row.archivePath -Parent) | Out-Null
  Move-Item -Force $row.sourcePath $row.archivePath
}

# Remove empty directories under public/data, deepest first, then public/data itself if empty.
Get-ChildItem $publicDataPath -Directory -Recurse |
  Sort-Object FullName -Descending |
  ForEach-Object {
    if (-not (Get-ChildItem $_.FullName -Force)) {
      Remove-Item $_.FullName -Force
    }
  }

if (Test-Path $publicDataPath) {
  if (-not (Get-ChildItem $publicDataPath -Force)) {
    Remove-Item $publicDataPath -Force
  }
}

Write-Host "Moved stale public data files to $archiveRoot" -ForegroundColor Green
Write-Host "Do not delete this archive unless you have intentionally rejected those data snapshots." -ForegroundColor Yellow
