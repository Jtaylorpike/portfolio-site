param(
  [string]$ProjectRoot = ".",
  [switch]$Apply,
  [switch]$UpdateJson
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$jsonPath = "src\data\galleryImages.json"
$reportDir = "asset-reports"
$backupDir = "asset-archive\json-backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if (-not (Test-Path $jsonPath)) {
  throw "Could not find $jsonPath."
}

if (-not (Test-Path "public\images")) {
  throw "Could not find public\images."
}

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$jsonRaw = Get-Content $jsonPath -Raw
$images = @($jsonRaw | ConvertFrom-Json)

# Some PowerShell versions unwrap JSON arrays differently. This keeps the
# migration stable when galleryImages.json is an array of image records.
if ($images.Count -eq 1 -and $images[0] -is [System.Array]) {
  $images = @($images[0])
}

$fieldToRendition = [ordered]@{
  src = "display"
  thumbSrc = "thumb"
  textureSrc = "texture"
  fullSrc = "full"
}

function Test-IsExternalOrSpecialUrl([string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $false
  }

  return $value -match "^(https?:|data:|blob:|#)"
}

function Get-LocalPublicPath([string]$publicUrl) {
  if ([string]::IsNullOrWhiteSpace($publicUrl)) {
    return $null
  }

  if (Test-IsExternalOrSpecialUrl $publicUrl) {
    return $null
  }

  $clean = $publicUrl.TrimStart("/") -replace "/", "\"
  return Join-Path "public" $clean
}

function Get-FileExtension([string]$pathOrUrl) {
  $extension = [System.IO.Path]::GetExtension($pathOrUrl)

  if ([string]::IsNullOrWhiteSpace($extension)) {
    return ".webp"
  }

  return $extension.ToLowerInvariant()
}

function Get-CanonicalPortfolioUrl([string]$imageId, [string]$rendition, [string]$sourcePathOrUrl) {
  $extension = Get-FileExtension $sourcePathOrUrl
  return "/images/portfolio/$rendition/$imageId$extension"
}

function Get-ObjectPropertyValue($object, [string]$propertyName) {
  $property = $object.PSObject.Properties[$propertyName]

  if ($null -eq $property) {
    return $null
  }

  return [string]$property.Value
}

function Set-ObjectPropertyValue($object, [string]$propertyName, [string]$value) {
  $property = $object.PSObject.Properties[$propertyName]

  if ($null -eq $property) {
    $object | Add-Member -NotePropertyName $propertyName -NotePropertyValue $value
  } else {
    $property.Value = $value
  }
}

$plan = New-Object System.Collections.Generic.List[object]
$missing = New-Object System.Collections.Generic.List[object]
$skippedExternal = New-Object System.Collections.Generic.List[object]

foreach ($image in $images) {
  $imageId = Get-ObjectPropertyValue $image "id"
  $title = Get-ObjectPropertyValue $image "title"

  if ([string]::IsNullOrWhiteSpace($imageId)) {
    continue
  }

  foreach ($field in $fieldToRendition.Keys) {
    $currentUrl = Get-ObjectPropertyValue $image $field

    if ([string]::IsNullOrWhiteSpace($currentUrl)) {
      continue
    }

    if (Test-IsExternalOrSpecialUrl $currentUrl) {
      $skippedExternal.Add([PSCustomObject]@{
        imageId = $imageId
        title = $title
        field = $field
        url = $currentUrl
      }) | Out-Null
      continue
    }

    $rendition = $fieldToRendition[$field]
    $sourcePath = Get-LocalPublicPath $currentUrl
    $sourceExists = $false

    if ($sourcePath) {
      $sourceExists = Test-Path $sourcePath
    }

    $targetUrl = Get-CanonicalPortfolioUrl $imageId $rendition $currentUrl
    $targetPath = Get-LocalPublicPath $targetUrl
    $alreadyCanonical = $currentUrl -eq $targetUrl

    $row = [PSCustomObject]@{
      imageId = $imageId
      title = $title
      field = $field
      rendition = $rendition
      sourceUrl = $currentUrl
      sourcePath = $sourcePath
      sourceExists = $sourceExists
      targetUrl = $targetUrl
      targetPath = $targetPath
      alreadyCanonical = $alreadyCanonical
      copied = $false
      jsonUpdated = $false
    }

    if (-not $sourceExists) {
      $missing.Add($row) | Out-Null
      $plan.Add($row) | Out-Null
      continue
    }

    if ($Apply -and -not $alreadyCanonical) {
      New-Item -ItemType Directory -Force -Path (Split-Path $targetPath -Parent) | Out-Null
      Copy-Item -Force $sourcePath $targetPath
      $row.copied = $true
    }

    if ($UpdateJson) {
      Set-ObjectPropertyValue $image $field $targetUrl
      $row.jsonUpdated = $true
    }

    $plan.Add($row) | Out-Null
  }
}

