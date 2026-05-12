param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
$head = (git rev-parse --short HEAD).Trim()

$lines = @()
$lines += "# Dev to main release merge checklist"
$lines += ""
$lines += "Generated: $timestamp"
$lines += ""
$lines += "Current branch: $branch"
$lines += "Current head: $head"
$lines += ""
$lines += "## Before merge"
$lines += ""
$lines += "Run from dev:"
$lines += ""
$lines += "~~~powershell"
$lines += ".\scripts\Run-PreCommitPortfolioChecks.ps1"
$lines += ".\scripts\Audit-DevToMainReleaseReadiness.ps1 -RunChecks"
$lines += "~~~"
$lines += ""
$lines += "Expected:"
$lines += ""
$lines += "~~~text"
$lines += "Pre-commit portfolio checks passed."
$lines += "RELEASE READINESS PASSED"
$lines += "~~~"
$lines += ""
$lines += "## Merge"
$lines += ""
$lines += "~~~powershell"
$lines += "git checkout main"
$lines += "git pull origin main"
$lines += "git merge dev"
$lines += "npm run build"
$lines += "git push origin main"
$lines += "~~~"
$lines += ""
$lines += "## After deploy"
$lines += ""
$lines += "Smoke test GitHub Pages:"
$lines += ""
$lines += "- homepage loads"
$lines += "- hero images load"
$lines += "- contact-sheet thumbnails load"
$lines += "- portfolio index cards load"
$lines += "- lightbox opens and navigates"
$lines += "- 3D gallery route loads"
$lines += "- gallery textures load"
$lines += "- no paths point to public/data, _chat-uploads, or old category image folders"
$lines += ""
$lines += "## If something fails"
$lines += ""
$lines += "Return to dev, fix there, rerun validation, then merge again."
$lines += ""
$lines += "~~~powershell"
$lines += "git checkout dev"
$lines += "~~~"
$lines += ""

Set-Content -Path "docs\DEV_TO_MAIN_RELEASE_CHECKLIST.md" -Value $lines
Set-Content -Path "asset-reports\dev-to-main-release-checklist.md" -Value $lines

Write-Host ""
Write-Host "Release merge checklist written to:" -ForegroundColor Cyan
Write-Host "  docs\DEV_TO_MAIN_RELEASE_CHECKLIST.md"
Write-Host "  asset-reports\dev-to-main-release-checklist.md"
