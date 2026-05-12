# TaylorPikePortfolio-LocalEditorFitModeNormalizationFixPack-20260512

## Included files
- `local-editor/app/data_store.py`
- `scripts/Repair-PortfolioImageModes.ps1`
- `docs/LOCAL_EDITOR_FIT_MODE_NORMALIZATION_FIX.md`
- `PROJECT_CHANGELOG_APPEND_20260512_EDITOR_FIT_MODE_FIX.md`
- `REPLACEMENT_PACK_NOTES.md`

## Purpose
Fix the local editor import error:

```text
Image 'landscape-201019-jtp6059' has an invalid hero fit mode.
```

## What changed
- `save_project_data()` now normalizes categories, images, and hero slides before validating/writing JSON.
- Invalid fit modes normalize to `cover`.
- Invalid frame styles normalize to `auto`.
- Added a repair script for existing JSON records.

## Run
```powershell
.\scripts\Repair-PortfolioImageModes.ps1
.\scripts\Repair-PortfolioImageModes.ps1 -Apply
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
```

Then retry the editor import.
