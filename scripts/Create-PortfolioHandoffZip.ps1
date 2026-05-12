param(
  [string]$ProjectRoot = ".",
  [string]$OutputDir = "_chat-uploads",
  [switch]$RunValidation
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

if ($RunValidation) {
  if (Test-Path "scripts\Write-PortfolioHandoffSnapshot.ps1") {
    & ".\scripts\Write-PortfolioHandoffSnapshot.ps1" -RunValidation
  }
}
else {
  if (Test-Path "scripts\Write-PortfolioHandoffSnapshot.ps1") {
    & ".\scripts\Write-PortfolioHandoffSnapshot.ps1"
  }
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$zipPath = Join-Path $OutputDir "TaylorPikePortfolio-Handoff-$timestamp.zip"

$excludeTopLevel = @(
  ".git",
  "node_modules",
  "dist",
  "asset-archive",
  "asset-reports",
  "source-images",
  "assets-to-import",
  "_chat-uploads",
  ".drive-browser-profile",
  "portfolio-public-site-polish-pack"
)

$excludeFilePatterns = @(
  "*.zip",
  "*.bak",
  "*.pyc"
)

$tempDir = Join-Path $env:TEMP "TaylorPikePortfolio-Handoff-$timestamp"

if (Test-Path $tempDir) {
  Remove-Item -Force -Recurse $tempDir
}

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

function Should-ExcludeFile([System.IO.FileInfo]$File) {
  foreach ($pattern in $excludeFilePatterns) {
    if ($File.Name -like $pattern) {
      return $true
    }
  }

  return $false
}

Get-ChildItem -Force | Where-Object {
  $excludeTopLevel -notcontains $_.Name
} | ForEach-Object {
  $source = $_.FullName
  $target = Join-Path $tempDir $_.Name

  if ($_.PSIsContainer) {
    Copy-Item -Force -Recurse $source $target
  }
  else {
    if (-not (Should-ExcludeFile $_)) {
      Copy-Item -Force $source $target
    }
  }
}

# Remove excluded files that may have been copied from subdirectories.
Get-ChildItem $tempDir -File -Recurse | Where-Object {
  Should-ExcludeFile $_
} | Remove-Item -Force

Compress-Archive -Force -Path (Join-Path $tempDir "*") -DestinationPath $zipPath
Remove-Item -Force -Recurse $tempDir

Write-Host ""
Write-Host "Handoff zip created:" -ForegroundColor Green
Write-Host "  $zipPath"
Write-Host ""
Write-Host "Upload this zip into a new chat when continuing the project."
