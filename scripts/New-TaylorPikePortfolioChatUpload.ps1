<#
Creates a clean Taylor Pike portfolio upload package for ChatGPT project handoff.

Run from the project root through the .cmd launcher:
  .\scripts\New-TaylorPikePortfolioChatUpload.cmd

Common modes:
  .\scripts\New-TaylorPikePortfolioChatUpload.cmd
  .\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode display
  .\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode all
  .\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode none

Primary output:
  _chat-uploads\TaylorPikePortfolio-ChatUpload-YYYYMMDD-HHMMSS.zip

Default behavior is intentionally upload-size conscious. It includes active source,
local editor code, docs, scripts, changelog, public fonts, and thumbnail/runtime UI
assets. Use -RuntimeImageMode display when a future chat needs to visually inspect
photos. Use -RuntimeImageMode all only when the full rendition pipeline itself needs
review.
#>

[CmdletBinding()]
param(
  [string]$ProjectRoot = (Get-Location).Path,
  [string]$OutputRoot,
  [string]$TransferKitPath,
  [ValidateSet('none', 'thumb', 'display', 'all')]
  [string]$RuntimeImageMode = 'thumb',
  [switch]$IncludeOriginalImages,
  [switch]$IncludeLocalEditorBackups,
  [switch]$KeepStagingFolder,
  [switch]$NoZip
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-ExistingFullPath {
  param([Parameter(Mandatory=$true)][string]$PathValue)
  return [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $PathValue).Path)
}

function New-CleanDirectory {
  param([Parameter(Mandatory=$true)][string]$PathValue)

  if (Test-Path -LiteralPath $PathValue) {
    Remove-Item -LiteralPath $PathValue -Recurse -Force
  }

  New-Item -ItemType Directory -Force -Path $PathValue | Out-Null
}

function Get-RelativePathCompat {
  param(
    [Parameter(Mandatory=$true)][string]$BasePath,
    [Parameter(Mandatory=$true)][string]$TargetPath
  )

  $baseFull = [System.IO.Path]::GetFullPath($BasePath)
  $targetFull = [System.IO.Path]::GetFullPath($TargetPath)

  $directorySeparator = [System.IO.Path]::DirectorySeparatorChar
  $alternateSeparator = [System.IO.Path]::AltDirectorySeparatorChar
  $baseFull = $baseFull.TrimEnd($directorySeparator, $alternateSeparator) + $directorySeparator

  $baseUri = New-Object System.Uri($baseFull)
  $targetUri = New-Object System.Uri($targetFull)
  $relativeUri = $baseUri.MakeRelativeUri($targetUri)
  $relativePath = [System.Uri]::UnescapeDataString($relativeUri.ToString())

  return $relativePath.Replace('/', $directorySeparator)
}

function Copy-FileIfExists {
  param(
    [Parameter(Mandatory=$true)][string]$RelativePath,
    [Parameter(Mandatory=$true)][string]$DestinationRoot
  )

  $source = Join-Path $ProjectRootFull $RelativePath
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    return $false
  }

  $destination = Join-Path $DestinationRoot $RelativePath
  $destinationParent = Split-Path -Parent $destination
  New-Item -ItemType Directory -Force -Path $destinationParent | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination -Force
  return $true
}

function Copy-DirectoryIfExists {
  param(
    [Parameter(Mandatory=$true)][string]$RelativePath,
    [Parameter(Mandatory=$true)][string]$DestinationRoot,
    [string[]]$ExcludeDirectories = @(),
    [string[]]$ExcludeFiles = @()
  )

  $source = Join-Path $ProjectRootFull $RelativePath
  if (-not (Test-Path -LiteralPath $source -PathType Container)) {
    return $false
  }

  $destination = Join-Path $DestinationRoot $RelativePath
  New-Item -ItemType Directory -Force -Path $destination | Out-Null

  $robocopyArgs = @(
    $source,
    $destination,
    '/E',
    '/NFL',
    '/NDL',
    '/NJH',
    '/NJS',
    '/NP'
  )

  if ($ExcludeDirectories.Count -gt 0) {
    $robocopyArgs += '/XD'
    $robocopyArgs += $ExcludeDirectories
  }

  if ($ExcludeFiles.Count -gt 0) {
    $robocopyArgs += '/XF'
    $robocopyArgs += $ExcludeFiles
  }

  & robocopy @robocopyArgs | Out-Null

  if ($LASTEXITCODE -gt 7) {
    throw "Robocopy failed while copying $RelativePath with exit code $LASTEXITCODE."
  }

  return $true
}

