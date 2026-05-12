param(
  [string]$ProjectRoot = ".",
  [switch]$Apply,
  [switch]$IncludePackNotes,
  [switch]$KeepFragmentsAtRoot
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportDir = "asset-reports"
$archiveDir = "asset-archive\changelog-fragments-$timestamp"
$notesArchiveDir = "asset-archive\replacement-pack-notes-$timestamp"

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$changelogPath = "PROJECT_CHANGELOG.md"

if (-not (Test-Path $changelogPath)) {
  throw "PROJECT_CHANGELOG.md was not found."
}

$fragments = @(Get-ChildItem "PROJECT_CHANGELOG_APPEND_*.md" -File -ErrorAction SilentlyContinue | Sort-Object Name)
$packNotes = @(Get-ChildItem "REPLACEMENT_PACK_NOTES.md" -File -ErrorAction SilentlyContinue)

$rows = @()

foreach ($fragment in $fragments) {
  $rows += [PSCustomObject]@{
    sourcePath = $fragment.Name
    action = if ($KeepFragmentsAtRoot) { "append-only" } else { "append-and-archive" }
    archivePath = Join-Path $archiveDir $fragment.Name
  }
}

if ($IncludePackNotes -and $packNotes.Count -gt 0) {
  foreach ($note in $packNotes) {
    $rows += [PSCustomObject]@{
      sourcePath = $note.Name
      action = if ($KeepFragmentsAtRoot) { "archive-skipped" } else { "archive-only" }
      archivePath = Join-Path $notesArchiveDir $note.Name
    }
  }
}

$rows | Export-Csv -NoTypeInformation -Path "$reportDir\changelog-fragment-consolidation-plan.csv"

$lines = @()
$lines += "Changelog fragment consolidation plan"
$lines += "Generated: $timestamp"
$lines += ""
$lines += "Apply enabled: $($Apply.IsPresent)"
$lines += "Keep fragments at root: $($KeepFragmentsAtRoot.IsPresent)"
$lines += "Include pack notes: $($IncludePackNotes.IsPresent)"
$lines += "Fragments found: $($fragments.Count)"
$lines += "Rows: $($rows.Count)"
$lines += ""

if ($rows.Count -eq 0) {
  $lines += "No changelog fragments found."
} else {
  foreach ($row in $rows) {
    $lines += "$($row.action) | $($row.sourcePath) -> $($row.archivePath)"
  }
}

Set-Content -Path "$reportDir\changelog-fragment-consolidation-plan.txt" -Value $lines

Write-Host ""
Write-Host "Changelog fragments found: $($fragments.Count)"
Write-Host "Plan written to asset-reports\changelog-fragment-consolidation-plan.txt" -ForegroundColor Cyan

if ($fragments.Count -eq 0 -and $packNotes.Count -eq 0) {
  exit 0
}

if (-not $Apply) {
  Write-Host "Dry run only. Re-run with -Apply after reviewing the plan." -ForegroundColor Yellow
  exit 0
}

if ($fragments.Count -gt 0) {
  Add-Content -Path $changelogPath -Value ""
  Add-Content -Path $changelogPath -Value "---"
  Add-Content -Path $changelogPath -Value ""
  Add-Content -Path $changelogPath -Value "## Appended changelog fragments - $timestamp"
  Add-Content -Path $changelogPath -Value ""

  foreach ($fragment in $fragments) {
    Add-Content -Path $changelogPath -Value ""
    Add-Content -Path $changelogPath -Value (Get-Content $fragment.FullName -Raw)
  }

  if (-not $KeepFragmentsAtRoot) {
    New-Item -ItemType Directory -Force -Path $archiveDir | Out-Null

    foreach ($fragment in $fragments) {
      Move-Item -Force $fragment.FullName (Join-Path $archiveDir $fragment.Name)
    }
  }
}

if ($IncludePackNotes -and $packNotes.Count -gt 0 -and -not $KeepFragmentsAtRoot) {
  New-Item -ItemType Directory -Force -Path $notesArchiveDir | Out-Null

  foreach ($note in $packNotes) {
    Move-Item -Force $note.FullName (Join-Path $notesArchiveDir $note.Name)
  }
}

Write-Host "Changelog fragments consolidated." -ForegroundColor Green

if (-not $KeepFragmentsAtRoot) {
  Write-Host "Fragments were moved into asset-archive." -ForegroundColor Green
}

Write-Host "Do not commit asset-archive." -ForegroundColor Yellow
