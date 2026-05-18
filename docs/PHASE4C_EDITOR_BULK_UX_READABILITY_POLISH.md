# Phase 4C — Editor Bulk UX and Readability Polish

Date: 2026-05-15

## Purpose

Phase 4B added the working bulk editor and public visibility controls. Phase 4C keeps that behavior intact and improves the local editor interface so the controls read more like a professional curation tool.

This pack does not redesign the public website and does not change public filtering behavior.

## Changes

- Replaced the low-contrast `Public` / `Hidden` overview labels with larger, higher-contrast status chips:
  - `Visible on site`
  - `Hidden from site`
  - `Homepage hero`
- Added dot indicators inside status chips so visibility state is easier to scan.
- Added a visible hidden-state overlay on hidden image thumbnails.
- Reworked the bulk editor toolbar to match the light editor UI instead of using the darker Phase 4B block.
- Improved bulk toolbar copy and select labels.
- Added a selected-card visual state around thumbnails and image titles.
- Made the bulk apply button disabled until at least one image is selected and at least one bulk update is chosen.
- Improved the single-image public visibility checkbox copy to explain that hidden images remain in the editor while being filtered out of public outputs.
- Bumped local editor asset query strings to `v=47`.

## Files changed

```text
local-editor/static/editor.css
local-editor/static/js/main.js
local-editor/static/js/render.js
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4C_EDITOR_BULK_UX_READABILITY_POLISH.md
PROJECT_CHANGELOG.md
```

## Behavior intentionally preserved

- `isPublic: false` remains the public hide/show model.
- Hidden images remain in `src/data/galleryImages.json`.
- Hidden images keep their rendition paths and files.
- Bulk category reassignment behavior is unchanged.
- Bulk hero add remains limited to visible landscape images.
- Public filtering behavior is unchanged.

## Manual test focus

```text
1. Open the local editor Images page.
2. Confirm status chips are readable under image cards.
3. Hide one image and confirm the hidden thumbnail overlay appears.
4. Select one or more image cards and confirm selected cards are visually distinct.
5. Confirm Apply selected updates is disabled with no selected images.
6. Confirm Apply selected updates is disabled when images are selected but no bulk update is chosen.
7. Confirm Apply selected updates enables after at least one image and one update are selected.
8. Confirm bulk show/hide, category change, and hero add/remove still save correctly.
```
