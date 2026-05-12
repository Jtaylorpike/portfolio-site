param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path $ProjectRoot
Set-Location $root

if (-not (Test-Path "asset-archive")) {
  Write-Host "No asset-archive folder found."
  exit 0
}

$files = @(Get-ChildItem "asset-archive" -File -Recurse)

Write-Host ""
Write-Host "Archived image/file count: $($files.Count)" -ForegroundColor Cyan
Write-Host ""

$files |
  Sort-Object FullName |
  ForEach-Object {
    $_.FullName.Substring($root.Path.Length + 1)
  }

$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$files |
  Sort-Object FullName |
  ForEach-Object {
    $_.FullName.Substring($root.Path.Length + 1)
  } |
  Set-Content "$reportDir\archived-images.txt"

Write-Host ""
Write-Host "Report written to asset-reports\archived-images.txt" -ForegroundColor Green
