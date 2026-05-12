param(
  [string]$ProjectRoot = ".",
  [switch]$Apply,
  [switch]$UpdateJson
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path $ProjectRoot
Set-Location $root

$jsonPath = "src\data\galleryImages.json"
$publicRoot = Resolve-Path "public"
$reportDir = "asset-reports"

if (-not (Test-Path $jsonPath)) {
  throw "Could not find $jsonPath"
}

if (-not (Test-Path "public\images")) {
  throw "Could not find public\images"
}

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$images = Get-Content $jsonPath -Raw | ConvertFrom-Json
$plan = @()

$fieldToTier = [ordered]@{
  src = "display"
  thumbSrc = "thumb"
  textureSrc = "texture"
  fullSrc = "full"
}

function Get-LocalPublicPath([string]$publicUrl) {
  if ([string]::IsNullOrWhiteSpace($publicUrl)) {
    return $null
  }

  if ($publicUrl -match "^(https?:|data:|blob:|#)") {
    return $null
  }

  $clean = $publicUrl.TrimStart("/") -replace "/", "\"
  return Join-Path "public" $clean
}

function Get-ExtensionFromPath([string]$path) {
  $extension = [System.IO.Path]::GetExtension($path)

  if ([string]::IsNullOrWhiteSpace($extension)) {
    return ".webp"
  }

  return $extension.ToLowerInvariant()
}

foreach ($image in $images) {
  foreach ($field in $fieldToTier.Keys) {
    if (-not $image.PSObject.Properties.Name.Contains($field)) {
      continue
    }

    $currentUrl = [string]$image.$field

    if ([string]::IsNullOrWhiteSpace($currentUrl)) {
      continue
    }

    $sourcePath = Get-LocalPublicPath $currentUrl

    if (-not $sourcePath) {
      continue
    }

    $sourceExists = Test-Path $sourcePath
    $tier = $fieldToTier[$field]
    $extension = Get-ExtensionFromPath $sourcePath
    $targetUrl = "/images/portfolio/$tier/$($image.id)$extension"
    $targetPath = Get-LocalPublicPath $targetUrl

    $plan += [PSCustomObject]@{
      imageId = $image.id
      field = $field
      tier = $tier
      sourceUrl = $currentUrl
      targetUrl = $targetUrl
      sourceExists = $sourceExists
      copied = $false
      jsonUpdated = $false
    }

    if ($Apply -and $sourceExists) {
      New-Item -ItemType Directory -Force -Path (Split-Path $targetPath -Parent) | Out-Null
      Copy-Item -Force $sourcePath $targetPath
      $plan[-1].copied = $true
    }

    if ($UpdateJson) {
      $image.$field = $targetUrl
      $plan[-1].jsonUpdated = $true
    }
  }
}

$planPath = Join-Path $reportDir "rendition-migration-plan.csv"
$plan | Export-Csv -NoTypeInformation -Path $planPath

Write-Host ""
Write-Host "Rendition migration plan written to $planPath" -ForegroundColor Cyan
Write-Host "Records: $($plan.Count)"
Write-Host ""

$missing = @($plan | Where-Object { -not $_.sourceExists })

if ($missing.Count -gt 0) {
  Write-Host "Missing source files:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  $($_.sourceUrl)" }
  Write-Host ""
}

if ($UpdateJson) {
  $json = $images | ConvertTo-Json -Depth 20
  Set-Content -Path $jsonPath -Value $json
  Write-Host "Updated $jsonPath" -ForegroundColor Green
}

if ($Apply) {
  Write-Host "Copied files into public\images\portfolio\{display,thumb,texture,full}" -ForegroundColor Green
} else {
  Write-Host "Dry run only. Re-run with -Apply to copy files." -ForegroundColor Yellow
}

if (-not $UpdateJson) {
  Write-Host "JSON was not updated. Add -UpdateJson when you are ready to switch paths." -ForegroundColor Yellow
}
