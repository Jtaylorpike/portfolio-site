param([string]$ProjectRoot = ".")
$ErrorActionPreference = "Stop"
$root = Resolve-Path $ProjectRoot
Set-Location $root
$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
if (-not (Test-Path "public\images")) { throw "Could not find public\images." }

$rows = @(Get-ChildItem "public\images" -File -Recurse | ForEach-Object {
  $relative = $_.FullName.Substring((Resolve-Path "public\images").Path.Length).TrimStart("\")
  $parts = $relative -split "\\"
  [PSCustomObject]@{
    path = $_.FullName.Substring($root.Path.Length + 1)
    section = if ($parts.Count -ge 1) { $parts[0] } else { "" }
    rendition = if ($parts.Count -ge 3 -and $parts[0] -eq "portfolio") { $parts[1] } else { "" }
    extension = $_.Extension.ToLowerInvariant()
    sizeBytes = $_.Length
  }
})

$rows | Export-Csv -NoTypeInformation -Path "$reportDir\public-image-structure-files.csv"

$bySection = @($rows | Group-Object section | Sort-Object Name | ForEach-Object {
  [PSCustomObject]@{ section = $_.Name; files = $_.Count; sizeBytes = ($_.Group | Measure-Object sizeBytes -Sum).Sum }
})
$byRendition = @($rows | Where-Object { $_.section -eq "portfolio" } | Group-Object rendition | Sort-Object Name | ForEach-Object {
  [PSCustomObject]@{ rendition = $_.Name; files = $_.Count; sizeBytes = ($_.Group | Measure-Object sizeBytes -Sum).Sum }
})

$bySection | Export-Csv -NoTypeInformation -Path "$reportDir\public-image-structure-by-section.csv"
$byRendition | Export-Csv -NoTypeInformation -Path "$reportDir\public-image-structure-by-rendition.csv"

$lines = @("Public image structure summary", "", "Total files: $($rows.Count)", "Total size bytes: $(($rows | Measure-Object sizeBytes -Sum).Sum)", "", "By section:")
foreach ($row in $bySection) { $lines += "  $($row.section): $($row.files) files, $($row.sizeBytes) bytes" }
$lines += ""
$lines += "Portfolio renditions:"
foreach ($row in $byRendition) { $lines += "  $($row.rendition): $($row.files) files, $($row.sizeBytes) bytes" }
Set-Content -Path "$reportDir\public-image-structure-summary.txt" -Value $lines
Write-Host "Summary written to asset-reports\public-image-structure-summary.txt" -ForegroundColor Cyan
