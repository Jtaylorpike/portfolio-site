# Pack Notes — Phase 4H-I-J v9 Category Drag Symmetric Threshold

## Summary

This is a narrow tuning pack for category-specific image drag ordering. It keeps the working v6 single-placeholder model and tunes the threshold logic so right-side placement feels closer to the left-side pacing that tested well after v8.

## What changed

- Increased the threshold used when a card that is already after a target should snap back before that target.
- Reduced the mismatch where dragging right could feel like the placeholder moved to the right side after only a small overlap.
- Kept drag activation, ghost card behavior, short-click image navigation, non-draggable All Images, and existing save behavior unchanged.
- Bumped local editor cache strings to `v=65`.

## Files included

See `docs/PACK_MANIFEST_PHASE4H_I_J_V9.txt`.

## Validation

- `node --check local-editor/static/js/main.js`
- `npm run build`
- `unzip -t`

## Manual test

Open a category-specific Images page and drag cards left and right across neighboring cards. The placeholder should now require a roughly midpoint-style overlap before committing to either side, instead of snapping to the right with minimal overlap.