function Copy-DirectoryObject {
  param(
    [Parameter(Mandatory=$true)][System.IO.DirectoryInfo]$Directory,
    [Parameter(Mandatory=$true)][string]$DestinationRoot,
    [string[]]$ExcludeDirectories = @(),
    [string[]]$ExcludeFiles = @()
  )

  $relativePath = Get-RelativePathCompat -BasePath $ProjectRootFull -TargetPath $Directory.FullName
  return Copy-DirectoryIfExists -RelativePath $relativePath -DestinationRoot $DestinationRoot -ExcludeDirectories $ExcludeDirectories -ExcludeFiles $ExcludeFiles
}

function Copy-DirectoryMatches {
  param(
    [Parameter(Mandatory=$true)][string]$SearchRootRelativePath,
    [Parameter(Mandatory=$true)][string[]]$AllowedLeafNames,
    [Parameter(Mandatory=$true)][string]$DestinationRoot,
    [string[]]$ExcludeDirectories = @(),
    [string[]]$ExcludeFiles = @()
  )

  $searchRoot = Join-Path $ProjectRootFull $SearchRootRelativePath
  if (-not (Test-Path -LiteralPath $searchRoot -PathType Container)) {
    return 0
  }

  $copiedCount = 0
  $matches = Get-ChildItem -LiteralPath $searchRoot -Directory -Recurse -Force |
    Where-Object { $AllowedLeafNames -contains $_.Name }

  foreach ($match in $matches) {
    if (Copy-DirectoryObject -Directory $match -DestinationRoot $DestinationRoot -ExcludeDirectories $ExcludeDirectories -ExcludeFiles $ExcludeFiles) {
      $copiedCount += 1
    }
  }

  return $copiedCount
}

function New-ZipFromFolderContents {
  param(
    [Parameter(Mandatory=$true)][string]$SourceFolder,
    [Parameter(Mandatory=$true)][string]$ZipPath
  )

  if (Test-Path -LiteralPath $ZipPath) {
    Remove-Item -LiteralPath $ZipPath -Force
  }

  $children = Get-ChildItem -LiteralPath $SourceFolder -Force
  if ($children.Count -eq 0) {
    throw "Cannot zip empty folder: $SourceFolder"
  }

  Compress-Archive -LiteralPath $children.FullName -DestinationPath $ZipPath -Force
}

function Get-RelativeTreeLines {
  param([Parameter(Mandatory=$true)][string]$RootPath)

  if (-not (Test-Path -LiteralPath $RootPath -PathType Container)) {
    return @()
  }

  $rootLength = $RootPath.TrimEnd('\').Length + 1
  $blockedNames = @('node_modules', 'dist', '.drive-browser-profile', '__pycache__', '.git', '.vite')

  Get-ChildItem -LiteralPath $RootPath -Recurse -Force |
    Where-Object {
      $relative = $_.FullName.Substring($rootLength)
      $parts = $relative -split '[\\/]'
      -not ($parts | Where-Object { $blockedNames -contains $_ })
    } |
    Sort-Object FullName |
    ForEach-Object {
      $relative = $_.FullName.Substring($rootLength)
      if ($_.PSIsContainer) { "$relative/" } else { $relative }
    }
}

function Get-DirectoryFileSummary {
  param([Parameter(Mandatory=$true)][string]$RootPath)

  if (-not (Test-Path -LiteralPath $RootPath -PathType Container)) {
    return 'Not included.'
  }

  $files = @(Get-ChildItem -LiteralPath $RootPath -File -Recurse -Force)
  $sizeBytes = 0
  foreach ($file in $files) {
    $sizeBytes += $file.Length
  }

  return "$($files.Count) files, $sizeBytes bytes"
}

function Get-JsonArrayCount {
  param([Parameter(Mandatory=$true)][string]$RelativePath)

  $path = Join-Path $ProjectRootFull $RelativePath
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    return 'missing'
  }

  try {
    $json = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    if ($null -eq $json) { return 0 }
    if ($json -is [System.Array]) { return $json.Count }
    if ($json.PSObject.Properties.Name -contains 'items') { return @($json.items).Count }
    return 1
  } catch {
    return 'unreadable'
  }
}

