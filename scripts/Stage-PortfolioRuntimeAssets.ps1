param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path $ProjectRoot
Set-Location $root

git add public/images public/fonts

Write-Host ""
Write-Host "Staged runtime assets:" -ForegroundColor Green
git status --short -- public/images public/fonts

Write-Host ""
Write-Host "Next:"
Write-Host "git commit -m ""Add portfolio runtime image assets"""
Write-Host "git push origin main"
