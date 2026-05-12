param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$editorRoot = "local-editor"

if (-not (Test-Path $editorRoot)) {
  throw "local-editor folder was not found."
}

$patterns = @(
  [PSCustomObject]@{ label = "stale-public-data"; pattern = "public/data" }
  [PSCustomObject]@{ label = "stale-public-data-windows"; pattern = "public\data" }
  [PSCustomObject]@{ label = "old-gallery-optimized-folder"; pattern = "/images/gallery-optimized" }
  [PSCustomObject]@{ label = "old-card-optimized-folder"; pattern = "/images/card-optimized" }
  [PSCustomObject]@{ label = "old-imported-folder"; pattern = "/images/imported" }
  [PSCustomObject]@{ label = "old-category-climbing-folder"; pattern = "/images/climbing" }
  [PSCustomObject]@{ label = "old-category-landscape-folder"; pattern = "/images/landscape" }
  [PSCustomObject]@{ label = "old-category-personal-folder"; pattern = "/images/personal" }
  [PSCustomObject]@{ label = "old-category-commercial-folder"; pattern = "/images/commercial" }
  [PSCustomObject]@{ label = "old-category-portraits-folder"; pattern = "/images/portraits" }
  [PSCustomObject]@{ label = "old-category-product-folder"; pattern = "/images/product-brand" }
)

$extensions = @(".py", ".js", ".css", ".html", ".md", ".json")
$files = @(Get-ChildItem $editorRoot -File -Recurse | Where-Object {
  $_.FullName -notlike "*\__pycache__\*" -and
  $_.FullName -notlike "*\backups\*" -and
  $extensions -contains $_.Extension.ToLowerInvariant()
})

$rows = New-Object System.Collections.Generic.List[object]

foreach ($file in $files) {
  $relativeFile = $file.FullName.Substring($root.Path.Length + 1)
  $lines = Get-Content $file.FullName

  for ($i = 0; $i -lt $lines.Count; $i += 1) {
    $line = $lines[$i]

    foreach ($item in $patterns) {
      if ($line.Contains($item.pattern)) {
        $rows.Add([PSCustomObject]@{
          file = $relativeFile
          line = $i + 1
          label = $item.label
          pattern = $item.pattern
          text = $line.Trim()
        }) | Out-Null
      }
    }
  }
}

$rowsArray = @($rows.ToArray())
$rowsArray | Export-Csv -NoTypeInformation -Path "$reportDir\local-editor-compatibility-findings.csv"

$linesOut = @()
$linesOut += "Local editor compatibility audit"
$linesOut += ""
$linesOut += "Files scanned: $($files.Count)"
$linesOut += "Findings:      $($rowsArray.Count)"
$linesOut += ""

if ($rowsArray.Count -eq 0) {
  $linesOut += "No stale image/data path patterns found in local-editor."
} else {
  foreach ($row in $rowsArray) {
    $linesOut += "$($row.file):$($row.line) | $($row.label) | $($row.text)"
  }
}

Set-Content -Path "$reportDir\local-editor-compatibility-findings.txt" -Value $linesOut

$contractChecks = @()
$contractChecks += [PSCustomObject]@{
  check = "active-data-galleryImages"
  expected = "src\data\galleryImages.json"
  exists = Test-Path "src\data\galleryImages.json"
}
$contractChecks += [PSCustomObject]@{
  check = "active-data-categories"
  expected = "src\data\categories.json"
  exists = Test-Path "src\data\categories.json"
}
$contractChecks += [PSCustomObject]@{
  check = "active-data-heroSlides"
  expected = "src\data\heroSlides.json"
  exists = Test-Path "src\data\heroSlides.json"
}
$contractChecks += [PSCustomObject]@{
  check = "public-data-removed"
  expected = "public\data should not exist"
  exists = -not (Test-Path "public\data")
}
$contractChecks += [PSCustomObject]@{
  check = "portfolio-display-folder"
  expected = "public\images\portfolio\display"
  exists = Test-Path "public\images\portfolio\display"
}
$contractChecks += [PSCustomObject]@{
  check = "portfolio-full-folder"
  expected = "public\images\portfolio\full"
  exists = Test-Path "public\images\portfolio\full"
}
$contractChecks += [PSCustomObject]@{
  check = "portfolio-thumb-folder"
  expected = "public\images\portfolio\thumb"
  exists = Test-Path "public\images\portfolio\thumb"
}
$contractChecks += [PSCustomObject]@{
  check = "portfolio-texture-folder"
  expected = "public\images\portfolio\texture"
  exists = Test-Path "public\images\portfolio\texture"
}

$contractChecks | Export-Csv -NoTypeInformation -Path "$reportDir\local-editor-pipeline-contract-checks.csv"

$contractLines = @()
$contractLines += "Local editor pipeline contract checks"
$contractLines += ""
foreach ($check in $contractChecks) {
  $status = if ($check.exists) { "PASS" } else { "FAIL" }
  $contractLines += "$status | $($check.check) | $($check.expected)"
}
Set-Content -Path "$reportDir\local-editor-pipeline-contract-checks.txt" -Value $contractLines

Write-Host ""
Write-Host "Local editor files scanned: $($files.Count)"
Write-Host "Compatibility findings:     $($rowsArray.Count)"
Write-Host "Reports written to asset-reports\" -ForegroundColor Cyan

if ($rowsArray.Count -gt 0) {
  Write-Host "Stale editor path references were found. Review local-editor-compatibility-findings.txt before changing editor behavior." -ForegroundColor Yellow
}