function Invoke-GitText {
  param([Parameter(Mandatory=$true)][string[]]$GitArgs)

  try {
    $result = & git @GitArgs 2>$null
    if ($LASTEXITCODE -eq 0) {
      return ($result -join [Environment]::NewLine).Trim()
    }
  } catch {
    return ''
  }

  return ''
}

$ProjectRootFull = Resolve-ExistingFullPath $ProjectRoot

if (-not $OutputRoot) {
  $OutputRoot = Join-Path $ProjectRootFull '_chat-uploads'
}

New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$packageName = "TaylorPikePortfolio-ChatUpload-$timestamp"
$packageRoot = Join-Path $OutputRoot $packageName
$sourcePackage = Join-Path $packageRoot '01-source'
$runtimeImagesPackage = Join-Path $packageRoot '02-runtime-images'
$originalImagesPackage = Join-Path $packageRoot '03-original-images'
$manifestRoot = Join-Path $packageRoot 'manifests'
$zipPath = Join-Path $OutputRoot "$packageName.zip"

New-CleanDirectory $packageRoot
New-Item -ItemType Directory -Force -Path $sourcePackage, $manifestRoot | Out-Null

$commonExcludedDirectories = @(
  'node_modules',
  'dist',
  '.drive-browser-profile',
  '.git',
  '.vite',
  '__pycache__',
  'portfolio-public-site-polish-pack',
  '_chat-uploads',
  'asset-archive',
  'asset-reports',
  'assets-to-import',
  'source-images'
)

$commonExcludedFiles = @(
  '*.pyc',
  '*.pyo',
  '*.bak',
  '*.backup-*',
  '*.tmp',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  'portfolio-*-pack.zip',
  'TaylorPikePortfolio-ChatUpload-*.zip'
)

$requiredFiles = @(
  'index.html',
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'tsconfig.json',
  'README.md',
  '.gitignore',
  'PROJECT_CHANGELOG.md'
)

$sourceDirectories = @(
  'src',
  'scripts',
  'local-editor',
  'docs'
)

$includedFiles = New-Object System.Collections.Generic.List[string]
$includedDirectories = New-Object System.Collections.Generic.List[string]
$missingExpected = New-Object System.Collections.Generic.List[string]

foreach ($file in $requiredFiles) {
  if (Copy-FileIfExists -RelativePath $file -DestinationRoot $sourcePackage) {
    $includedFiles.Add($file)
  } else {
    $missingExpected.Add($file)
  }
}

foreach ($dir in $sourceDirectories) {
  $dirExcludes = $commonExcludedDirectories
  if (($dir -eq 'local-editor') -and (-not $IncludeLocalEditorBackups)) {
    $dirExcludes = $dirExcludes + @('backups')
  }

  if (Copy-DirectoryIfExists -RelativePath $dir -DestinationRoot $sourcePackage -ExcludeDirectories $dirExcludes -ExcludeFiles $commonExcludedFiles) {
    $includedDirectories.Add($dir)
  } else {
    $missingExpected.Add($dir)
  }
}

# Small public context. Runtime image payloads are copied into 02-runtime-images instead of 01-source.
Copy-DirectoryIfExists -RelativePath 'public/fonts' -DestinationRoot $sourcePackage -ExcludeDirectories $commonExcludedDirectories -ExcludeFiles $commonExcludedFiles | Out-Null

