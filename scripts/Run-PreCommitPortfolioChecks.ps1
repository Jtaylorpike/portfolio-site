param(
  [string]$ProjectRoot = ".",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$steps = @(
  [PSCustomObject]@{
    name = "Workspace root clean"
    command = { & ".\scripts\Validate-WorkspaceRootClean.ps1" }
  },
  [PSCustomObject]@{
    name = "Changelog fragments clean"
    command = { & ".\scripts\Validate-ChangelogFragmentsClean.ps1" }
  },
  [PSCustomObject]@{
    name = "Staged commit audit"
    command = { & ".\scripts\Audit-StagedCommit.ps1" }
  },
  [PSCustomObject]@{
    name = "Portfolio image data"
    command = { & ".\scripts\Validate-PortfolioImageData.ps1" }
  },
  [PSCustomObject]@{
    name = "Dev branch validation"
    command = { & ".\scripts\Validate-PortfolioDevBranch.ps1" -SkipBuild }
  }
)

$failures = @()

foreach ($step in $steps) {
  Write-Host ""
  Write-Host "## $($step.name)" -ForegroundColor Cyan

  try {
    & $step.command
  }
  catch {
    $failures += "$($step.name): $($_.Exception.Message)"
  }
}

if (-not $SkipBuild) {
  Write-Host ""
  Write-Host "## Production build" -ForegroundColor Cyan

  try {
    npm run build
  }
  catch {
    $failures += "Production build: $($_.Exception.Message)"
  }
}

Write-Host ""

if ($failures.Count -eq 0) {
  Write-Host "Pre-commit portfolio checks passed." -ForegroundColor Green
  exit 0
}

Write-Host "Pre-commit portfolio checks failed:" -ForegroundColor Red
foreach ($failure in $failures) {
  Write-Host "  - $failure" -ForegroundColor Red
}

exit 1
