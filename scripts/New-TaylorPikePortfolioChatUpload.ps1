<#
Creates a clean Taylor Pike portfolio upload package for ChatGPT project handoff.

Run this from the project root:
  .\scripts\New-TaylorPikePortfolioChatUpload.ps1

If your PowerShell policy blocks unsigned scripts, use the included launcher:
  .\scripts\New-TaylorPikePortfolioChatUpload.cmd

Primary output:
  _chat-uploads\TaylorPikePortfolio-ChatUpload-YYYYMMDD-HHMMSS.zip

The package includes active source, editor code, small public data, logo assets,
and runtime image folders needed for visual verification. It excludes generated,
large, stale, and machine-local artifacts by default.
#>

[CmdletBinding()]
param(
  [string]$ProjectRoot = (Get-Location).Path,
  [string]$OutputRoot,
  [string]$TransferKitPath,
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
  '_chat-uploads'
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
  '.gitignore'
)

$sourceDirectories = @(
  'src',
  'scripts',
  'local-editor'
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

# Small public context that helps verify data paths without duplicating image payloads inside 01-source.
Copy-DirectoryIfExists -RelativePath 'public/data' -DestinationRoot $sourcePackage -ExcludeDirectories $commonExcludedDirectories -ExcludeFiles $commonExcludedFiles | Out-Null
Copy-DirectoryIfExists -RelativePath 'public/images/logo' -DestinationRoot $sourcePackage -ExcludeDirectories $commonExcludedDirectories -ExcludeFiles $commonExcludedFiles | Out-Null

# Runtime images needed for visual verification. This intentionally includes imported optimized/thumb/texture
# folders by default, while avoiding full/original image folders unless explicitly requested.
$runtimeImageDirs = @(
  'public/images/logo',
  'public/images/card-optimized',
  'public/images/gallery-optimized',
  'public/images/thumbnails'
)

$runtimeImagesFound = $false
foreach ($dir in $runtimeImageDirs) {
  if (Copy-DirectoryIfExists -RelativePath $dir -DestinationRoot $runtimeImagesPackage -ExcludeDirectories $commonExcludedDirectories -ExcludeFiles $commonExcludedFiles) {
    $runtimeImagesFound = $true
  }
}

$runtimeImportedCount = Copy-DirectoryMatches `
  -SearchRootRelativePath 'public/images/imported' `
  -AllowedLeafNames @('optimized', 'thumb', 'texture', 'textures', 'preview', 'previews') `
  -DestinationRoot $runtimeImagesPackage `
  -ExcludeDirectories $commonExcludedDirectories `
  -ExcludeFiles $commonExcludedFiles

if ($runtimeImportedCount -gt 0) {
  $runtimeImagesFound = $true
}

if (-not $runtimeImagesFound -and (Test-Path -LiteralPath $runtimeImagesPackage)) {
  Remove-Item -LiteralPath $runtimeImagesPackage -Recurse -Force
}

if ($IncludeOriginalImages) {
  $originalImageRoots = @(
    'public/images/imported',
    'public/images/climbing',
    'public/images/landscape',
    'public/images/personal',
    'public/images/commercial',
    'public/images/portraits',
    'public/images/product-brand'
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
  '- Included optimized/card/gallery/logo/imported runtime images available in the project.'
} else {
  '- No runtime image package was created because no matching runtime image folders were found.'
}

$originalImagesText = if (Test-Path -LiteralPath $originalImagesPackage) {
  '- Included because -IncludeOriginalImages was used.'
} else {
  '- Not included. Use -IncludeOriginalImages only when full/original image processing matters.'
}

$manifest = @"
# Taylor Pike Portfolio Chat Upload Manifest

Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Project root: $ProjectRootFull
Package root: $packageRoot

## Included source files
$includedFilesText

## Included source directories
$includedDirectoriesText

## Missing expected files or folders
$missingExpectedText

## Runtime image package
$runtimeImagesText

## Original/full image package
$originalImagesText

## Excluded by design
- node_modules/ because dependencies can be recreated with npm install.
- dist/ because it is generated build output.
- .drive-browser-profile/ because it is local browser cache/profile data.
- .git/ because repository internals are unnecessary for ChatGPT review.
- _chat-uploads/ because upload packages should not recursively include older upload packages.
- old generated replacement packs and zip packs because they can be stale.
- local-editor/backups/ by default because backup history is noisy unless specifically needed.
- *.bak, *.backup-*, *.pyc, __pycache__/, *.tmp, and logs because they are local artifacts.

## Upload instruction for the next chat
Upload this zip after the latest transfer kit or handoff summary. Treat current source files as source of truth. Treat summaries as memory backups only. Do not treat generated build output, old replacement packs, browser cache, or backup files as active source.
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
