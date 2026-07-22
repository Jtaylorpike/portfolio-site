param(
  [string]$ProjectRoot = ".",
  [switch]$WarningsAsErrors
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$argsList = @(
  "scripts/validate-portfolio-image-data.mjs",
  "--project-root",
  $root.Path
)

if ($WarningsAsErrors) {
  $argsList += "--warnings-as-errors"
}

node $argsList

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
