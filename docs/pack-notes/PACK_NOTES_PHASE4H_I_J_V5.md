# Pack Notes — Phase 4H-I-J v5 Category Drag Placeholder Correction

## Purpose

Correct the remaining category image drag-and-drop UX issue where the placeholder could appear offset by one CSS Grid cell, creating the impression of an extra blank card beside the intended drop location. This also corrects cursor behavior so the editor only shows a drag cursor after the drag has actually activated.

## Included changes

- Category drag placeholder is removed before measuring card positions, then reinserted after the intended insertion point is calculated.
- Insertion logic is based only on real category cards, not on the placeholder or hidden dragged card.
- Pointer capture is delayed until custom drag activation, improving short-click navigation from image previews.
- Window-level pointer cleanup prevents stale armed drag state.
- Cursor styling stays normal until the active drag state begins.
- Category help text now explains short-click versus press-and-hold behavior.
- Editor cache version is bumped to `v=61`.

## Files changed

- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4H_I_J_V5_CATEGORY_DRAG_PLACEHOLDER_CORRECTION.md`
- `PROJECT_CHANGELOG.md`

## Validation run

- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance check
- `npm run build`
- `unzip -t`

## Unchanged

- Public-site behavior.
- Image data schema.
- Import behavior.
- Bulk editor behavior.
- Gallery curation behavior.
- Three.js runtime behavior.
- Wall placement, collision, and plaque fallback behavior.
