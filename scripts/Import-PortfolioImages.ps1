param(
  [string]$ProjectRoot = ".",
  [string]$SourceDir = "source-images\inbox",
  [string]$Category = "personal",
  [string]$Year = "",
  [string]$Location = "",
  [string]$Note = "",
  [switch]$Apply,
  [switch]$UpdateCategories,
  [switch]$MoveSource,
  [switch]$Force,
  [switch]$InstallSharp
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

if ($InstallSharp) {
  Write-Host "Installing sharp as a dev dependency..." -ForegroundColor Cyan
  npm install -D sharp
}

$sharpPath = Join-Path $root "node_modules\sharp"
if ($Apply -and -not (Test-Path $sharpPath)) {
  Write-Host ""
  Write-Host "The importer needs sharp to write optimized image files." -ForegroundColor Yellow
  Write-Host "Run one of these first:"
  Write-Host ""
  Write-Host "npm install -D sharp"
  Write-Host "or"
  Write-Host ".\scripts\Import-PortfolioImages.ps1 -InstallSharp"
  Write-Host ""
  throw "Missing dependency: sharp"
}

$nodeArgs = @(
  "scripts/import-portfolio-images.mjs",
  "--project-root", $root.Path,
  "--source-dir", $SourceDir,
  "--category", $Category,
  "--year", $Year,
  "--location", $Location,
  "--note", $Note
)

if ($Apply) {
  $nodeArgs += "--apply"
}

if ($UpdateCategories) {
  $nodeArgs += "--update-categories"
}

if ($MoveSource) {
  $nodeArgs += "--move-source"
}

if ($Force) {
  $nodeArgs += "--force"
}

& node @nodeArgs
