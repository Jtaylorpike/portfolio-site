# Phase 4F — Editor import and gallery cleanup

Date: 2026-05-15

## Purpose

Phase 4F is a focused cleanup after the archive-editor visual rehaul exposed three remaining editor issues:

1. button styling still had an inset/bevel artifact that created a visible white rim inside pill buttons;
2. the import review cards still exposed crop/framing controls that were not needed during import;
3. the gallery editor empty state could say `galleryCuration.json is empty or missing` even when the file existed.

## Changes

### Button cleanup

The editor button reset now removes the previous inset highlight and forces flat archive-editor controls with a single visible border. This affects normal buttons, primary buttons, link buttons, hover states, and focus states.

### Import review simplification

The import editor now treats imports as metadata review cards rather than crop-editing cards.

Removed from import review cards:

```text
Thumbnail crop sliders
Virtual gallery crop sliders
Virtual gallery size slider
Gallery fit mode select
Gallery frame style select
```

The import workflow still preserves default hidden values for:

```text
thumbnailPosition
galleryPosition
galleryFrameStyle
galleryFitMode
gallerySize
heroPosition
heroFitMode
heroFrameStyle
```

Fine crop/framing edits remain available after import from the individual image detail and crop editor screens.

### Gallery curation empty-state cleanup

The Flask API now returns `galleryCurationStatus` diagnostics alongside editor state. The frontend uses those diagnostics to distinguish between:

```text
missing galleryCuration.json
existing file with zero rows
existing file with raw rows that failed normalization
loaded editable rows
```

The gallery editor no longer makes the false broad claim that `galleryCuration.json` is missing when the file exists.

## Files changed

```text
local-editor/app/data_store.py
local-editor/app/routes.py
local-editor/static/editor.css
local-editor/static/js/main.js
local-editor/static/js/render.js
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4F_EDITOR_IMPORT_AND_GALLERY_CLEANUP.md
PROJECT_CHANGELOG.md
```

## Validation

Run from repo root:

```powershell
npm run build
```

Manual checks:

```text
1. Reload the local editor and confirm buttons no longer show a white inner rim/bevel.
2. Prepare an import review and confirm import cards show compact thumbnails plus metadata only.
3. Confirm clicking an import thumbnail still opens the full preview lightbox.
4. Confirm import review no longer shows thumbnail crop, virtual gallery crop, gallery fit mode, or virtual gallery size controls.
5. Open the Gallery page and confirm the page loads existing gallery wall cards instead of a false missing-file warning.
6. If gallery curation data is intentionally empty, confirm the empty state describes the actual condition without falsely claiming the file is missing.
```
