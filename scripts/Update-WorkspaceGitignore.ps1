param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path $ProjectRoot
Set-Location $root

$gitignorePath = ".gitignore"

if (-not (Test-Path $gitignorePath)) {
  New-Item -ItemType File -Path $gitignorePath | Out-Null
}

$requiredLines = @(
  "",
  "# Local archive/report/source folders",
  "asset-archive/",
  "asset-reports/",
  "source-images/",
  "assets-to-import/",
  "",
  "# Local ChatGPT transfer and generated pack artifacts",
  "_chat-uploads/",
  "_chat-uploads.zip",
  "asset-reports.zip",
  "TaylorPikePortfolio-*.zip",
  "Taylor_Pike_Portfolio_*.zip",
  "PROJECT_CHANGELOG_APPEND_*.md",
  "REPLACEMENT_PACK_NOTES.md",
  "",
  "# Old generated/local working folders",
  "portfolio-public-site-polish-pack/",
  ".drive-browser-profile/"
)

$current = Get-Content $gitignorePath -ErrorAction SilentlyContinue
$toAppend = @()

foreach ($line in $requiredLines) {
  if ([string]::IsNullOrWhiteSpace($line)) {
    continue
  }

  if ($current -notcontains $line) {
    $toAppend += $line
  }
}

if ($toAppend.Count -eq 0) {
  Write-Host ".gitignore already contains the workspace cleanup rules." -ForegroundColor Green
  exit 0
}

Add-Content -Path $gitignorePath -Value ""
Add-Content -Path $gitignorePath -Value "# Workspace cleanup rules"
foreach ($line in $toAppend) {
  Add-Content -Path $gitignorePath -Value $line
}

Write-Host "Added $($toAppend.Count) workspace cleanup ignore rules to .gitignore." -ForegroundColor Green
