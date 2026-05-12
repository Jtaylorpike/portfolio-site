# TaylorPikePortfolio-ImageArchiveSafetyPack-20260511

## Included files
- `.gitignore`
- `docs/IMAGE_ARCHIVE_WORKFLOW.md`
- `scripts/List-ArchivedImages.ps1`
- `PROJECT_CHANGELOG.md`
- `REPLACEMENT_PACK_NOTES.md`

## Purpose
Protect the local image archive so unimported images are not deleted or accidentally committed.

## What changed
- Added `asset-archive/` to `.gitignore`.
- Added `asset-reports/` to `.gitignore`.
- Added ignored local staging folders:
  - `assets-to-import/`
  - `source-images/`
- Added image archive workflow documentation.
- Added a script to list archived images.

## Recommended use
Keep `asset-archive/` locally. Do not delete it. Commit only `public/images` and `public/fonts` for GitHub Pages.
