param(
  [string]$ProjectRoot = ".",
  [string]$ExpectedBranch = "dev",
  [switch]$SkipBuild,
  [switch]$ImageDataWarningsAsErrors
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$reportDir = "asset-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportPath = "$reportDir\dev-branch-validation-$timestamp.txt"
$latestReportPath = "$reportDir\dev-branch-validation-latest.txt"

$lines = New-Object System.Collections.Generic.List[string]
$failures = New-Object System.Collections.Generic.List[string]

function Add-Line {
  param([string]$Line = "")
  $lines.Add($Line) | Out-Null
  Write-Host $Line
}

function Add-Failure {
  param([string]$Message)
  $failures.Add($Message) | Out-Null
  Add-Line "FAIL: $Message"
}

function Add-Pass {
  param([string]$Message)
  Add-Line "PASS: $Message"
}

function Run-Step {
  param(
    [string]$Name,
    [scriptblock]$StepScript
  )

  Add-Line ""
  Add-Line "## $Name"

  try {
    & $StepScript
    Add-Pass $Name
  }
  catch {
    Add-Failure "$Name - $($_.Exception.Message)"
  }
}

function Get-SummaryCount {
  param(
    [string]$Path,
    [string]$Label
  )

  if (-not (Test-Path $Path)) {
    throw "Summary file not found: $Path"
  }

  $escapedLabel = [regex]::Escape($Label)
  $line = Get-Content $Path | Where-Object { $_ -match "^$escapedLabel\s*:\s*\d+\s*$" } | Select-Object -First 1

  if (-not $line) {
    throw "Could not find '$Label' in $Path."
  }

  return [int]([regex]::Match($line, "\d+").Value)
}

Add-Line "Taylor Pike Portfolio dev branch validation"
Add-Line "Generated: $timestamp"
Add-Line "Project root: $($root.Path)"

Run-Step "Git branch check" {
  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  Add-Line "Current branch: $branch"

  if ($branch -ne $ExpectedBranch) {
    throw "Expected branch '$ExpectedBranch' but current branch is '$branch'."
  }
}

Run-Step "Git safety check" {
  $status = @(git status --short)

  if ($status.Count -eq 0) {
    Add-Line "Working tree is clean."
  }
  else {
    Add-Line "Working tree has changes:"
    $status | ForEach-Object { Add-Line "  $_" }
  }

  $trackedArchive = @(git ls-files asset-archive)
  $trackedReports = @(git ls-files asset-reports)

  if ($trackedArchive.Count -gt 0) {
    Add-Line "Tracked asset-archive files:"
    $trackedArchive | ForEach-Object { Add-Line "  $_" }
    throw "asset-archive is tracked by Git."
  }

  if ($trackedReports.Count -gt 0) {
    Add-Line "Tracked asset-reports files:"
    $trackedReports | ForEach-Object { Add-Line "  $_" }
    throw "asset-reports is tracked by Git."
  }

  Add-Line "asset-archive and asset-reports are not tracked."
}

Run-Step "Public image reference audit" {
  if (-not (Test-Path "scripts\Audit-PublicImageReferences.ps1")) {
    throw "scripts\Audit-PublicImageReferences.ps1 was not found."
  }

  & ".\scripts\Audit-PublicImageReferences.ps1"

  $summaryPath = "asset-reports\public-image-reference-summary.txt"
  if (Test-Path $summaryPath) {
    Add-Line ""
    Get-Content $summaryPath | ForEach-Object { Add-Line "  $_" }
  }

  $missingCount = Get-SummaryCount -Path $summaryPath -Label "Missing referenced files"

  if ($missingCount -gt 0) {
    throw "Public image audit has $missingCount missing referenced files."
  }
}

Run-Step "Optimized portfolio image audit" {
  if (-not (Test-Path "scripts\Audit-OptimizedPortfolioImages.ps1")) {
    throw "scripts\Audit-OptimizedPortfolioImages.ps1 was not found."
  }

  & ".\scripts\Audit-OptimizedPortfolioImages.ps1"

  $summaryPath = "asset-reports\optimized-image-audit-summary.txt"
  if (Test-Path $summaryPath) {
    Add-Line ""
    Get-Content $summaryPath | ForEach-Object { Add-Line "  $_" }
  }

  $missingPath = "asset-reports\optimized-image-missing.csv"
  if (Test-Path $missingPath) {
    $missingRows = @(Import-Csv $missingPath)
    if ($missingRows.Count -gt 0) {
      throw "Optimized image audit has $($missingRows.Count) missing files."
    }
  }

  $prefixPath = "asset-reports\optimized-image-prefix-violations.csv"
  if (Test-Path $prefixPath) {
    $prefixRows = @(Import-Csv $prefixPath)
    if ($prefixRows.Count -gt 0) {
      throw "Optimized image audit has $($prefixRows.Count) prefix violations."
    }
  }
}

Run-Step "Portfolio image data validation" {
  if (-not (Test-Path "scripts\Validate-PortfolioImageData.ps1")) {
    throw "scripts\Validate-PortfolioImageData.ps1 was not found."
  }

  if ($ImageDataWarningsAsErrors) {
    & ".\scripts\Validate-PortfolioImageData.ps1" -WarningsAsErrors
  }
  else {
    & ".\scripts\Validate-PortfolioImageData.ps1"
  }

  $summaryPath = "asset-reports\portfolio-image-data-validation-summary.txt"
  if (Test-Path $summaryPath) {
    Add-Line ""
    Get-Content $summaryPath | ForEach-Object { Add-Line "  $_" }
  }

  $errorCount = Get-SummaryCount -Path $summaryPath -Label "Errors"

  if ($errorCount -gt 0) {
    throw "Portfolio image data validation has $errorCount errors."
  }

  if ($ImageDataWarningsAsErrors) {
    $warningCount = Get-SummaryCount -Path $summaryPath -Label "Warnings"

    if ($warningCount -gt 0) {
      throw "Portfolio image data validation has $warningCount warnings and -ImageDataWarningsAsErrors was set."
    }
  }
}

Run-Step "Public image structure summary" {
  if (-not (Test-Path "scripts\Summarize-PublicImageStructure.ps1")) {
    throw "scripts\Summarize-PublicImageStructure.ps1 was not found."
  }

  & ".\scripts\Summarize-PublicImageStructure.ps1"

  $summaryPath = "asset-reports\public-image-structure-summary.txt"
  if (Test-Path $summaryPath) {
    Add-Line ""
    Get-Content $summaryPath | ForEach-Object { Add-Line "  $_" }
  }
}

if (-not $SkipBuild) {
  Run-Step "Production build" {
    npm run build
  }
}
else {
  Add-Line ""
  Add-Line "## Production build"
  Add-Line "Skipped by -SkipBuild."
}

Add-Line ""
Add-Line "## Result"

if ($failures.Count -eq 0) {
  Add-Line "VALIDATION PASSED"
}
else {
  Add-Line "VALIDATION FAILED"
  Add-Line ""
  Add-Line "Failures:"
  $failures | ForEach-Object { Add-Line "  - $_" }
}

Set-Content -Path $reportPath -Value $lines
Set-Content -Path $latestReportPath -Value $lines

Add-Line ""
Add-Line "Validation report written to:"
Add-Line "  $reportPath"
Add-Line "  $latestReportPath"

if ($failures.Count -gt 0) {
  exit 1
}
