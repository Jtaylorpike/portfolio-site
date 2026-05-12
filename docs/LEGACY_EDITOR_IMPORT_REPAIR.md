# Legacy editor import repair

## Problem

A test import created one new image record, but the editor still wrote some image paths into:

```text
/images/imported/
```

The cleaned data model requires:

```text
src        -> /images/portfolio/display/
thumbSrc   -> /images/portfolio/thumb/
textureSrc -> /images/portfolio/texture/
fullSrc    -> /images/portfolio/full/
```

That caused validation failures:

```text
Optimized image audit has 4 prefix violations
Portfolio image data validation has 4 errors
```

## Repair workflow

First audit the editor backend:

```powershell
.\scripts\Audit-EditorLegacyImportPaths.ps1
```

Then dry-run the repair:

```powershell
.\scripts\Repair-LegacyImportedImageRecords.ps1
```

Review:

```text
asset-reports\legacy-imported-image-repair-plan.txt
asset-reports\legacy-imported-image-repair-missing.csv
```

Apply:

```powershell
.\scripts\Repair-LegacyImportedImageRecords.ps1 -Apply
```

Then validate:

```powershell
.\scripts\Audit-OptimizedPortfolioImages.ps1
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
```

After validation passes, archive old unreferenced imported files:

```powershell
.\scripts\Archive-UnreferencedPublicImages.ps1
```

Review the plan, then:

```powershell
.\scripts\Archive-UnreferencedPublicImages.ps1 -Apply
```

## Editor hardening

This pack also includes the rendition-based editor import backend again:

```text
local-editor/app/image_importer.py
local-editor/app/asset_manager.py
```

Apply those files so future editor imports write directly into `public/images/portfolio/*`.
