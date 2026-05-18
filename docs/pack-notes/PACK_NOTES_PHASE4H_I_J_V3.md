# Pack Notes — Phase 4H-I-J v3 Dynamic Category Drag Preview

## Summary

This pack improves the category-specific Images drag-and-drop interaction without changing the underlying order-save behavior.

The card now lifts into a floating ghost during drag, a neutral placeholder remains in the grid, and the placeholder moves live before/after neighboring cards depending on pointer position.

## Changed files

- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4H_I_J_V3_DYNAMIC_DRAG_PREVIEW.md`
- `PROJECT_CHANGELOG.md`

## Not changed

- Public portfolio behavior
- Public site styling
- Gallery curation schema
- Three.js gallery runtime
- Import behavior
- Dirty-state behavior
- Bulk edit behavior
- Save Category Order backend behavior

## Validation run

- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance check
- `npm run build` from a full source copy with this pack applied
- `unzip -t`

## Manual test

1. Open Images > any category-specific image view.
2. Drag from the photo preview area of a card.
3. Confirm the card lifts and an empty placeholder stays in the grid.
4. Drag over neighboring cards and confirm the placeholder moves before/after cards based on pointer position.
5. Drop, save category order, reload, and confirm the order persists.
6. Confirm All images has no drag ordering behavior.
