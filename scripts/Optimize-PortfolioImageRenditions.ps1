param(
  [string]$ProjectRoot = ".",
  [switch]$Apply,
  [switch]$UpdateJson,
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
  Write-Host "The optimizer needs sharp to write image files." -ForegroundColor Yellow
  Write-Host "Run one of these commands first:"
  Write-Host ""
  Write-Host "npm install -D sharp"
  Write-Host "or"
  Write-Host ".\scripts\Optimize-PortfolioImageRenditions.ps1 -InstallSharp"
  Write-Host ""
  throw "Missing dependency: sharp"
}

$argsList = @(
  "scripts/optimize-portfolio-image-renditions.mjs",
  "--project-root",
  $root.Path
)

if ($Apply) {
  $argsList += "--apply"
}

if ($UpdateJson) {
  $argsList += "--update-json"
}

if ($Force) {
  $argsList += "--force"
}

node $argsList
