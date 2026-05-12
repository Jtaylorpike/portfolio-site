param(
  [string]$ProjectRoot = ".",
  [switch]$AllowFragments
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$fragments = @(Get-ChildItem "PROJECT_CHANGELOG_APPEND_*.md" -File -ErrorAction SilentlyContinue)
$packNotes = @(Get-ChildItem "REPLACEMENT_PACK_NOTES.md" -File -ErrorAction SilentlyContinue)
$trackedFragments = @(git ls-files "PROJECT_CHANGELOG_APPEND_*.md")
$trackedPackNotes = @(git ls-files "REPLACEMENT_PACK_NOTES.md")

$failures = @()

if (-not $AllowFragments -and $fragments.Count -gt 0) {
  $failures += "Root PROJECT_CHANGELOG_APPEND_*.md files remain. Consolidate them into PROJECT_CHANGELOG.md, then archive them."
}

if ($packNotes.Count -gt 0) {
  $failures += "Root REPLACEMENT_PACK_NOTES.md remains. It should be archived after the pack is applied."
}

if ($trackedFragments.Count -gt 0) {
  $failures += "PROJECT_CHANGELOG_APPEND_*.md files are tracked by Git. They should not be committed as permanent root files."
}

if ($trackedPackNotes.Count -gt 0) {
  $failures += "REPLACEMENT_PACK_NOTES.md is tracked by Git. It should not be a permanent root file."
}

Write-Host ""

if ($failures.Count -eq 0) {
  Write-Host "Changelog fragment validation passed." -ForegroundColor Green
  exit 0
}

Write-Host "Changelog fragment validation failed:" -ForegroundColor Red
foreach ($failure in $failures) {
  Write-Host "  - $failure"
}

exit 1
