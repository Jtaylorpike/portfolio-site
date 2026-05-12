# Taylor Pike Portfolio Project Changelog

This file records meaningful design, architecture, data, editor, and gallery changes made during development.

Current source files remain the source of truth. This changelog is a historical record and should be updated with every replacement pack going forward.

---

## 2026-05-11 — Image archive safety workflow

### Changed
- Added `asset-archive/` and `asset-reports/` to `.gitignore`.
- Added local-only image holding folders to `.gitignore`.
- Added documentation clarifying that `asset-archive/` is a preservation area, not trash.
- Added a script to list archived images and write `asset-reports/archived-images.txt`.

### Files changed
- `.gitignore`
- `docs/IMAGE_ARCHIVE_WORKFLOW.md`
- `scripts/List-ArchivedImages.ps1`
- `PROJECT_CHANGELOG.md`

### Notes
- This prevents accidental commits of archived/unprocessed source images while keeping them locally available for future imports.

---
