# Phase 4H-I-J v9 — Category Drag Symmetric Threshold Tuning

Date: 2026-05-16

## Purpose

Tune the category-specific Images drag ordering after v8 testing showed that right-side placement still activated too early compared with left-side placement.

## User-reported behavior

- Dragging left felt good because the placeholder moved to the left of a neighboring card only after the pointer reached roughly the left half of that card.
- Dragging right still felt too sensitive because the placeholder could move or remain to the right of a neighboring card after only a small overlap.

## Change

- Keeps the v6 single-placeholder model.
- Keeps the floating ghost card.
- Keeps press/hold drag activation.
- Keeps short-click image preview navigation.
- Keeps All Images non-draggable.
- Adjusts the category drag insertion ratios so before/after placement is closer to the target card midpoint in both directions.

## Files changed

```text
local-editor/static/js/main.js
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4H_I_J_V9_CATEGORY_DRAG_SYMMETRIC_THRESHOLD.md
docs/PACK_NOTES_PHASE4H_I_J_V9.md
docs/PACK_MANIFEST_PHASE4H_I_J_V9.txt
PROJECT_CHANGELOG.md
```

## Validation

- `node --check local-editor/static/js/main.js`
- `npm run build`
- `unzip -t`

## Manual test focus

1. Open Images > a specific category.
2. Drag a card right over a neighboring card.
3. Confirm the placeholder does not jump to the right side until the pointer reaches roughly the midpoint/right half of the target card.
4. Drag a card left over a neighboring card.
5. Confirm left and right placement feel similar.
6. Save Category Order, reload, and confirm the order persists.
