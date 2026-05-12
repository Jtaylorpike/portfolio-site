# Taylor Pike Portfolio Project Changelog

This file records meaningful design, architecture, data, editor, and gallery changes made during development.

Current source files remain the source of truth. This changelog is a historical record and should be updated with every replacement pack going forward.

---

## 2026-05-11 — GitHub Pages public asset path fix and image rendition structure

### Changed
- Updated `src/data/images.ts` so public image paths from JSON are resolved through `import.meta.env.BASE_URL`.
- This fixes GitHub Pages project-path deployments where `/images/...` would otherwise resolve to the domain root instead of `/portfolio-site/images/...`.
- Added a dry-run-first migration script for moving portfolio images into rendition-based folders.
- Added an asset URL audit script.
- Added documentation for the future public image folder structure.

### Files changed
- `src/data/images.ts`
- `scripts/Migrate-PublicImagesToRenditions.ps1`
- `scripts/Audit-PublicAssetUrls.ps1`
- `docs/PUBLIC_IMAGE_RENDITION_STRUCTURE.md`
- `PROJECT_CHANGELOG.md`

### Notes
- The image folder structure should eventually be organized by rendition/purpose, not by category. Category belongs in JSON, not in the filesystem.

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
