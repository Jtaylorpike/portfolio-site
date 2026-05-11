<#
Creates a clean Taylor Pike portfolio upload package for ChatGPT project handoff.

Default output:
  _chat-uploads\TaylorPikePortfolio-ChatUpload-YYYYMMDD-HHMMSS\
    01-source\
    02-runtime-images\                 created when runtime image folders exist
    03-imported-images\                only with -IncludeImportedImages
    manifests\
    TaylorPikePortfolio-source-*.zip
    TaylorPikePortfolio-runtime-images-*.zip
    TaylorPikePortfolio-imported-images-*.zip

Run from the project root, or pass -ProjectRoot.
#>

[CmdletBinding()]
param(
  [string]$ProjectRoot = (Get-Location).Path,
  [string]$OutputRoot,
  [switch]$IncludeImportedImages,
  [switch]$IncludeLocalEditorBackups,
  [string]$TransferKitPath,
  [switch]$NoZip
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-FullPath([string]$PathValue) {
  return [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $PathValue).Path)
}

function Copy-FileIfExists {
  param(
    [Parameter(Mandatory=$true)][string]$RelativePath,
    [Parameter(Mandatory=$true)][string]$DestinationRoot
  )

  $source = Join-Path $ProjectRootFull $RelativePath
  if (Test-Path -LiteralPath $source -PathType Leaf) {
    $destination = Join-Path $DestinationRoot $RelativePath
    $destinationParent = Split-Path -Parent $destination
    New-Item -ItemType Directory -Force -Path $destinationParent | Out-Null
    Copy-Item -LiteralPath $source -Destination $destination -Force
    return $true
  }

  return $false
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

  # Robocopy exit codes 0-7 are successful copy states.
  if ($LASTEXITCODE -gt 7) {
    throw "Robocopy failed while copying $RelativePath with exit code $LASTEXITCODE."
  }

  return $true
}

function New-ZipFromFolder {
  param(
    [Parameter(Mandatory=$true)][string]$SourceFolder,
    [Parameter(Mandatory=$true)][string]$ZipPath
  )

  if (Test-Path -LiteralPath $ZipPath) {
    Remove-Item -LiteralPath $ZipPath -Force
  }

  Compress-Archive -LiteralPath (Join-Path $SourceFolder '*') -DestinationPath $ZipPath -Force
}

