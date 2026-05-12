param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = "asset-reports\editor-pipeline-snapshot-$timestamp"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$filesToCopy = @(
  "src\data\galleryImages.json",
  "src\data\categories.json",
  "src\data\heroSlides.json",
  "asset-reports\local-editor-compatibility-findings.txt",
  "asset-reports\local-editor-pipeline-contract-checks.txt",
  "asset-reports\portfolio-image-data-validation-summary.txt",
  "asset-reports\public-image-structure-summary.txt"
)

foreach ($file in $filesToCopy) {
  if (Test-Path $file) {
    $target = Join-Path $outDir ($file -replace "[\\/:]", "__")
    Copy-Item -Force $file $target
  }
}

$summary = @()
$summary += "Editor pipeline snapshot"
$summary += "Generated: $timestamp"
$summary += ""
$summary += "Purpose: capture the current data/image/editor contract state before editor code changes."
$summary += ""
$summary += "Copied files:"
Get-ChildItem $outDir -File | ForEach-Object {
  $summary += "  $($_.Name)"
}

Set-Content -Path (Join-Path $outDir "snapshot-summary.txt") -Value $summary

Write-Host ""
Write-Host "Snapshot written to $outDir" -ForegroundColor Cyan