$runtimeImageDirs = @()
switch ($RuntimeImageMode) {
  'none' {
    $runtimeImageDirs = @()
  }
  'thumb' {
    $runtimeImageDirs = @(
      'public/images/portfolio/thumb',
      'public/images/ui'
    )
  }
  'display' {
    $runtimeImageDirs = @(
      'public/images/portfolio/display',
      'public/images/portfolio/thumb',
      'public/images/ui'
    )
  }
  'all' {
    $runtimeImageDirs = @(
      'public/images/portfolio/display',
      'public/images/portfolio/thumb',
      'public/images/portfolio/texture',
      'public/images/portfolio/full',
      'public/images/ui'
    )
  }
}

$runtimeImagesFound = $false
foreach ($dir in $runtimeImageDirs) {
  if (Copy-DirectoryIfExists -RelativePath $dir -DestinationRoot $runtimeImagesPackage -ExcludeDirectories $commonExcludedDirectories -ExcludeFiles $commonExcludedFiles) {
    $runtimeImagesFound = $true
  }
}

if (-not $runtimeImagesFound -and (Test-Path -LiteralPath $runtimeImagesPackage)) {
  Remove-Item -LiteralPath $runtimeImagesPackage -Recurse -Force
}

if ($IncludeOriginalImages) {
  $originalImageRoots = @(
    'source-images',
    'assets-to-import'
  )

  $originalImagesFound = $false
  foreach ($dir in $originalImageRoots) {
    if (Copy-DirectoryIfExists -RelativePath $dir -DestinationRoot $originalImagesPackage -ExcludeDirectories $commonExcludedDirectories -ExcludeFiles $commonExcludedFiles) {
      $originalImagesFound = $true
    }
  }

  if (-not $originalImagesFound -and (Test-Path -LiteralPath $originalImagesPackage)) {
    Remove-Item -LiteralPath $originalImagesPackage -Recurse -Force
  }
}

if ($TransferKitPath) {
  $resolvedTransferKitPath = Resolve-ExistingFullPath $TransferKitPath
  Copy-Item -LiteralPath $resolvedTransferKitPath -Destination (Join-Path $packageRoot (Split-Path -Leaf $resolvedTransferKitPath)) -Force
}

$sourceTreePath = Join-Path $manifestRoot 'SOURCE_TREE.txt'
$runtimeTreePath = Join-Path $manifestRoot 'RUNTIME_IMAGE_TREE.txt'
$originalTreePath = Join-Path $manifestRoot 'ORIGINAL_IMAGE_TREE.txt'
$manifestPath = Join-Path $manifestRoot 'UPLOAD_MANIFEST.md'

Get-RelativeTreeLines -RootPath $sourcePackage | Set-Content -LiteralPath $sourceTreePath -Encoding UTF8

if (Test-Path -LiteralPath $runtimeImagesPackage) {
  Get-RelativeTreeLines -RootPath $runtimeImagesPackage | Set-Content -LiteralPath $runtimeTreePath -Encoding UTF8
}

if (Test-Path -LiteralPath $originalImagesPackage) {
  Get-RelativeTreeLines -RootPath $originalImagesPackage | Set-Content -LiteralPath $originalTreePath -Encoding UTF8
}

$includedFilesText = ($includedFiles | ForEach-Object { "- $_" }) -join [Environment]::NewLine
$includedDirectoriesText = ($includedDirectories | ForEach-Object { "- $_" }) -join [Environment]::NewLine
$missingExpectedText = if ($missingExpected.Count -gt 0) {
  ($missingExpected | ForEach-Object { "- $_" }) -join [Environment]::NewLine
} else {
  '- None'
}

$runtimeImagesText = if (Test-Path -LiteralPath $runtimeImagesPackage) {
  "- Included active runtime image package using mode: $RuntimeImageMode."
} else {
  "- No runtime image package was created. Runtime image mode: $RuntimeImageMode."
}

