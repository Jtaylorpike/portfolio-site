# Local editor fit mode normalization fix

## Problem

The editor import flow can attempt to save a new imported image record with an invalid `heroFitMode`, usually a UI-oriented value such as:

```text
auto
```

The site data model only supports these fit modes:

```text
cover
contain
```

That caused errors like:

```text
Image 'landscape-201019-jtp6059' has an invalid hero fit mode.
```

## Fix

`local-editor/app/data_store.py` now performs a final normalization pass at the write boundary inside `save_project_data()`.

This means any editor workflow that calls `save_project_data()` gets normalized before validation and before JSON is written.

## Added repair script

Run a dry repair audit:

```powershell
.\scripts\Repair-PortfolioImageModes.ps1
```

Apply if needed:

```powershell
.\scripts\Repair-PortfolioImageModes.ps1 -Apply
```

This only repairs:

```text
heroFitMode
galleryFitMode
heroFrameStyle
galleryFrameStyle
```

## Expected valid values

```text
heroFitMode/galleryFitMode: cover | contain
heroFrameStyle/galleryFrameStyle: auto | landscape | portrait | square
```

## Validation

After applying:

```powershell
.\scripts\Repair-PortfolioImageModes.ps1
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
```

Then retry the editor import.
