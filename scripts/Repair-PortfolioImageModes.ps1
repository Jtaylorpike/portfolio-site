param(
  [string]$ProjectRoot = ".",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$jsonPath = "src\data\galleryImages.json"
$reportDir = "asset-reports"
$backupDir = "asset-archive\json-backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

if (-not (Test-Path $jsonPath)) {
  throw "Could not find $jsonPath."
}

$images = @(Get-Content $jsonPath -Raw | ConvertFrom-Json)

if ($images.Count -eq 1 -and $images[0] -is [System.Array]) {
  $images = @($images[0])
}

$validFitModes = @("cover", "contain")
$validFrameStyles = @("auto", "landscape", "portrait", "square")
$changes = @()

foreach ($image in $images) {
  $imageId = [string]$image.id

  foreach ($field in @("heroFitMode", "galleryFitMode")) {
    $value = [string]$image.$field

    if ($validFitModes -notcontains $value) {
      $oldValue = $value
      $image.$field = "cover"

      $changes += [PSCustomObject]@{
        imageId = $imageId
        field = $field
        oldValue = $oldValue
        newValue = "cover"
      }
    }
  }

  foreach ($field in @("heroFrameStyle", "galleryFrameStyle")) {
    $value = [string]$image.$field

    if ($validFrameStyles -notcontains $value) {
      $oldValue = $value
      $image.$field = "auto"

      $changes += [PSCustomObject]@{
        imageId = $imageId
        field = $field
        oldValue = $oldValue
        newValue = "auto"
      }
    }
  }
}

$changes | Export-Csv -NoTypeInformation -Path "$reportDir\portfolio-image-mode-repair-plan.csv"

$lines = @()
$lines += "Portfolio image mode repair plan"
$lines += "Generated: $timestamp"
$lines += ""
$lines += "Changes: $($changes.Count)"
$lines += ""

if ($changes.Count -eq 0) {
  $lines += "No invalid fit/frame modes found."
} else {
  foreach ($change in $changes) {
    $lines += "$($change.imageId) | $($change.field) | '$($change.oldValue)' -> '$($change.newValue)'"
  }
}

Set-Content -Path "$reportDir\portfolio-image-mode-repair-plan.txt" -Value $lines

Write-Host ""
Write-Host "Invalid mode values found: $($changes.Count)"
Write-Host "Plan written to asset-reports\portfolio-image-mode-repair-plan.txt" -ForegroundColor Cyan

if ($changes.Count -eq 0) {
  exit 0
}

if (-not $Apply) {
  Write-Host "Dry run only. Re-run with -Apply after reviewing the plan." -ForegroundColor Yellow
  exit 0
}

$backupPath = Join-Path $backupDir "galleryImages-before-mode-repair-$timestamp.json"
Copy-Item -Force $jsonPath $backupPath

$json = $images | ConvertTo-Json -Depth 30
Set-Content -Path $jsonPath -Value $json

Write-Host "Backed up original JSON to $backupPath" -ForegroundColor Cyan
Write-Host "Updated $jsonPath" -ForegroundColor Green
