# Pack Notes — Phase 4H-I-J v2 Category Drag Smoothing

## Purpose

This pack corrects the category-specific Images drag-and-drop behavior from the combined Phase 4H-I-J editor functionality pack. The previous version worked but was too clunky because ordering depended on a small drag handle and a native HTML5 drag/drop path that could feel delayed on the card grid.

## What changed

- Category image reorder cards can now be dragged from any non-control part of the card.
- The visible drag-handle button was removed.
- Buttons, checkboxes, selects, labels, and explicit no-drag regions remain normal controls.
- Thumbnail/title links still open normally on click, while accidental clicks are suppressed after a drag.
- Reorder behavior now uses pointer events and a row-aware grid insertion calculation.
- The All images page remains non-draggable.
- The existing Top / Up / Down fallback controls remain available.
- Editor cache was bumped to `v=58`.

## Files included

See `PACK_MANIFEST_PHASE4H_I_J_V2.txt`.

## Validation run

```text
node --check local-editor/static/js/main.js
node --check local-editor/static/js/render.js
CSS brace-balance check
npm ci --ignore-scripts
npm run build
unzip -t TaylorPikePortfolio-Phase4H-I-J-v2-CategoryDragSmoothing-Pack-20260516.zip
```

## Manual test focus

```text
1. Open Images > a specific category.
2. Drag a card from the thumbnail, metadata, or empty card area.
3. Confirm the card reorders immediately while dragging.
4. Confirm the select checkbox and Top / Up / Down buttons do not start a drag.
5. Confirm clicking a thumbnail without dragging still opens the image editor.
6. Save Category Order.
7. Reload and confirm the new order persists.
8. Confirm All images remains non-draggable.
```

## Unchanged

- Public site behavior and styling.
- Data schema.
- Import behavior.
- Dirty-state behavior, except the reorder interaction still marks the editor dirty when a drag completes.
- Gallery curation behavior.
- Three.js runtime behavior.
- Wall placement, collision, and plaque fallback behavior.
