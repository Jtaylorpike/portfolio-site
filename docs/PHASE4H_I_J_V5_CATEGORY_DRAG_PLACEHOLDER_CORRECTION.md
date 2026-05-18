# Phase 4H-I-J v5 — Category Drag Placeholder Correction

Date: 2026-05-16

## Scope

This pack is a narrow follow-up to the category-specific Images drag-and-drop ordering workflow. It corrects the remaining placeholder offset issue reported during real editor use and keeps the cursor normal until a drag actually activates.

The pack does not change public-site behavior, image data schema, import behavior, bulk editor behavior, gallery curation behavior, Three.js runtime behavior, wall placement, collision, or plaque fallback logic.

## Changed

- Reworked the category drag insertion calculation so the placeholder is temporarily removed before measuring the grid.
- Prevents the placeholder itself from reserving an extra CSS Grid cell during hit testing, which was creating the apparent blank card one position to the left or right of the intended placeholder.
- Keeps the placeholder insertion based on real category cards only.
- Keeps dragging available from the photo preview, title/metadata area, or any non-control card area.
- Keeps short photo-preview clicks available for opening the individual image editor page.
- Delays pointer capture until the custom drag actually activates, which makes normal clicks on image preview links more reliable.
- Keeps the mouse cursor normal during hover/short-click states and switches to grabbing only while a drag is active.
- Adds window-level pointerup/pointercancel cleanup so an armed-but-not-yet-started drag does not get stuck if the pointer leaves the editor region before release.
- Bumps editor cache assets to `v=61`.

## Manual test focus

1. Open `Images > Climbing` or another category-specific Images view.
2. Confirm the mouse cursor remains normal when hovering image cards.
3. Short-click a card photo preview and confirm it opens the individual image editor page.
4. Return to the category page.
5. Press and hold on the photo preview, then drag.
6. Confirm the cursor changes only after the drag activates.
7. Confirm one neutral placeholder appears in the grid and no adjacent extra blank card appears to the left or right.
8. Drag across cards in the first row, middle rows, and final row.
9. Drop, save category order, reload, and confirm order persists.
10. Confirm All Images remains non-draggable.
