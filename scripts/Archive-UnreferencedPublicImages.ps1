param(
  [string]$ProjectRoot = ".",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

if (-not (Test-Path "public\images")) {
  throw "Could not find public\images."
}

$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

# Run the reference audit logic first so this script never relies on a stale report.
$excludedTopLevel = @(
  "node_modules",
  "dist",
  ".git",
  "asset-archive",
  "asset-reports"
)

$searchRoots = @(
  "src",
  "public"
) | Where-Object { Test-Path $_ }

$referenced = New-Object System.Collections.Generic.HashSet[string]

foreach ($searchRoot in $searchRoots) {
  $files = Get-ChildItem $searchRoot -File -Recurse |
    Where-Object {
      $relative = $_.FullName.Substring($root.Path.Length + 1)
      $topLevel = $relative.Split("\")[0]

      if ($excludedTopLevel -contains $topLevel) {
        return $false
      }

      if ($relative -like "public\images\*") {
        return $false
      }

      $_.Extension -in @(".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".html", ".md")
    }

  foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $matches = [regex]::Matches($content, '["''(](/images/[^"''\)\s]+)')

    foreach ($match in $matches) {
      [void]$referenced.Add($match.Groups[1].Value)
    }
  }
}

$allPublicImageFiles = @(Get-ChildItem "public\images" -File -Recurse)

$unreferencedFiles = @(
  foreach ($file in $allPublicImageFiles) {
    $publicUrl = $file.FullName.Substring((Resolve-Path "public").Path.Length).Replace("\", "/")

    if (-not $referenced.Contains($publicUrl)) {
      $file
    }
  }
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveRoot = "asset-archive\public-images-unreferenced-$timestamp"

$rows = @(
  foreach ($file in $unreferencedFiles) {
    $relativeFromImages = $file.FullName.Substring((Resolve-Path "public\images").Path.Length).TrimStart("\")
    $target = Join-Path $archiveRoot $relativeFromImages

    [PSCustomObject]@{
      sourcePath = $file.FullName.Substring($root.Path.Length + 1)
      archivePath = $target
      sizeBytes = $file.Length
    }
  }
)

$rows | Export-Csv -NoTypeInformation -Path "$reportDir\archive-unreferenced-public-images-plan.csv"

$planLines = @()
$planLines += "Archive unreferenced public images plan"
$planLines += "Generated: $timestamp"
$planLines += ""
if ($rows.Count -eq 0) {
  $planLines += "No unreferenced public image files found."
} else {
  foreach ($row in $rows) {
    $planLines += "$($row.sourcePath) -> $($row.archivePath)"
  }
}
Set-Content -Path "$reportDir\archive-unreferenced-public-images-plan.txt" -Value $planLines

Write-Host ""
Write-Host "Unreferenced files found: $($rows.Count)"
Write-Host "Archive target: $archiveRoot"
Write-Host "Plan written to asset-reports\archive-unreferenced-public-images-plan.txt" -ForegroundColor Cyan
Write-Host ""

if ($rows.Count -eq 0) {
  exit 0
}

if (-not $Apply) {
  Write-Host "Dry run only. Re-run with -Apply after reviewing the plan." -ForegroundColor Yellow
  exit 0
}

foreach ($row in $rows) {
  New-Item -ItemType Directory -Force -Path (Split-Path $row.archivePath -Parent) | Out-Null
  Move-Item -Force $row.sourcePath $row.archivePath
}

# Remove empty image directories, deepest first.
Get-ChildItem "public\images" -Directory -Recurse |
  Sort-Object FullName -Descending |
  ForEach-Object {
    if (-not (Get-ChildItem $_.FullName -Force)) {
      Remove-Item $_.FullName -Force
    }
  }

Write-Host "Moved unreferenced files to $archiveRoot" -ForegroundColor Green
Write-Host "Do not delete this archive unless you have backed it up or intentionally rejected those images." -ForegroundColor Yellow
