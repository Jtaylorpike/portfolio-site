param(
  [string]$ProjectRoot = ".",
  [Parameter(Mandatory = $true)]
  [string]$ImageId,
  [switch]$Apply,
  [switch]$KeepFiles
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$nodeArgs = @(
  "scripts/remove-portfolio-image-record.mjs",
  "--project-root", $root.Path,
  "--image-id", $ImageId
)

if ($Apply) {
  $nodeArgs += "--apply"
}

if ($KeepFiles) {
  $nodeArgs += "--keep-files"
}

& node @nodeArgs
