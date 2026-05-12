# Image import workflow

## Purpose

This workflow imports new source images into the portfolio without manually creating folders or hand-editing image paths.

It reads files from:

```text
source-images/inbox/
```

and writes optimized runtime renditions to:

```text
public/images/portfolio/full/
public/images/portfolio/display/
public/images/portfolio/texture/
public/images/portfolio/thumb/
```

It then appends new records to:

```text
src/data/galleryImages.json
```

## Dependency

The import script uses `sharp`.

Install once:

```powershell
npm install -D sharp
```

or:

```powershell
.\scripts\Import-PortfolioImages.ps1 -InstallSharp
```

## Basic workflow

Put new images in:

```text
source-images/inbox/
```

Audit the inbox:

```powershell
.\scripts\Audit-ImageImportInbox.ps1
```

Dry run:

```powershell
.\scripts\Import-PortfolioImages.ps1 -Category personal
```

Review:

```text
asset-reports/portfolio-image-import-plan.txt
asset-reports/portfolio-image-import-summary.txt
```

Apply:

```powershell
.\scripts\Import-PortfolioImages.ps1 -Category personal -Apply
```

With optional metadata:

```powershell
.\scripts\Import-PortfolioImages.ps1 -Category climbing -Year "2026" -Location "Haycock, PA" -Note "Imported from spring bouldering edit." -Apply
```

If the category does not exist and you want to add it to `categories.json`:

```powershell
.\scripts\Import-PortfolioImages.ps1 -Category experimental -UpdateCategories -Apply
```

If you want the source files moved out of the inbox after import:

```powershell
.\scripts\Import-PortfolioImages.ps1 -Category personal -Apply -MoveSource
```

## Validation

After import:

```powershell
.\scripts\Audit-OptimizedPortfolioImages.ps1
.\scripts\Audit-PublicImageReferences.ps1
npm run build
```

## Safety

- Dry run is the default.
- Existing output files are skipped unless `-Force` is used.
- `galleryImages.json` is backed up to `asset-archive/json-backups/` before update.
- `source-images/` should stay local and ignored by Git.
- Do not commit `source-images/`, `asset-archive/`, or `asset-reports/`.

## Naming

Record IDs are generated from the category plus source filename.

Example:

```text
source-images/inbox/desert-light-01.jpg
Category: personal
Generated ID: personal-desert-light-01
```

The output paths become:

```text
/images/portfolio/full/personal-desert-light-01.webp
/images/portfolio/display/personal-desert-light-01.webp
/images/portfolio/texture/personal-desert-light-01.webp
/images/portfolio/thumb/personal-desert-light-01.webp
```