function Get-RelativeTreeLines {
  param(
    [Parameter(Mandatory=$true)][string]$RootPath
  )

  if (-not (Test-Path -LiteralPath $RootPath -PathType Container)) {
    return @()
  }

  $rootLength = $RootPath.TrimEnd('\').Length + 1
  Get-ChildItem -LiteralPath $RootPath -Recurse -Force |
    Where-Object {
      $full = $_.FullName
      $relative = $full.Substring($rootLength)
      $parts = $relative -split '[\\/]'
      $blocked = @('node_modules', 'dist', '.drive-browser-profile', '__pycache__')
      -not ($parts | Where-Object { $blocked -contains $_ })
    } |
    Sort-Object FullName |
    ForEach-Object {
      $relative = $_.FullName.Substring($rootLength)
      if ($_.PSIsContainer) { "$relative/" } else { $relative }
    }
}

$ProjectRootFull = Resolve-FullPath $ProjectRoot
if (-not $OutputRoot) {
  $OutputRoot = Join-Path $ProjectRootFull '_chat-uploads'
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$packageName = "TaylorPikePortfolio-ChatUpload-$timestamp"
$packageRoot = Join-Path $OutputRoot $packageName
$sourcePackage = Join-Path $packageRoot '01-source'
$runtimeImagesPackage = Join-Path $packageRoot '02-runtime-images'
$importedImagesPackage = Join-Path $packageRoot '03-imported-images'
$manifestRoot = Join-Path $packageRoot 'manifests'

New-Item -ItemType Directory -Force -Path $sourcePackage, $manifestRoot | Out-Null

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

$commonExcludedDirectories = @(
  'node_modules',
  'dist',
  '.drive-browser-profile',
  '__pycache__',
  '.git',
  '.vite',
  'portfolio-public-site-polish-pack'
)

$commonExcludedFiles = @(
  '*.pyc',
  '*.pyo',
  '*.bak',
  '*.tmp',
  'portfolio-*-pack.zip'
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

# Small public files that improve project understanding without uploading every original image.
Copy-DirectoryIfExists -RelativePath 'public/data' -DestinationRoot $sourcePackage -ExcludeDirectories $commonExcludedDirectories -ExcludeFiles $commonExcludedFiles | Out-Null
Copy-DirectoryIfExists -RelativePath 'public/images/logo' -DestinationRoot $sourcePackage -ExcludeDirectories $commonExcludedDirectories -ExcludeFiles $commonExcludedFiles | Out-Null

# Runtime image pack: optimized images that are actually useful for visual/debug work.
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

if (-not $runtimeImagesFound -and (Test-Path -LiteralPath $runtimeImagesPackage)) {
  Remove-Item -LiteralPath $runtimeImagesPackage -Recurse -Force
}

# Imported/original image pack: intentionally optional because it can be large.
if ($IncludeImportedImages) {
  $importedImageDirs = @(
    'public/images/imported',
    'public/images/climbing',
    'public/images/landscape',
    'public/images/personal',
    'public/images/commercial',
    'public/images/portraits',
    'public/images/product-brand'
  )

  $importedImagesFound = $false
  foreach ($dir in $importedImageDirs) {
    if (Copy-DirectoryIfExists -RelativePath $dir -DestinationRoot $importedImagesPackage -ExcludeDirectories $commonExcludedDirectories -ExcludeFiles $commonExcludedFiles) {
      $importedImagesFound = $true
    }
  }

  if (-not $importedImagesFound -and (Test-Path -LiteralPath $importedImagesPackage)) {
    Remove-Item -LiteralPath $importedImagesPackage -Recurse -Force
  }
}

if ($TransferKitPath) {
  $resolvedTransferKitPath = Resolve-FullPath $TransferKitPath
  Copy-Item -LiteralPath $resolvedTransferKitPath -Destination (Join-Path $packageRoot (Split-Path -Leaf $resolvedTransferKitPath)) -Force
}

$excludedNotes = @(
  'node_modules/ - reinstall with npm install; too large and not useful for code review',
  'dist/ - generated build output; can be recreated',
  '.drive-browser-profile/ - local browser profile/cache, not source',
  '.git/ - repository internals, not needed for ChatGPT upload',
  'portfolio-*-pack folders/zips - old generated replacement packs unless intentionally reviewing them',
  'local-editor/backups/ - excluded by default; rerun with -IncludeLocalEditorBackups if backup history matters',
  '*.bak, *.pyc, __pycache__/ - local backup/cache artifacts'
)

$manifestPath = Join-Path $manifestRoot 'UPLOAD_MANIFEST.md'
$sourceTreePath = Join-Path $manifestRoot 'SOURCE_TREE.txt'
$runtimeTreePath = Join-Path $manifestRoot 'RUNTIME_IMAGE_TREE.txt'
$importedTreePath = Join-Path $manifestRoot 'IMPORTED_IMAGE_TREE.txt'

$sourceTreeLines = Get-RelativeTreeLines -RootPath $sourcePackage
$sourceTreeLines | Set-Content -LiteralPath $sourceTreePath -Encoding UTF8

if (Test-Path -LiteralPath $runtimeImagesPackage) {
  Get-RelativeTreeLines -RootPath $runtimeImagesPackage | Set-Content -LiteralPath $runtimeTreePath -Encoding UTF8
}

if (Test-Path -LiteralPath $importedImagesPackage) {
  Get-RelativeTreeLines -RootPath $importedImagesPackage | Set-Content -LiteralPath $importedTreePath -Encoding UTF8
}

$manifest = @"
# Taylor Pike Portfolio Chat Upload Manifest

Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Project root: $ProjectRootFull
Package root: $packageRoot

## Included source files
$($includedFiles | ForEach-Object { "- $_" } | Out-String)
## Included source directories
$($includedDirectories | ForEach-Object { "- $_" } | Out-String)
## Missing expected files or folders
$($missingExpected | ForEach-Object { "- $_" } | Out-String)
## Excluded by design
$($excludedNotes | ForEach-Object { "- $_" } | Out-String)
## Upload order recommendation
1. Taylor_Pike_Portfolio_Next_Chat_Transfer_Kit.zip or .md
2. The newest handoff/intake audit, if separate
3. TaylorPikePortfolio-source-$timestamp.zip
4. TaylorPikePortfolio-runtime-images-$timestamp.zip, only if visual/image debugging is needed
5. TaylorPikePortfolio-imported-images-$timestamp.zip, only if original image processing is needed

## Notes for the next chat
Treat the uploaded current source files as source of truth. Use transfer/handoff files as backup memory only. Do not treat generated build output, old replacement packs, or browser cache folders as active source.
"@

$manifest | Set-Content -LiteralPath $manifestPath -Encoding UTF8

if (-not $NoZip) {
  New-ZipFromFolder -SourceFolder $sourcePackage -ZipPath (Join-Path $packageRoot "TaylorPikePortfolio-source-$timestamp.zip")

  if (Test-Path -LiteralPath $runtimeImagesPackage) {
    New-ZipFromFolder -SourceFolder $runtimeImagesPackage -ZipPath (Join-Path $packageRoot "TaylorPikePortfolio-runtime-images-$timestamp.zip")
  }

  if (Test-Path -LiteralPath $importedImagesPackage) {
    New-ZipFromFolder -SourceFolder $importedImagesPackage -ZipPath (Join-Path $packageRoot "TaylorPikePortfolio-imported-images-$timestamp.zip")
  }
}

Write-Host "Created chat upload package:" -ForegroundColor Green
Write-Host $packageRoot
Write-Host ""
Write-Host "Upload the source zip first. Upload runtime/imported image zips only when the task needs visual image verification." -ForegroundColor Cyan
