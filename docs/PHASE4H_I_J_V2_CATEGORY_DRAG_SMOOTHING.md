# Phase 4H-I-J v2 — Category Drag Smoothing

Updated: 2026-05-16

## Purpose

This follow-up pack corrects the first category image drag-and-drop implementation after real editor testing showed that the handle-only interaction felt clunky and that visual reordering could lag behind the pointer.

## Scope

- Keep the Phase 4H-I-J data model, save flow, dirty-state behavior, import collision handling, and public-site behavior unchanged.
- Replace handle-only category drag ordering with direct card drag ordering.
- Keep the All images view non-draggable.
- Preserve existing Top / Up / Down controls as fallback ordering controls.

## Changes

- Category-specific image cards can now be dragged from any non-control part of the card.
- Buttons, checkboxes, selects, labels, and explicit no-drag regions stay interactive and do not start a drag.
- Thumbnail/title links still open normally on click, but dragging from them suppresses the accidental follow-up click.
- The old visible drag-handle button was removed from reorder cards.
- The drag algorithm now uses pointer events and row-aware grid insertion instead of native HTML5 drag/drop and a vertical-only insertion calculation.
- Editor copy now says to drag the card itself rather than a handle.
- Editor asset cache was bumped to `v=58`.

## Files changed

```text
local-editor/static/editor.css
local-editor/static/js/main.js
local-editor/static/js/render.js
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4H_I_J_V2_CATEGORY_DRAG_SMOOTHING.md
PROJECT_CHANGELOG.md
```

## Validation

- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance check
- `npm ci --ignore-scripts`
- `npm run build`
- `unzip -t` on the packaged zip

## Manual test focus

1. Open Images > a specific category.
2. Drag an image card from the thumbnail, metadata, or empty card area.
3. Confirm the card reorders immediately while dragging.
4. Confirm buttons and checkbox controls remain clickable and do not start a drag.
5. Confirm clicking a thumbnail/title without dragging still opens the image editor.
6. Click Save Category Order.
7. Reload and confirm the saved order persists.
8. Confirm All images still has no drag ordering behavior.
