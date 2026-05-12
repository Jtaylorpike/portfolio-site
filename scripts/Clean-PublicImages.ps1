param(
  [string]$ProjectRoot = ".",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path $ProjectRoot
Set-Location $root

if (-not (Test-Path "public\images")) {
  throw "public\images does not exist."
}

$sourceFiles = @(
  "src\data\images.ts",
  "src\data\galleryImages.json",
  "src\data\heroSlides.json",
  "src\data\categories.json"
) | Where-Object { Test-Path $_ }

$referenced = New-Object System.Collections.Generic.HashSet[string]

foreach ($file in $sourceFiles) {
  $content = Get-Content $file -Raw
  $matches = [regex]::Matches($content, '["''](/images/[^"'']+)["'']')

  foreach ($match in $matches) {
    [void]$referenced.Add($match.Groups[1].Value)
  }
}

$allImageFiles = @(Get-ChildItem "public\images" -File -Recurse)
$unreferencedFiles = @(
  foreach ($file in $allImageFiles) {
    $relative = $file.FullName.Substring((Resolve-Path "public").Path.Length).Replace("\", "/")
    if (-not $referenced.Contains($relative)) {
      $file
    }
  }
)

if ($unreferencedFiles.Count -eq 0) {
  Write-Host "No unreferenced files found in public/images." -ForegroundColor Green
  exit 0
}

$archiveRoot = "asset-archive\unreferenced-public-images-$(Get-Date -Format yyyyMMdd-HHmmss)"

Write-Host ""
Write-Host "Unreferenced files found: $($unreferencedFiles.Count)" -ForegroundColor Yellow
Write-Host "Archive target: $archiveRoot"
Write-Host ""

foreach ($file in $unreferencedFiles) {
  $relativeFromImages = $file.FullName.Substring((Resolve-Path "public\images").Path.Length).TrimStart("\")
  $target = Join-Path $archiveRoot $relativeFromImages
  Write-Host "$($file.FullName) -> $target"

  if ($Apply) {
    New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
    Move-Item -Force $file.FullName $target
  }
}

if ($Apply) {
  Get-ChildItem "public\images" -Directory -Recurse |
    Sort-Object FullName -Descending |
    ForEach-Object {
      if (-not (Get-ChildItem $_.FullName -Force)) {
        Remove-Item $_.FullName -Force
      }
    }

  Write-Host ""
  Write-Host "Moved unreferenced files to $archiveRoot" -ForegroundColor Green
  Write-Host "Review the archive before deleting it permanently."
} else {
  Write-Host ""
  Write-Host "Dry run only. Re-run with -Apply to move these files." -ForegroundColor Cyan
}
