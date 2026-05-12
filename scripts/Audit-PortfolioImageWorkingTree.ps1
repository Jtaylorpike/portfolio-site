param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

Write-Host ""
Write-Host "Git-tracked image folders:" -ForegroundColor Cyan
git ls-files public/images

Write-Host ""
Write-Host "Untracked or modified image/archive/report files:" -ForegroundColor Cyan
git status --short -- public/images asset-archive asset-reports

Write-Host ""
Write-Host "Safety check: asset-archive should print nothing below if it is not tracked." -ForegroundColor Cyan
git ls-files asset-archive
