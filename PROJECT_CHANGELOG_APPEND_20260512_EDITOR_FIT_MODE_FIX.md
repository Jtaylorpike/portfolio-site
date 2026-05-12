## 2026-05-12 — Local editor fit mode normalization fix

### Changed
- Updated `local-editor/app/data_store.py` so `save_project_data()` performs a final normalization pass before validation and writing JSON.
- Added `Repair-PortfolioImageModes.ps1` to audit and repair invalid fit/frame values in `galleryImages.json`.
- Added documentation for the editor fit mode import error.

### Files changed
- `local-editor/app/data_store.py`
- `scripts/Repair-PortfolioImageModes.ps1`
- `docs/LOCAL_EDITOR_FIT_MODE_NORMALIZATION_FIX.md`
- `PROJECT_CHANGELOG_APPEND_20260512_EDITOR_FIT_MODE_FIX.md`

### Notes
- This fixes editor import errors where a new record has an invalid `heroFitMode`.
- Valid fit modes remain `cover` and `contain`; invalid values are normalized to `cover`.
