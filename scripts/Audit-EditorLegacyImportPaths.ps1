param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$filesToScan = @(
  "local-editor\app\image_importer.py",
  "local-editor\app\asset_manager.py",
  "local-editor\app\data_store.py",
  "local-editor\app\routes.py",
  "local-editor\editor.py"
) | Where-Object { Test-Path $_ }

$patterns = @(
  "/images/imported",
  "IMPORTED_IMAGES_DIR",
  "public/images/imported",
  "images\\imported"
)

$rows = @()

foreach ($file in $filesToScan) {
  $lines = Get-Content $file

  for ($index = 0; $index -lt $lines.Count; $index += 1) {
    $line = $lines[$index]

    foreach ($pattern in $patterns) {
      if ($line.Contains($pattern)) {
        $rows += [PSCustomObject]@{
          file = $file
          line = $index + 1
          pattern = $pattern
          text = $line.Trim()
        }
      }
    }
  }
}

$rows | Export-Csv -NoTypeInformation -Path "$reportDir\editor-legacy-import-paths.csv"

$linesOut = @()
$linesOut += "Editor legacy import path audit"
$linesOut += ""
$linesOut += "Findings: $($rows.Count)"
$linesOut += ""

if ($rows.Count -eq 0) {
  $linesOut += "No legacy /images/imported path references found in scanned editor backend files."
} else {
  foreach ($row in $rows) {
    $linesOut += "$($row.file):$($row.line) | $($row.pattern) | $($row.text)"
  }
}

Set-Content -Path "$reportDir\editor-legacy-import-paths.txt" -Value $linesOut

Write-Host ""
Write-Host "Legacy editor import path findings: $($rows.Count)"
Write-Host "Report written to asset-reports\editor-legacy-import-paths.txt" -ForegroundColor Cyan

if ($rows.Count -gt 0) {
  Write-Host "Legacy editor import paths were found. Apply the replacement editor import files from this pack." -ForegroundColor Yellow
}
