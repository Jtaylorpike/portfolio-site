# Phase 4H-I-J v3 — Dynamic Category Drag Preview

Date: 2026-05-16

## Purpose

This pack refines the category-specific Images drag-and-drop interaction after the v2 drag smoothing pass was confirmed functional but still felt clunky.

The goal is to make reordering feel closer to a professional asset editor: the selected card visually lifts away from the grid, an empty placeholder remains in the stack, and the placeholder moves live between neighboring cards based on pointer position.

## Scope

- Applies only to category-specific Images views.
- The All images view remains non-draggable.
- The public portfolio, public gallery runtime, data schema, import workflow, dirty-state workflow, and gallery curation editor behavior are unchanged.

## Changes

- Allows dragging from the photo preview, title/metadata area, or any non-control part of a category image card.
- Keeps buttons, inputs, labels, selects, and explicit no-drag controls interactive.
- Replaces direct DOM movement of the card during drag with a lifted ghost card plus a neutral placeholder.
- The placeholder moves between cards while dragging based on the pointer position relative to the target card midpoint.
- Release drops the real card into the placeholder position.
- Existing Top / Up / Down controls remain as fallback controls.
- Editor cache version bumped to `v=59`.

## Validation

- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance check
- `npm run build` from a full source copy with the pack files applied
- `unzip -t` on the generated pack

## Manual test steps

1. Open the local editor.
2. Go to Images.
3. Open any category-specific Images view, not All images.
4. Drag from the thumbnail area of a card.
5. Confirm the card lifts visually and a neutral placeholder remains in the grid.
6. Drag across neighboring cards and confirm the placeholder moves before/after cards based on pointer position.
7. Release the card and confirm it lands in the placeholder position.
8. Click Save Category Order.
9. Reload and confirm the saved order persists.
10. Confirm buttons, checkboxes, selects, and labels still work without starting a drag.
