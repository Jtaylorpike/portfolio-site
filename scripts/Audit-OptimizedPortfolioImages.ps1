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

$images = @(Get-Content $jsonPath -Raw | ConvertFrom-Json)

if ($images.Count -eq 1 -and $images[0] -is [System.Array]) {
  $images = @($images[0])
}

$fieldRules = @(
  [PSCustomObject]@{ field = "src"; expected = "/images/portfolio/display/" }
  [PSCustomObject]@{ field = "thumbSrc"; expected = "/images/portfolio/thumb/" }
  [PSCustomObject]@{ field = "textureSrc"; expected = "/images/portfolio/texture/" }
  [PSCustomObject]@{ field = "fullSrc"; expected = "/images/portfolio/full/" }
)

$rows = @()

foreach ($image in $images) {
  foreach ($rule in $fieldRules) {
    $property = $image.PSObject.Properties[$rule.field]

    if ($null -eq $property -or [string]::IsNullOrWhiteSpace([string]$property.Value)) {
      $rows += [PSCustomObject]@{
        imageId = $image.id
        field = $rule.field
        value = ""
        expectedPrefix = $rule.expected
        exists = $false
        prefixOk = $false
      }
      continue
    }

    $value = [string]$property.Value
    $localPath = Join-Path "public" ($value.TrimStart("/") -replace "/", "\")
    $rows += [PSCustomObject]@{
      imageId = $image.id
      field = $rule.field
      value = $value
      expectedPrefix = $rule.expected
      exists = Test-Path $localPath
      prefixOk = $value.StartsWith($rule.expected)
    }
  }
}

$missing = @($rows | Where-Object { -not $_.exists })
$badPrefix = @($rows | Where-Object { -not $_.prefixOk })

$rows | Export-Csv -NoTypeInformation -Path "$reportDir\optimized-image-audit.csv"
$missing | Export-Csv -NoTypeInformation -Path "$reportDir\optimized-image-missing.csv"
$badPrefix | Export-Csv -NoTypeInformation -Path "$reportDir\optimized-image-prefix-violations.csv"

$summary = @(
  "Optimized portfolio image audit"
  "Image records scanned:    $($images.Count)"
  "Image field rows scanned: $($rows.Count)"
  "Missing files:            $($missing.Count)"
  "Prefix violations:        $($badPrefix.Count)"
  ""
  "Expected prefixes:"
  "src        -> /images/portfolio/display/"
  "thumbSrc   -> /images/portfolio/thumb/"
  "textureSrc -> /images/portfolio/texture/"
  "fullSrc    -> /images/portfolio/full/"
)

Set-Content -Path "$reportDir\optimized-image-audit-summary.txt" -Value $summary

Write-Host ""
Write-Host "Image records scanned:    $($images.Count)"
Write-Host "Image field rows scanned: $($rows.Count)"
Write-Host "Missing files:            $($missing.Count)"
Write-Host "Prefix violations:        $($badPrefix.Count)"
Write-Host "Reports written to asset-reports\" -ForegroundColor Cyan

if ($missing.Count -eq 0 -and $badPrefix.Count -eq 0) {
  Write-Host "Optimized image structure looks clean." -ForegroundColor Green
} else {
  Write-Host "Review optimized-image-missing.csv and optimized-image-prefix-violations.csv." -ForegroundColor Yellow
}
