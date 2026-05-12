param(
  [string]$ProjectRoot = ".",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path $ProjectRoot
Set-Location $root

$legacyPath = "src\gallery\_legacy"
$reportDir = "asset-reports"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveRoot = "asset-archive\stale-gallery-legacy-$timestamp"

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$lines = @()
$lines += "Stale legacy gallery code archive plan"
$lines += "Generated: $timestamp"
$lines += ""

if (-not (Test-Path $legacyPath)) {
  $lines += "No src\gallery\_legacy folder found."
  Set-Content -Path "$reportDir\stale-gallery-legacy-archive-plan.txt" -Value $lines
  Write-Host "No src\gallery\_legacy folder found." -ForegroundColor Green
  exit 0
}

$files = @(Get-ChildItem $legacyPath -File -Recurse)
foreach ($file in $files) {
  $relative = $file.FullName.Substring((Resolve-Path $legacyPath).Path.Length).TrimStart("\")
  $lines += "$($file.FullName.Substring($root.Path.Length + 1)) -> $archiveRoot\$relative"
}

Set-Content -Path "$reportDir\stale-gallery-legacy-archive-plan.txt" -Value $lines

Write-Host ""
Write-Host "Legacy gallery files found: $($files.Count)"
Write-Host "Plan written to asset-reports\stale-gallery-legacy-archive-plan.txt" -ForegroundColor Cyan

if (-not $Apply) {
  Write-Host "Dry run only. Re-run with -Apply after reviewing the plan." -ForegroundColor Yellow
  exit 0
}

New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null
Move-Item -Force $legacyPath $archiveRoot
Write-Host "Moved src\gallery\_legacy to $archiveRoot" -ForegroundColor Green
