# Phase 4A — Editor rename metadata refresh fix, v2

Date: 2026-05-15

## Summary

This replacement Phase 4A pack corrects the controlled image ID rename workflow so the editor keeps the new ID, current title, suggested title-based ID, and rendition URL fields aligned after renaming an image and its four rendition files.

This v2 pack replaces the earlier Phase 4A attempt.

## Root cause

The original bug came from the rename workflow saving the new ID and rendition paths while not necessarily saving the current visible title/metadata edits from the open image card.

The first attempted fix added a metadata snapshot to the rename request, but it still performed an immediate post-rename `/api/data` reload and did not bump the editor module cache key. That left too much room for the visible editor to render from stale state after the backend had already completed the rename.

## Change in v2

The rename workflow now does four things together:

```text
1. Collects a whitelisted metadata snapshot from the open image card.
2. Sends that snapshot with currentImageId and newImageId.
3. Lets the backend merge only safe non-path metadata fields before writing the renamed image record.
4. Renders the editor directly from the successful rename response instead of performing an immediate post-rename /api/data reload.
```

Normal editor data loads also use a cache-busting query value and `cache: "no-store"`, and the editor template module version was bumped from `v=44` to `v=45`.

## Metadata allowed to travel with rename

```text
title
category
year
location
note
alt
thumbnailPosition
heroPosition
galleryPosition
galleryFitMode
galleryFrameStyle
gallerySize
heroFitMode
heroFrameStyle
```

## Backend-owned fields during rename

The browser is still not allowed to override these through the rename metadata snapshot:

```text
id
src
thumbSrc
textureSrc
fullSrc
imageWidth
imageHeight
imageAspectRatio
imageOrientation
```

The backend remains responsible for the final ID, all four rendition URLs, and the file move plan.

## Files changed

```text
local-editor/app/data_store.py
local-editor/app/routes.py
local-editor/static/js/api.js
local-editor/static/js/main.js
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4A_EDITOR_RENAME_METADATA_REFRESH_FIX.md
PROJECT_CHANGELOG.md
```

## Expected manual test

From the local editor:

1. Open an image detail page.
2. Change the Title field to a new value.
3. Click Refresh From Title.
4. Confirm the suggested title-based ID changes to the expected slug.
5. Click Rename ID + Rendition Files.
6. Confirm the rename.
7. Verify that the page route changes to the new image ID.
8. Verify that Current ID shows the new ID.
9. Verify that the hidden `id` field contains the new ID.
10. Verify that the Title field keeps the new title.
11. Verify that Suggested title-based ID matches the new title/new ID.
12. Verify that `src`, `thumbSrc`, `textureSrc`, and `fullSrc` point to the new ID filenames.
13. Reload the editor page and confirm the same values remain.

## Validation performed in pack workspace

```text
python3 -m py_compile local-editor/app/data_store.py local-editor/app/routes.py
node --check local-editor/static/js/api.js
node --check local-editor/static/js/main.js
npm ci --ignore-scripts
npm run build
node scripts/validate-portfolio-image-data.mjs
```

The image-data validator passed after restoring the thumbnail-mode chat upload into a test runtime-image structure with temporary display/texture/full rendition copies for validation purposes.

Additional tests performed:

```text
Direct backend rename simulation in a disposable project copy
Headless Chromium DOM metadata-collection simulation
```

The direct backend test confirmed that submitted title/category/year/location/note/alt/gallery metadata survived the rename, all four rendition paths changed to the new ID, all four rendition files moved, and the hero slide reference moved from the old ID to the new ID.

The headless browser DOM simulation confirmed that the visible card metadata collected for rename includes the current title and that the visible current ID/hidden ID fields can be aligned to the new ID.

## Scope note

This pack does not add hide/show controls, bulk edit controls, import-review improvements, or category creation from dropdowns. Those remain next Phase 4 tasks.
