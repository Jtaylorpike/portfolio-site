<#
Moves root-level pack note and manifest files into docs folders.

Run from the project root after applying a replacement pack:
  .\scripts\Move-PackDocsIntoDocs.ps1

This is intentionally conservative. It only moves files that match the pack
note/manifest naming convention from the project root, and it will not overwrite
an existing destination file.
#>

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PackNotesDir = Join-Path $ProjectRoot "docs\pack-notes"
$PackManifestsDir = Join-Path $ProjectRoot "docs\pack-manifests"

New-Item -ItemType Directory -Force -Path $PackNotesDir | Out-Null
New-Item -ItemType Directory -Force -Path $PackManifestsDir | Out-Null

$MovedCount = 0

Get-ChildItem -Path $ProjectRoot -File -Filter "PACK_NOTES_*.md" | ForEach-Object {
  $Destination = Join-Path $PackNotesDir $_.Name
  if (Test-Path $Destination) {
    Write-Host "Skipping existing destination: $Destination"
    return
  }
  Move-Item -LiteralPath $_.FullName -Destination $Destination
  Write-Host "Moved $($_.Name) -> docs\pack-notes"
  $script:MovedCount++
}

Get-ChildItem -Path $ProjectRoot -File -Filter "PACK_MANIFEST_*.txt" | ForEach-Object {
  $Destination = Join-Path $PackManifestsDir $_.Name
  if (Test-Path $Destination) {
    Write-Host "Skipping existing destination: $Destination"
    return
  }
  Move-Item -LiteralPath $_.FullName -Destination $Destination
  Write-Host "Moved $($_.Name) -> docs\pack-manifests"
  $script:MovedCount++
}

Write-Host "Done. Moved $MovedCount pack documentation file(s)."
