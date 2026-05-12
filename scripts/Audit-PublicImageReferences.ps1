param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

if (-not (Test-Path "public\images")) {
  throw "Could not find public\images."
}

$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

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
$referenceRows = New-Object System.Collections.Generic.List[object]

foreach ($searchRoot in $searchRoots) {
  $files = Get-ChildItem $searchRoot -File -Recurse |
    Where-Object {
      $relative = $_.FullName.Substring($root.Path.Length + 1)
      $topLevel = $relative.Split("\")[0]

      if ($excludedTopLevel -contains $topLevel) {
        return $false
      }

      # Do not scan image files for references.
      if ($relative -like "public\images\*") {
        return $false
      }

      # public/data is intentionally scanned if it exists. If stale public data
      # contains broken image references, archive it with Archive-StalePublicData.ps1.
      $_.Extension -in @(".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".html", ".md")
    }

  foreach ($file in $files) {
    $relativeFile = $file.FullName.Substring($root.Path.Length + 1)
    $content = Get-Content $file.FullName -Raw

    $matches = [regex]::Matches($content, '["''(](/images/[^"''\)\s]+)')

    foreach ($match in $matches) {
      $url = $match.Groups[1].Value
      [void]$referenced.Add($url)

      $referenceRows.Add([PSCustomObject]@{
        file = $relativeFile
        url = $url
      }) | Out-Null
    }
  }
}

$allPublicImages = @(Get-ChildItem "public\images" -File -Recurse | ForEach-Object {
  $_.FullName.Substring((Resolve-Path "public").Path.Length).Replace("\", "/")
})

$missing = @(
  $referenced | Where-Object {
    $localPath = Join-Path "public" ($_.TrimStart("/") -replace "/", "\")
    -not (Test-Path $localPath)
  } | Sort-Object
)

$unreferenced = @(
  $allPublicImages | Where-Object {
    -not $referenced.Contains($_)
  } | Sort-Object
)

$referencedExisting = @(
  $referenced | Where-Object {
    $localPath = Join-Path "public" ($_.TrimStart("/") -replace "/", "\")
    Test-Path $localPath
  } | Sort-Object
)

$referenceRows.ToArray() | Export-Csv -NoTypeInformation -Path "$reportDir\public-image-reference-locations.csv"
$referencedExisting | Set-Content "$reportDir\public-image-referenced-existing.txt"
$missing | Set-Content "$reportDir\public-image-missing.txt"
$unreferenced | Set-Content "$reportDir\public-image-unreferenced.txt"

$summary = @(
  "Public image reference audit"
  "Referenced existing files: $($referencedExisting.Count)"
  "Missing referenced files:  $($missing.Count)"
  "Unreferenced files:       $($unreferenced.Count)"
  ""
  "Reports:"
  "asset-reports\public-image-reference-locations.csv"
  "asset-reports\public-image-referenced-existing.txt"
  "asset-reports\public-image-missing.txt"
  "asset-reports\public-image-unreferenced.txt"
)

Set-Content -Path "$reportDir\public-image-reference-summary.txt" -Value $summary

Write-Host ""
Write-Host "Referenced existing files: $($referencedExisting.Count)"
Write-Host "Missing referenced files:  $($missing.Count)"
Write-Host "Unreferenced files:       $($unreferenced.Count)"
Write-Host "Reports written to asset-reports\" -ForegroundColor Cyan

if ($missing.Count -gt 0) {
  Write-Host "Missing referenced image files were found." -ForegroundColor Red
  Write-Host "If the references come from public\data, run Archive-StalePublicData.ps1 before archiving images." -ForegroundColor Yellow
}

if ($unreferenced.Count -gt 0) {
  Write-Host "Unreferenced public image files can be moved to asset-archive after review." -ForegroundColor Yellow
}
