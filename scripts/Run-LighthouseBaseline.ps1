param(
  [string]$Url = '',
  [int]$Port = 4173,
  [string]$OutputDir = 'asset-reports/lighthouse',
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

function Get-CommandName {
  param([string]$BaseName)

  if ($IsWindows -or $env:OS -eq 'Windows_NT') {
    return "$BaseName.cmd"
  }

  return $BaseName
}

function Wait-ForUrl {
  param(
    [string]$TargetUrl,
    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  throw "Timed out waiting for $TargetUrl"
}

$npm = Get-CommandName 'npm'
$npx = Get-CommandName 'npx'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$absoluteOutputDir = Join-Path $root $OutputDir
New-Item -ItemType Directory -Force -Path $absoluteOutputDir | Out-Null

Push-Location $root
$previewProcess = $null
try {
  if (-not $Url) {
    if (-not $SkipBuild) {
      & $npm run build
    }

    $Url = "http://127.0.0.1:$Port/"
    $previewArgs = @('run', 'preview', '--', '--host', '127.0.0.1', '--port', "$Port", '--strictPort')
    $previewProcess = Start-Process -FilePath $npm -ArgumentList $previewArgs -PassThru -NoNewWindow
    Wait-ForUrl -TargetUrl $Url -TimeoutSeconds 45
  }

  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $jsonPath = Join-Path $absoluteOutputDir "lighthouse-$timestamp.json"
  $htmlPath = Join-Path $absoluteOutputDir "lighthouse-$timestamp.html"

  $chromeFlags = '--headless=new --disable-gpu'
  if (-not ($IsWindows -or $env:OS -eq 'Windows_NT')) {
    $chromeFlags = '--headless=new --no-sandbox --disable-gpu'
  }

  & $npx --yes lighthouse $Url `
    --only-categories=performance,accessibility,best-practices,seo `
    --chrome-flags="$chromeFlags" `
    --output=json `
    --output-path="$jsonPath"

  & $npx --yes lighthouse $Url `
    --only-categories=performance,accessibility,best-practices,seo `
    --chrome-flags="$chromeFlags" `
    --output=html `
    --output-path="$htmlPath"

  $report = Get-Content $jsonPath -Raw | ConvertFrom-Json
  $scores = [ordered]@{}
  foreach ($categoryName in @('performance', 'accessibility', 'best-practices', 'seo')) {
    $category = $report.categories.$categoryName
    if ($null -ne $category -and $null -ne $category.score) {
      $scores[$category.title] = [math]::Round($category.score * 100)
    }
  }

  Write-Host ''
  Write-Host 'Lighthouse baseline complete.'
  Write-Host "URL: $Url"
  foreach ($key in $scores.Keys) {
    Write-Host ("{0}: {1}" -f $key, $scores[$key])
  }
  Write-Host "JSON report: $jsonPath"
  Write-Host "HTML report: $htmlPath"
} finally {
  if ($previewProcess -and -not $previewProcess.HasExited) {
    Stop-Process -Id $previewProcess.Id -Force -ErrorAction SilentlyContinue
  }
  Pop-Location
}
