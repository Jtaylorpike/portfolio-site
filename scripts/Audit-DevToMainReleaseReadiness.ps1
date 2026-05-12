param(
  [string]$ProjectRoot = ".",
  [string]$DevBranch = "dev",
  [string]$MainBranch = "main",
  [switch]$RunChecks,
  [switch]$AllowDirty
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportPath = "$reportDir\dev-to-main-release-readiness-$timestamp.txt"
$latestReportPath = "$reportDir\dev-to-main-release-readiness-latest.txt"

$lines = New-Object System.Collections.Generic.List[string]
$failures = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Add-Line {
  param([string]$Line = "")
  $lines.Add($Line) | Out-Null
  Write-Host $Line
}

function Add-Failure {
  param([string]$Message)
  $failures.Add($Message) | Out-Null
  Add-Line ("FAIL: " + $Message)
}

function Add-Warning {
  param([string]$Message)
  $warnings.Add($Message) | Out-Null
  Add-Line ("WARN: " + $Message)
}

function Add-Pass {
  param([string]$Message)
  Add-Line ("PASS: " + $Message)
}

function Run-Step {
  param(
    [string]$Name,
    [scriptblock]$StepScript
  )

  Add-Line ""
  Add-Line ("## " + $Name)

  try {
    & $StepScript
    Add-Pass $Name
  }
  catch {
    Add-Failure ($Name + " - " + $_.Exception.Message)
  }
}

Add-Line "Taylor Pike Portfolio dev-to-main release readiness"
Add-Line ("Generated: " + $timestamp)
Add-Line ("Project root: " + $root.Path)
Add-Line ""

Run-Step "Branch check" {
  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  Add-Line ("Current branch: " + $branch)

  if ($branch -ne $DevBranch) {
    throw "Expected current branch '$DevBranch' but found '$branch'."
  }

  git rev-parse --verify $MainBranch | Out-Null
  git rev-parse --verify $DevBranch | Out-Null
}

Run-Step "Working tree check" {
  $status = @(git status --short)

  if ($status.Count -eq 0) {
    Add-Line "Working tree is clean."
  }
  else {
    Add-Line "Working tree has changes:"
    foreach ($item in $status) {
      Add-Line ("  " + $item)
    }

    if (-not $AllowDirty) {
      throw "Working tree is not clean. Commit or stash before release audit, or rerun with -AllowDirty for a planning-only report."
    }
    else {
      Add-Warning "Working tree is dirty, but -AllowDirty was set."
    }
  }
}

Run-Step "Local-only tracking check" {
  $trackedArchive = @(git ls-files asset-archive)
  $trackedReports = @(git ls-files asset-reports)
  $trackedSourceImages = @(git ls-files source-images)
  $trackedChatUploads = @(git ls-files _chat-uploads)
  $trackedAppendFragments = @(git ls-files "PROJECT_CHANGELOG_APPEND_*.md")
  $trackedPackNotes = @(git ls-files "REPLACEMENT_PACK_NOTES.md")

  Add-Line ("Tracked asset-archive files: " + $trackedArchive.Count)
  Add-Line ("Tracked asset-reports files: " + $trackedReports.Count)
  Add-Line ("Tracked source-images files: " + $trackedSourceImages.Count)
  Add-Line ("Tracked _chat-uploads files: " + $trackedChatUploads.Count)
  Add-Line ("Tracked changelog append fragments: " + $trackedAppendFragments.Count)
  Add-Line ("Tracked replacement pack notes: " + $trackedPackNotes.Count)

  if ($trackedArchive.Count -gt 0) { throw "asset-archive files are tracked." }
  if ($trackedReports.Count -gt 0) { throw "asset-reports files are tracked." }
  if ($trackedSourceImages.Count -gt 0) { throw "source-images files are tracked." }
  if ($trackedChatUploads.Count -gt 0) { throw "_chat-uploads files are tracked." }
  if ($trackedAppendFragments.Count -gt 0) { throw "PROJECT_CHANGELOG_APPEND_*.md files are tracked." }
  if ($trackedPackNotes.Count -gt 0) { throw "REPLACEMENT_PACK_NOTES.md is tracked." }
}

Run-Step "Diff summary from main" {
  $mergeBase = (git merge-base $MainBranch $DevBranch).Trim()
  $mainHead = (git rev-parse --short $MainBranch).Trim()
  $devHead = (git rev-parse --short $DevBranch).Trim()

  Add-Line ("Merge base: " + $mergeBase)
  Add-Line ("Main head:  " + $mainHead)
  Add-Line ("Dev head:   " + $devHead)
  Add-Line ""

  $commits = @(git log --oneline "$MainBranch..$DevBranch")
  Add-Line ("Commits on " + $DevBranch + " not on " + $MainBranch + ": " + $commits.Count)
  foreach ($commit in $commits) {
    Add-Line ("  " + $commit)
  }

  Add-Line ""
  Add-Line "Diff stat:"
  $diffStat = @(git diff --stat "$MainBranch..$DevBranch")
  if ($diffStat.Count -eq 0) {
    Add-Line "  No diff from main."
    Add-Warning "There are no differences from main."
  }
  else {
    foreach ($line in $diffStat) {
      Add-Line ("  " + $line)
    }
  }
}

if ($RunChecks) {
  Run-Step "Pre-commit portfolio checks" {
    if (Test-Path "scripts\Run-PreCommitPortfolioChecks.ps1") {
      & ".\scripts\Run-PreCommitPortfolioChecks.ps1"
    }
    else {
      if (Test-Path "scripts\Validate-WorkspaceRootClean.ps1") {
        & ".\scripts\Validate-WorkspaceRootClean.ps1"
      }

      if (Test-Path "scripts\Validate-PortfolioImageData.ps1") {
        & ".\scripts\Validate-PortfolioImageData.ps1"
      }

      if (Test-Path "scripts\Validate-PortfolioDevBranch.ps1") {
        & ".\scripts\Validate-PortfolioDevBranch.ps1"
      }

      npm run build
    }
  }
}
else {
  Add-Line ""
  Add-Line "## Pre-commit portfolio checks"
  Add-Line "Skipped. Rerun with -RunChecks before merging."
  Add-Warning "Pre-commit portfolio checks were not run during this audit."
}

Run-Step "Release command preview" {
  Add-Line "Recommended release commands after this audit passes:"
  Add-Line ""
  Add-Line "git checkout main"
  Add-Line "git pull origin main"
  Add-Line "git merge dev"
  Add-Line "npm run build"
  Add-Line "git push origin main"
  Add-Line ""
  Add-Line "After GitHub Pages deploys, smoke-test:"
  Add-Line "- homepage hero"
  Add-Line "- portfolio index"
  Add-Line "- lightbox"
  Add-Line "- 3D gallery route"
  Add-Line "- image paths on the GitHub Pages URL"
}

Add-Line ""
Add-Line "## Result"

if ($failures.Count -eq 0) {
  Add-Line "RELEASE READINESS PASSED"
}
else {
  Add-Line "RELEASE READINESS FAILED"
  Add-Line ""
  Add-Line "Failures:"
  foreach ($failure in $failures) {
    Add-Line ("  - " + $failure)
  }
}

if ($warnings.Count -gt 0) {
  Add-Line ""
  Add-Line "Warnings:"
  foreach ($warning in $warnings) {
    Add-Line ("  - " + $warning)
  }
}

Set-Content -Path $reportPath -Value $lines
Set-Content -Path $latestReportPath -Value $lines

Add-Line ""
Add-Line "Release readiness report written to:"
Add-Line ("  " + $reportPath)
Add-Line ("  " + $latestReportPath)

if ($failures.Count -gt 0) {
  exit 1
}
