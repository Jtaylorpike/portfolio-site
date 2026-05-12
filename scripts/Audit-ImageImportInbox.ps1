param(
  [string]$ProjectRoot = ".",
  [string]$SourceDir = "source-images\inbox"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$supportedExtensions = @(".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff")

if (-not (Test-Path $SourceDir)) {
  New-Item -ItemType Directory -Force -Path $SourceDir | Out-Null
}

$files = @(Get-ChildItem $SourceDir -File -Recurse | Where-Object {
  $supportedExtensions -contains $_.Extension.ToLowerInvariant()
})

$rows = @(
  foreach ($file in $files) {
    [PSCustomObject]@{
      path = $file.FullName.Substring($root.Path.Length + 1)
      name = $file.Name
      extension = $file.Extension.ToLowerInvariant()
      sizeBytes = $file.Length
      lastWriteTime = $file.LastWriteTime
    }
  }
)

$rows | Export-Csv -NoTypeInformation -Path "$reportDir\image-import-inbox.csv"

$lines = @()
$lines += "Image import inbox audit"
$lines += ""
$lines += "Source directory: $SourceDir"
$lines += "Supported files: $($rows.Count)"
$lines += ""
if ($rows.Count -eq 0) {
  $lines += "No supported image files found."
} else {
  foreach ($row in $rows) {
    $lines += "$($row.path) | $($row.sizeBytes) bytes"
  }
}

Set-Content -Path "$reportDir\image-import-inbox.txt" -Value $lines

Write-Host ""
Write-Host "Supported import files found: $($rows.Count)"
Write-Host "Report written to asset-reports\image-import-inbox.txt" -ForegroundColor Cyan
