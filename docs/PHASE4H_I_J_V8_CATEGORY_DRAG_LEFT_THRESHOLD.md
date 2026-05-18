# Phase 4H-I-J v8 — Category Drag Left-Threshold Tuning

Date: 2026-05-16

## Purpose

This is a narrow follow-up to the category image drag-ordering interaction. Phase 4H-I-J v7 made rightward placeholder movement less abrupt, but the user reported that reducing the sensitivity for moving the placeholder to the left of another card may be a cleaner way to even out the interaction.

## Changes

- Preserves the Phase 4H-I-J v6 single-placeholder model where the dragged source card becomes the only grid placeholder.
- Preserves the floating ghost preview.
- Preserves short-click image preview navigation and press/hold drag activation.
- Preserves the non-draggable All Images view.
- Keeps the v7 rightward insertion buffer.
- Adds named insertion-threshold constants for right, left, and neutral/center placement.
- Lowers the left-side insertion threshold from `0.42` to `0.28`, meaning the pointer must move farther into the left side of a neighboring card before the placeholder crosses to that card's leading edge.
- Bumps local editor assets to `v=64`.

## Files changed

```text
local-editor/static/js/main.js
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4H_I_J_V8_CATEGORY_DRAG_LEFT_THRESHOLD.md
docs/PACK_NOTES_PHASE4H_I_J_V8.md
docs/PACK_MANIFEST_PHASE4H_I_J_V8.txt
PROJECT_CHANGELOG.md
```

## Manual test focus

```text
1. Open Images > a specific category.
2. Drag a card left across a neighboring card.
3. Confirm the placeholder does not jump left too early.
4. Drag right across neighboring cards and confirm v7 pacing still feels acceptable.
5. Drop, save category order, reload, and confirm the order persists.
6. Confirm short-clicking the photo preview still opens the individual image editor page.
7. Confirm All Images remains read-only for ordering.
```

## Not changed

- Public-site behavior.
- Public-site styling.
- Image data schema.
- Import behavior.
- Gallery curation behavior.
- Three.js runtime.
- Gallery wall placement, collision, or plaque fallback logic.
