param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$jsonPath = "src\data\galleryImages.json"
$reportDir = "asset-reports"

if (-not (Test-Path $jsonPath)) {
  throw "Could not find $jsonPath."
}

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$jsonRaw = Get-Content $jsonPath -Raw
$images = @($jsonRaw | ConvertFrom-Json)

if ($images.Count -eq 1 -and $images[0] -is [System.Array]) {
  $images = @($images[0])
}

$fieldRules = @(
  [PSCustomObject]@{ field = "src"; expected = "/images/portfolio/display/" }
  [PSCustomObject]@{ field = "thumbSrc"; expected = "/images/portfolio/thumb/" }
  [PSCustomObject]@{ field = "textureSrc"; expected = "/images/portfolio/texture/" }
  [PSCustomObject]@{ field = "fullSrc"; expected = "/images/portfolio/full/" }
)

function Get-ObjectPropertyValue($object, [string]$propertyName) {
  $property = $object.PSObject.Properties[$propertyName]

  if ($null -eq $property) {
    return $null
  }

  return [string]$property.Value
}

$violations = New-Object System.Collections.Generic.List[object]

foreach ($image in $images) {
  $imageId = Get-ObjectPropertyValue $image "id"
  $title = Get-ObjectPropertyValue $image "title"

  foreach ($rule in $fieldRules) {
    $value = Get-ObjectPropertyValue $image $rule.field

    if ([string]::IsNullOrWhiteSpace($value)) {
      continue
    }

    if ($value -match "^(https?:|data:|blob:|#)") {
      continue
    }

    if (-not $value.StartsWith($rule.expected)) {
      $violations.Add([PSCustomObject]@{
        imageId = $imageId
        title = $title
        field = $rule.field
        currentValue = $value
        expectedPrefix = $rule.expected
      }) | Out-Null
    }
  }
}

$violationsArray = @($violations.ToArray())
$violationsPath = Join-Path $reportDir "rendition-structure-violations.csv"
$violationsTextPath = Join-Path $reportDir "rendition-structure-violations.txt"
$summaryPath = Join-Path $reportDir "rendition-structure-summary.txt"

$violationsArray | Export-Csv -NoTypeInformation -Path $violationsPath

$lines = @()
$lines += "Portfolio rendition structure violations"
$lines += ""
if ($violationsArray.Count -eq 0) {
  $lines += "No violations found."
} else {
  foreach ($row in $violationsArray) {
    $lines += "$($row.imageId) | $($row.field) | $($row.currentValue) | expected prefix: $($row.expectedPrefix)"
  }
}
Set-Content -Path $violationsTextPath -Value $lines

$summary = @(
  "Portfolio rendition structure audit"
  "Image records scanned: $($images.Count)"
  "Violations:            $($violationsArray.Count)"
  ""
  "Expected prefixes:"
  "src        -> /images/portfolio/display/"
  "thumbSrc   -> /images/portfolio/thumb/"
  "textureSrc -> /images/portfolio/texture/"
  "fullSrc    -> /images/portfolio/full/"
)

Set-Content -Path $summaryPath -Value $summary

Write-Host ""
Write-Host "Image records scanned: $($images.Count)"
Write-Host "Rendition structure violations: $($violationsArray.Count)"
Write-Host "CSV report:  $violationsPath" -ForegroundColor Cyan
Write-Host "Text report: $violationsTextPath" -ForegroundColor Cyan

if ($violationsArray.Count -gt 0) {
  Write-Host "Review the violations before considering the migration complete." -ForegroundColor Yellow
} else {
  Write-Host "Rendition structure looks clean." -ForegroundColor Green
}
