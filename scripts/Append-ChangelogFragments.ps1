param(
  [string]$ProjectRoot = ".",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path $ProjectRoot
Set-Location $root

$changelogPath = "PROJECT_CHANGELOG.md"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveRoot = "asset-archive\changelog-fragments-$timestamp"
$reportDir = "asset-reports"

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

if (-not (Test-Path $changelogPath)) {
  throw "PROJECT_CHANGELOG.md was not found."
}

$fragments = @(Get-ChildItem "PROJECT_CHANGELOG_APPEND_*.md" -File | Sort-Object Name)

$planLines = @()
$planLines += "Changelog fragment append plan"
$planLines += "Generated: $timestamp"
$planLines += ""

if ($fragments.Count -eq 0) {
  $planLines += "No PROJECT_CHANGELOG_APPEND_*.md files found."
} else {
  foreach ($fragment in $fragments) {
    $planLines += "$($fragment.Name) -> append to PROJECT_CHANGELOG.md, then move to $archiveRoot\$($fragment.Name)"
  }
}

Set-Content -Path "$reportDir\changelog-fragment-append-plan.txt" -Value $planLines

Write-Host ""
Write-Host "Changelog fragments found: $($fragments.Count)"
Write-Host "Plan written to asset-reports\changelog-fragment-append-plan.txt" -ForegroundColor Cyan

if ($fragments.Count -eq 0) { exit 0 }

if (-not $Apply) {
  Write-Host "Dry run only. Re-run with -Apply after reviewing the plan." -ForegroundColor Yellow
  exit 0
}

Add-Content -Path $changelogPath -Value ""
Add-Content -Path $changelogPath -Value "---"
Add-Content -Path $changelogPath -Value ""
Add-Content -Path $changelogPath -Value "## Appended changelog fragments - $timestamp"
Add-Content -Path $changelogPath -Value ""

New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null

foreach ($fragment in $fragments) {
  Add-Content -Path $changelogPath -Value ""
  Add-Content -Path $changelogPath -Value (Get-Content $fragment.FullName -Raw)
  Move-Item -Force $fragment.FullName (Join-Path $archiveRoot $fragment.Name)
}

Write-Host "Appended fragments to PROJECT_CHANGELOG.md and moved fragments to $archiveRoot" -ForegroundColor Green
