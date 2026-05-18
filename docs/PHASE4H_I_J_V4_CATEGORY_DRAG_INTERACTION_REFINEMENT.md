# Phase 4H-I-J v4 — Category Drag Interaction Refinement

Date: 2026-05-16

## Scope

This pack refines the category-specific Images drag-and-drop behavior after the first dynamic drag preview pass proved visually closer but still awkward in real use.

The pack is intentionally narrow. It only touches the category image ordering interaction and related editor styling/cache metadata.

## Changed

- Category cards can still be dragged from any non-control part of the card, including the photo preview.
- Category card preview images now disable native browser image dragging so the custom editor drag behavior receives the interaction.
- A short click on the preview image still routes to the individual image editor page.
- Dragging now waits for a brief hold before activating so normal clicks and intentional drags are easier to distinguish.
- The lifted card/ghost still follows the pointer, while the original grid leaves a neutral placeholder behind.
- Placeholder placement now calculates against real cards only, not against the placeholder itself, which prevents the extra empty cell/side-offset behavior seen in the previous pass.
- Placeholder sizing now matches the lifted card more closely.
- All Images remains read-only for ordering.

## Unchanged

- Public site behavior.
- Image data schema.
- Category order save endpoint and save behavior.
- Bulk show/hide/category/hero controls.
- Import behavior.
- Gallery curation behavior.
- Three.js gallery runtime.
- Gallery wall placement, collision, and plaque fallback logic.

## Manual test focus

1. Open `Images > Climbing` or any category-specific Images view.
2. Short-click a card photo preview and confirm it opens the individual image editor page.
3. Return to the category page.
4. Press and hold on the photo preview, then drag.
5. Confirm the card lifts and a neutral placeholder remains behind.
6. Drag across neighboring cards and confirm the placeholder moves before or after each card based on pointer position.
7. Confirm no extra empty left-side cell remains after dropping.
8. Save Category Order, reload, and confirm the order persists.
9. Confirm All Images does not expose drag ordering.
