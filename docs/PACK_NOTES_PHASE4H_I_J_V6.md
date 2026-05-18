# Pack Notes — Phase 4H-I-J v6 Category Drag Single-Placeholder Fix

## Summary

This pack is a narrow category drag-ordering correction. It replaces the separate placeholder-node model with a single-placeholder model where the original card itself becomes the grid placeholder while a cloned card floats as the drag ghost.

## Why this exists

The v5 drag correction still allowed a confusing extra blank card/cell to appear beside or near the intended placeholder. The issue was tied to using a separate placeholder element while hiding the original card in a CSS Grid layout.

## Files changed

```text
local-editor/static/editor.css
local-editor/static/js/main.js
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4H_I_J_V6_CATEGORY_DRAG_SINGLE_PLACEHOLDER_FIX.md
docs/PACK_NOTES_PHASE4H_I_J_V6.md
docs/PACK_MANIFEST_PHASE4H_I_J_V6.txt
scripts/Move-PackDocsIntoDocs.ps1
PROJECT_CHANGELOG.md
```

## Behavioral changes

```text
The dragged source card stays in the grid as the only placeholder.
The floating ghost card remains the visual drag preview.
Placeholder movement happens by moving the real source card through the grid.
Window-level pointermove events keep drag placement updating outside the immediate editor list region.
The cursor remains normal until drag activation.
```

## Validation performed

```text
node --check local-editor/static/js/main.js
node --check local-editor/static/js/render.js
CSS brace-balance check
npm run build
unzip -t
```

## Notes

Pack notes and manifests for this pack are stored in `docs/` instead of the project root. This pack also includes `scripts/Move-PackDocsIntoDocs.ps1`, which can be run once from the project root to move older root-level `PACK_NOTES_*.md` and `PACK_MANIFEST_*.txt` files into `docs/pack-notes/` and `docs/pack-manifests/`.
