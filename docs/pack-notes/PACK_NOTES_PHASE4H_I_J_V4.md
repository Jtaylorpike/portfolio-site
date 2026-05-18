# Pack Notes — Phase 4H-I-J v4 Category Drag Interaction Refinement

## Purpose

This pack refines the category-specific Images drag-and-drop interaction after the dynamic drag preview pass proved too awkward in live use.

## User-facing fixes

- Dragging can start from the photo preview without triggering normal browser image dragging.
- A short photo-preview click opens the individual image editor page.
- A brief hold activates the custom drag interaction.
- The lifted card remains as a floating ghost card.
- A neutral placeholder remains in the grid and moves between cards based on pointer position.
- Placeholder placement no longer calculates against itself, which prevents the extra empty left-side cell/offset behavior.
- All Images remains read-only for ordering.

## Files changed

- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4H_I_J_V4_CATEGORY_DRAG_INTERACTION_REFINEMENT.md`
- `PROJECT_CHANGELOG.md`

## Validation run

- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance check
- `npm run build`
- `unzip -t`

## Manual test focus

1. Hard-refresh the local editor after applying the pack.
2. Open a category-specific Images view.
3. Short-click a photo preview and confirm it opens the individual image editor page.
4. Press and hold on a photo preview, then drag.
5. Confirm the card lifts and a placeholder remains behind.
6. Drag across cards and confirm the placeholder moves before/after cards based on pointer position.
7. Drop, save category order, reload, and confirm order persists.
8. Confirm All Images remains non-draggable.

## Explicitly unchanged

- Public-site behavior and styling.
- Data schema.
- Import behavior.
- Bulk editor behavior.
- Gallery curation behavior.
- Three.js gallery runtime.
- Gallery wall placement, collision, and plaque fallback logic.
