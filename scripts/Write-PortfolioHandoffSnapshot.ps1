param(
  [string]$ProjectRoot = ".",
  [switch]$RunValidation
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$docsDir = "docs"
$reportDir = "asset-reports"

New-Item -ItemType Directory -Force -Path $docsDir | Out-Null
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

if ($RunValidation) {
  if (Test-Path "scripts\Validate-WorkspaceRootClean.ps1") {
    & ".\scripts\Validate-WorkspaceRootClean.ps1"
  }

  if (Test-Path "scripts\Validate-PortfolioDevBranch.ps1") {
    & ".\scripts\Validate-PortfolioDevBranch.ps1"
  }
}

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
$head = (git rev-parse --short HEAD).Trim()
$status = @(git status --short)

$trackedArchive = @(git ls-files asset-archive)
$trackedReports = @(git ls-files asset-reports)
$trackedSourceImages = @(git ls-files source-images)

$imageSummaryPath = "asset-reports\public-image-structure-summary.txt"
$imageDataSummaryPath = "asset-reports\portfolio-image-data-validation-summary.txt"
$devValidationPath = "asset-reports\dev-branch-validation-latest.txt"

$lines = New-Object System.Collections.Generic.List[string]

function Add-Line {
  param([string]$Line = "")
  $lines.Add($Line) | Out-Null
}

function Add-FileBlock {
  param(
    [string]$Title,
    [string]$Path
  )

  if (Test-Path $Path) {
    Add-Line ("## " + $Title)
    Add-Line ""
    Add-Line "~~~text"
    Get-Content $Path | ForEach-Object { Add-Line $_ }
    Add-Line "~~~"
    Add-Line ""
  }
}

Add-Line "# Taylor Pike Portfolio - Current Handoff Snapshot"
Add-Line ""
Add-Line ("Generated: " + $timestamp)
Add-Line ""
Add-Line "## Current branch state"
Add-Line ""
Add-Line ("- Active working branch: " + $branch)
Add-Line ("- Current commit: " + $head)
Add-Line "- main should remain the clean public WIP until dev is intentionally merged."
Add-Line "- Continue experimental/build-system/editor work on dev."
Add-Line ""
Add-Line "## Current project architecture"
Add-Line ""
Add-Line "- Vite + TypeScript static portfolio site."
Add-Line "- Active editable data lives in src/data/."
Add-Line "- Stale deployed data under public/data/ should remain archived, not restored."
Add-Line "- Public image paths are resolved through import.meta.env.BASE_URL so GitHub Pages project-path deployment works."
Add-Line "- Portfolio image folders are organized by rendition/purpose, not by category."
Add-Line "- Local editor should follow the same rendition-based image contract."
Add-Line ""
Add-Line "## Active data files"
Add-Line ""
Add-Line "- src/data/galleryImages.json"
Add-Line "- src/data/categories.json"
Add-Line "- src/data/heroSlides.json"
Add-Line "- src/data/images.ts"
Add-Line ""
Add-Line "## Runtime image structure"
Add-Line ""
Add-Line "~~~text"
Add-Line "public/images/portfolio/full/"
Add-Line "public/images/portfolio/display/"
Add-Line "public/images/portfolio/texture/"
Add-Line "public/images/portfolio/thumb/"
Add-Line "public/images/ui/cards/"
Add-Line "public/images/logo/       # optional/future brand assets"
Add-Line "~~~"
Add-Line ""
Add-Line "Categories belong in JSON, not in image folder names."
Add-Line ""
Add-Line "## Local-only folders"
Add-Line ""
Add-Line "These should not be committed:"
Add-Line ""
Add-Line "~~~text"
Add-Line "asset-archive/"
Add-Line "asset-reports/"
Add-Line "source-images/"
Add-Line "assets-to-import/"
Add-Line "node_modules/"
Add-Line "dist/"
Add-Line "~~~"
Add-Line ""
Add-Line "## Major recent changes"
Add-Line ""
Add-Line "- GitHub Pages image path issue fixed by resolving JSON-driven image paths with import.meta.env.BASE_URL."
Add-Line "- Public images migrated toward a rendition-based structure."
Add-Line "- Image optimizer pipeline added for full, display, texture, and thumb WebP renditions."
Add-Line "- Legacy public/data archived because active data now lives in src/data."
Add-Line "- Legacy public image folders archived after references were migrated."
Add-Line "- Card images migrated toward public/images/ui/cards/."
Add-Line "- Image import workflow added for future images."
Add-Line "- Image removal workflow added for safely removing test imports."
Add-Line "- Image data validation added and integrated into dev validation."
Add-Line "- Local editor import backend updated to use rendition folders."
Add-Line "- Editor fit-mode normalization fixed."
Add-Line "- Workspace root cleanup tooling added."
Add-Line ""
Add-Line "## Validation commands"
Add-Line ""
Add-Line "Run these before considering a merge from dev into main:"
Add-Line ""
Add-Line "~~~powershell"
Add-Line ".\scripts\Validate-WorkspaceRootClean.ps1"
Add-Line ".\scripts\Validate-PortfolioImageData.ps1"
Add-Line ".\scripts\Validate-PortfolioDevBranch.ps1"
Add-Line "npm run build"
Add-Line "~~~"
Add-Line ""
Add-Line "Optional strict image-data validation:"
Add-Line ""
Add-Line "~~~powershell"
Add-Line ".\scripts\Validate-PortfolioDevBranch.ps1 -ImageDataWarningsAsErrors"
Add-Line "~~~"
Add-Line ""
Add-Line "## Import workflow"
Add-Line ""
Add-Line "~~~powershell"
Add-Line ".\scripts\Audit-ImageImportInbox.ps1"
Add-Line ".\scripts\Import-PortfolioImages.ps1 -Category personal"
Add-Line ".\scripts\Import-PortfolioImages.ps1 -Category personal -Apply"
Add-Line ".\scripts\Validate-PortfolioDevBranch.ps1"
Add-Line "~~~"
Add-Line ""
Add-Line "## Editor workflow"
Add-Line ""
Add-Line "~~~powershell"
Add-Line ".\scripts\Audit-LocalEditorCompatibility.ps1"
Add-Line ".\scripts\Run-LocalEditor.ps1"
Add-Line ".\scripts\Validate-PortfolioDevBranch.ps1"
Add-Line "~~~"
Add-Line ""
Add-Line "## Removal workflow for test imports"
Add-Line ""
Add-Line "~~~powershell"
Add-Line ".\scripts\Remove-PortfolioImageRecord.ps1 -ImageId ""example-id"""
Add-Line ".\scripts\Remove-PortfolioImageRecord.ps1 -ImageId ""example-id"" -Apply"
Add-Line ".\scripts\Validate-PortfolioDevBranch.ps1"
Add-Line "~~~"
Add-Line ""
Add-Line "## Git safety"
Add-Line ""
Add-Line ("Tracked archive files: " + $trackedArchive.Count)
Add-Line ""
Add-Line ("Tracked report files: " + $trackedReports.Count)
Add-Line ""
Add-Line ("Tracked source image files: " + $trackedSourceImages.Count)
Add-Line ""
Add-Line "These counts should remain 0."
Add-Line ""

Add-Line "## Working tree"
Add-Line ""

if ($status.Count -eq 0) {
  Add-Line "Working tree was clean when this snapshot was generated."
  Add-Line ""
}
else {
  Add-Line "Working tree had the following changes when this snapshot was generated:"
  Add-Line ""
  Add-Line "~~~text"
  foreach ($item in $status) {
    Add-Line $item
  }
  Add-Line "~~~"
  Add-Line ""
}

Add-FileBlock -Title "Latest public image structure summary" -Path $imageSummaryPath
Add-FileBlock -Title "Latest image data validation summary" -Path $imageDataSummaryPath
Add-FileBlock -Title "Latest dev validation summary" -Path $devValidationPath

Add-Line "## Next recommended work"
Add-Line ""
Add-Line "1. Commit the current dev work in logical chunks if not already committed."
Add-Line "2. Run full validation."
Add-Line "3. Test local editor import and removal once more."
Add-Line "4. Decide whether to merge dev into main or continue feature work on dev."
Add-Line "5. Keep main public-facing and stable."
Add-Line ""

$snapshotPath = "docs\CURRENT_PROJECT_HANDOFF.md"
$datedSnapshotPath = "asset-reports\portfolio-handoff-snapshot-$stamp.md"

Set-Content -Path $snapshotPath -Value $lines
Set-Content -Path $datedSnapshotPath -Value $lines

Write-Host ""
Write-Host "Handoff snapshot written to:" -ForegroundColor Cyan
Write-Host "  $snapshotPath"
Write-Host "  $datedSnapshotPath"
