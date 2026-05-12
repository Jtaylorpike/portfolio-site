param(
  [string]$ProjectRoot = ".",
  [switch]$Apply,
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

$nodeArgs = @(
  "scripts/repair-legacy-imported-image-records.mjs",
  "--project-root", $root.Path
)

if ($Apply) {
  $nodeArgs += "--apply"
}

if ($Force) {
  $nodeArgs += "--force"
}

& node @nodeArgs
