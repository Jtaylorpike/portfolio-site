param(
  [string]$ProjectRoot = ".",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path $ProjectRoot
Set-Location $root

$sourceFile = "src\data\images.ts"
$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

if (-not (Test-Path $sourceFile)) {
  throw "Could not find $sourceFile."
}

$mapping = @(
  [PSCustomObject]@{ oldUrl="/images/card-optimized/climbing-01.webp"; newUrl="/images/ui/cards/climbing.webp" }
  [PSCustomObject]@{ oldUrl="/images/card-optimized/commercial-01.webp"; newUrl="/images/ui/cards/commercial.webp" }
  [PSCustomObject]@{ oldUrl="/images/card-optimized/personal-01.webp"; newUrl="/images/ui/cards/personal.webp" }
  [PSCustomObject]@{ oldUrl="/images/card-optimized/portrait-01.webp"; newUrl="/images/ui/cards/portraits.webp" }
  [PSCustomObject]@{ oldUrl="/images/card-optimized/product-01.webp"; newUrl="/images/ui/cards/product-brand.webp" }
)

function Get-LocalPublicPath([string]$url) {
  return Join-Path "public" ($url.TrimStart("/") -replace "/", "\")
}

$rows = @()
$content = Get-Content $sourceFile -Raw

foreach ($item in $mapping) {
  $oldPath = Get-LocalPublicPath $item.oldUrl
  $newPath = Get-LocalPublicPath $item.newUrl
  $isReferenced = $content.Contains($item.oldUrl)

  $rows += [PSCustomObject]@{
    oldUrl = $item.oldUrl
    newUrl = $item.newUrl
    oldExists = Test-Path $oldPath
    newExists = Test-Path $newPath
    referencedInImagesTs = $isReferenced
  }

  if ($Apply) {
    if (Test-Path $oldPath) {
      New-Item -ItemType Directory -Force -Path (Split-Path $newPath -Parent) | Out-Null
      Copy-Item -Force $oldPath $newPath
    }

    $content = $content.Replace($item.oldUrl, $item.newUrl)
  }
}

$rows | Export-Csv -NoTypeInformation -Path "$reportDir\card-image-ui-migration-plan.csv"

$lines = @("Card image UI migration plan","")
foreach ($row in $rows) {
  $lines += "$($row.oldUrl) -> $($row.newUrl) | oldExists=$($row.oldExists) | referenced=$($row.referencedInImagesTs)"
}
Set-Content -Path "$reportDir\card-image-ui-migration-plan.txt" -Value $lines

Write-Host ""
Write-Host "Plan written to asset-reports\card-image-ui-migration-plan.txt" -ForegroundColor Cyan

if ($Apply) {
  Set-Content -Path $sourceFile -Value $content
  Write-Host "Copied card files into public\images\ui\cards and updated src\data\images.ts" -ForegroundColor Green
} else {
  Write-Host "Dry run only. Re-run with -Apply after reviewing the plan." -ForegroundColor Yellow
}
