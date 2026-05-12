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

      if ($relative -like "public\images\*") {
        return $false
      }

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

$referenceLocationsPath = "$reportDir\public-image-reference-locations.csv"
$referencedExistingPath = "$reportDir\public-image-referenced-existing.txt"
$missingPath = "$reportDir\public-image-missing.txt"
$unreferencedPath = "$reportDir\public-image-unreferenced.txt"
$summaryPath = "$reportDir\public-image-reference-summary.txt"

# Always overwrite every report file. Windows PowerShell may skip Set-Content
# when an empty array is piped into it, which can leave stale rows from a prior run.
Remove-Item -Force -ErrorAction SilentlyContinue $referenceLocationsPath, $referencedExistingPath, $missingPath, $unreferencedPath, $summaryPath

$referenceRows.ToArray() | Export-Csv -NoTypeInformation -Path $referenceLocationsPath

if ($referencedExisting.Count -gt 0) {
  Set-Content -Path $referencedExistingPath -Value $referencedExisting
} else {
  New-Item -ItemType File -Force -Path $referencedExistingPath | Out-Null
}

if ($missing.Count -gt 0) {
  Set-Content -Path $missingPath -Value $missing
} else {
  New-Item -ItemType File -Force -Path $missingPath | Out-Null
}

if ($unreferenced.Count -gt 0) {
  Set-Content -Path $unreferencedPath -Value $unreferenced
} else {
  New-Item -ItemType File -Force -Path $unreferencedPath | Out-Null
}

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

Set-Content -Path $summaryPath -Value $summary

Write-Host ""
Write-Host "Referenced existing files: $($referencedExisting.Count)"
Write-Host "Missing referenced files:  $($missing.Count)"
Write-Host "Unreferenced files:       $($unreferenced.Count)"
Write-Host "Reports written to asset-reports\" -ForegroundColor Cyan

if ($missing.Count -gt 0) {
  Write-Host "Missing referenced image files were found." -ForegroundColor Red
}

if ($unreferenced.Count -gt 0) {
  Write-Host "Unreferenced public image files can be moved to asset-archive after review." -ForegroundColor Yellow
}