$originalImagesText = if (Test-Path -LiteralPath $originalImagesPackage) {
  '- Included because -IncludeOriginalImages was used.'
} else {
  '- Not included. Use -IncludeOriginalImages only when source import assets matter.'
}

$currentBranch = Invoke-GitText -GitArgs @('branch', '--show-current')
$currentCommit = Invoke-GitText -GitArgs @('rev-parse', '--short', 'HEAD')
$gitStatus = Invoke-GitText -GitArgs @('status', '--short')
if (-not $gitStatus) { $gitStatus = 'Clean or unavailable.' }

$imageCount = Get-JsonArrayCount -RelativePath 'src/data/galleryImages.json'
$categoryCount = Get-JsonArrayCount -RelativePath 'src/data/categories.json'
$heroSlideCount = Get-JsonArrayCount -RelativePath 'src/data/heroSlides.json'
$gallerySlotCount = Get-JsonArrayCount -RelativePath 'src/data/galleryCuration.json'
$sourceSummary = Get-DirectoryFileSummary -RootPath $sourcePackage
$runtimeSummary = Get-DirectoryFileSummary -RootPath $runtimeImagesPackage
$originalSummary = Get-DirectoryFileSummary -RootPath $originalImagesPackage

$manifest = @"
# Taylor Pike Portfolio Chat Upload Manifest

Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Project root: $ProjectRootFull
Package root: $packageRoot
Git branch: $currentBranch
Git commit: $currentCommit
Runtime image mode: $RuntimeImageMode

## Current data summary
- Gallery images: $imageCount
- Categories: $categoryCount
- Hero slides: $heroSlideCount
- Gallery wall slots: $gallerySlotCount

## Included source files
$includedFilesText

## Included source directories
$includedDirectoriesText

## Missing expected files or folders
$missingExpectedText

## Package summaries
- 01-source: $sourceSummary
- 02-runtime-images: $runtimeSummary
- 03-original-images: $originalSummary

## Runtime image package
$runtimeImagesText

Active runtime folders are expected to be:
- public/images/portfolio/display/
- public/images/portfolio/thumb/
- public/images/portfolio/texture/
- public/images/portfolio/full/
- public/images/ui/cards/

There is no active public/images/logo/ folder unless it is intentionally added later.

## Original/source image package
$originalImagesText

## Git working tree at packaging time
````text
$gitStatus
````

## Excluded by design
- node_modules/ because dependencies can be recreated with npm install.
- dist/ because it is generated build output.
- .git/ because repository internals are unnecessary for ChatGPT review.
- _chat-uploads/ because upload packages should not recursively include older upload packages.
- asset-archive/ and asset-reports/ because they are generated/local audit artifacts.
- source-images/ and assets-to-import/ unless -IncludeOriginalImages is used.
- local-editor/backups/ by default because backup history is noisy unless specifically needed.
- *.bak, *.backup-*, *.pyc, __pycache__/, *.tmp, and logs because they are local artifacts.

## Upload instruction for the next chat
Upload this zip after the latest handoff summary. Treat current source files as source of truth. Treat docs and summaries as continuity aids. Do not treat generated build output, old replacement packs, browser cache, or backup files as active source.
"@

$manifest | Set-Content -LiteralPath $manifestPath -Encoding UTF8

if (-not $NoZip) {
  New-ZipFromFolderContents -SourceFolder $packageRoot -ZipPath $zipPath
}

Write-Host "Created chat upload staging folder:" -ForegroundColor Green
Write-Host $packageRoot

if (-not $NoZip) {
  Write-Host ""
  Write-Host "Created upload zip:" -ForegroundColor Green
  Write-Host $zipPath
}

if (-not $KeepStagingFolder -and (-not $NoZip)) {
  Remove-Item -LiteralPath $packageRoot -Recurse -Force
  Write-Host ""
  Write-Host "Removed staging folder. Use -KeepStagingFolder if you want to inspect it before upload." -ForegroundColor DarkGray
}
