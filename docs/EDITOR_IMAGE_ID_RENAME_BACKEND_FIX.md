# Editor Image ID Rename Backend Fix

## Purpose

This update fixes the backend side of the controlled Image ID rename workflow.

The earlier UI refresh fixes were not enough because `local-editor/app/data_store.py` called three helper functions that were not present in the current source:

- `make_unique_image_id()`
- `get_rename_file_plan()`
- `apply_rename_file_plan()`

Without those helpers, a rename request can fail before the editor has a valid updated image state to render.

## What changed

`data_store.py` now includes backend helpers that:

- slugify and de-duplicate requested image IDs
- build canonical rendition URLs for `src`, `thumbSrc`, `textureSrc`, and `fullSrc`
- safely resolve public asset URLs into paths under `public/`
- validate that source rendition files exist before renaming
- block overwriting existing target rendition files
- move all four rendition files
- roll back already-moved files if a later file move fails

The pack also keeps the prior authoritative UI reload behavior and bumps the editor cache version to `v=19`.

## Manual result expected

After clicking `Rename ID + Rendition Files`, the editor should:

- complete the backend rename without a Python `NameError`
- update `galleryImages.json`
- update hero slide references when applicable
- rename the four rendition files
- navigate to `#/image/<new-id>`
- show the new ID in the visible `Current ID` panel
