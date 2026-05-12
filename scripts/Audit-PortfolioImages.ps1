param([string]$ProjectRoot = ".")
$ErrorActionPreference = "Stop"
$root = Resolve-Path $ProjectRoot
Set-Location $root
$sourceFiles = @("src\data\images.ts","src\data\galleryImages.json","src\data\heroSlides.json","src\data\categories.json","src\styles\global.css") | Where-Object { Test-Path $_ }
if (-not (Test-Path "public\images")) { throw "public\images does not exist." }
$referenced = New-Object System.Collections.Generic.HashSet[string]
foreach ($file in $sourceFiles) {
  $content = Get-Content $file -Raw
  $matches = [regex]::Matches($content, '["''(](/images/[^"''\)]+)')
  foreach ($match in $matches) { [void]$referenced.Add($match.Groups[1].Value) }
}
$allImageFiles = @(Get-ChildItem "public\images" -File -Recurse | ForEach-Object { $_.FullName.Substring((Resolve-Path "public").Path.Length).Replace("\", "/") })
$missing = @($referenced | Where-Object { $path = Join-Path "public" ($_.TrimStart("/") -replace "/", "\"); -not (Test-Path $path) } | Sort-Object)
$unreferenced = @($allImageFiles | Where-Object { -not $referenced.Contains($_) } | Sort-Object)
$referencedExisting = @($referenced | Where-Object { $path = Join-Path "public" ($_.TrimStart("/") -replace "/", "\"); Test-Path $path } | Sort-Object)
$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
Set-Content -Path (Join-Path $reportDir "referenced-images.txt") -Value $referencedExisting
Set-Content -Path (Join-Path $reportDir "missing-images.txt") -Value $missing
Set-Content -Path (Join-Path $reportDir "unreferenced-images.txt") -Value $unreferenced
$summary = @(
  "Referenced image files found locally: $($referencedExisting.Count)",
  "Referenced image files missing:       $($missing.Count)",
  "Unreferenced files in public/images:  $($unreferenced.Count)", "",
  "If missing-images.txt is empty, all referenced image files exist locally.",
  "If unreferenced-images.txt has entries, those files are not referenced by the current source scan."
)
Set-Content -Path (Join-Path $reportDir "summary.txt") -Value $summary
Write-Host ""
Write-Host "Referenced image files found locally: $($referencedExisting.Count)"
Write-Host "Referenced image files missing:       $($missing.Count)"
Write-Host "Unreferenced files in public/images:  $($unreferenced.Count)"
Write-Host ""
Write-Host "Reports written to $reportDir\" -ForegroundColor Cyan
