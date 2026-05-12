param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path $ProjectRoot
Set-Location $root

$sourceFiles = @(
  "src\data\images.ts",
  "src\data\galleryImages.json",
  "src\styles\global.css"
) | Where-Object { Test-Path $_ }

Write-Host ""
Write-Host "Scanning source files for root-absolute public asset paths..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $sourceFiles) {
  $content = Get-Content $file -Raw
  $matches = [regex]::Matches($content, '["''(](/(?:images|fonts)/[^"''\)]+)')

  foreach ($match in $matches) {
    Write-Host "$file -> $($match.Groups[1].Value)"
  }
}

Write-Host ""
Write-Host "For GitHub project Pages, runtime-generated URLs must be prefixed with import.meta.env.BASE_URL." -ForegroundColor Yellow