$planPath = Join-Path $reportDir "rendition-migration-plan.csv"
$planTextPath = Join-Path $reportDir "rendition-migration-plan.txt"
$missingPath = Join-Path $reportDir "rendition-migration-missing-sources.csv"
$missingTextPath = Join-Path $reportDir "rendition-migration-missing-sources.txt"
$skippedExternalPath = Join-Path $reportDir "rendition-migration-skipped-external.csv"
$summaryPath = Join-Path $reportDir "rendition-migration-summary.txt"

$planArray = @($plan.ToArray())
$missingArray = @($missing.ToArray())
$skippedExternalArray = @($skippedExternal.ToArray())

$planArray | Export-Csv -NoTypeInformation -Path $planPath
$missingArray | Export-Csv -NoTypeInformation -Path $missingPath
$skippedExternalArray | Export-Csv -NoTypeInformation -Path $skippedExternalPath

$planLines = @()
$planLines += "Portfolio image rendition migration plan"
$planLines += "Generated: $timestamp"
$planLines += ""
foreach ($row in $planArray) {
  $status = if ($row.sourceExists) { "OK" } else { "MISSING" }
  $planLines += "$status | $($row.imageId) | $($row.field) | $($row.sourceUrl) -> $($row.targetUrl)"
}
Set-Content -Path $planTextPath -Value $planLines

$missingLines = @()
$missingLines += "Missing source files"
$missingLines += "Generated: $timestamp"
$missingLines += ""
if ($missingArray.Count -eq 0) {
  $missingLines += "No missing source files."
} else {
  foreach ($row in $missingArray) {
    $missingLines += "$($row.imageId) | $($row.field) | $($row.sourceUrl)"
  }
}
Set-Content -Path $missingTextPath -Value $missingLines

$summary = @(
  "Portfolio image rendition migration"
  "Generated: $timestamp"
  ""
  "Image records scanned:      $($images.Count)"
  "Plan rows:                  $($planArray.Count)"
  "Missing source rows:        $($missingArray.Count)"
  "Skipped external rows:      $($skippedExternalArray.Count)"
  "Apply enabled:              $($Apply.IsPresent)"
  "UpdateJson enabled:         $($UpdateJson.IsPresent)"
  ""
  "CSV report:"
  $planPath
  ""
  "Readable text report:"
  $planTextPath
  ""
  "Target folders:"
  "public/images/portfolio/display/"
  "public/images/portfolio/thumb/"
  "public/images/portfolio/texture/"
  "public/images/portfolio/full/"
  ""
  "Dry run command:"
  ".\scripts\Migrate-PublicImagesToRenditions.ps1"
  ""
  "Apply and update JSON command:"
  ".\scripts\Migrate-PublicImagesToRenditions.ps1 -Apply -UpdateJson"
)

Set-Content -Path $summaryPath -Value $summary

if ($UpdateJson) {
  $backupPath = Join-Path $backupDir "galleryImages-$timestamp.json"
  Copy-Item -Force $jsonPath $backupPath

  $json = $images | ConvertTo-Json -Depth 30
  Set-Content -Path $jsonPath -Value $json

  Write-Host ""
  Write-Host "Backed up original JSON to $backupPath" -ForegroundColor Cyan
  Write-Host "Updated $jsonPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "Image records scanned: $($images.Count)"
Write-Host "Plan rows:             $($planArray.Count)"
Write-Host "Missing source rows:   $($missingArray.Count)"
Write-Host "Skipped external rows: $($skippedExternalArray.Count)"
Write-Host ""
Write-Host "CSV plan:  $planPath" -ForegroundColor Cyan
Write-Host "Text plan: $planTextPath" -ForegroundColor Cyan
Write-Host "Summary:   $summaryPath" -ForegroundColor Cyan
Write-Host ""

if ($planArray.Count -eq 0) {
  Write-Host "No migration rows were generated. That means no image fields were found in galleryImages.json." -ForegroundColor Red
  Write-Host "Confirm that galleryImages.json contains src, thumbSrc, textureSrc, or fullSrc fields." -ForegroundColor Yellow
}

if ($missingArray.Count -gt 0) {
  Write-Host "Some source files are missing. Review $missingTextPath before applying." -ForegroundColor Red
}

if (-not $Apply) {
  Write-Host "Dry run only. Re-run with -Apply -UpdateJson when the plan looks correct." -ForegroundColor Yellow
} else {
  Write-Host "Copied files into public\images\portfolio\..." -ForegroundColor Green
}
