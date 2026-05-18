# Pack Notes — Phase 4H-I-J v8 Category Drag Left-Threshold Tuning

## Summary

This pack makes the category image drag interaction less eager when moving the placeholder to the left side of another card. It keeps the single-placeholder model from v6 and the rightward pacing work from v7.

## Reason

The drag feature is now functionally working, but the left-side placement threshold still felt too sensitive. The user asked to reduce what it takes for the placeholder to move left of a card rather than continuing to tune the rightward path.

## Changed files

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

## Technical note

The previous leftward placement branch used a `0.42` target-card ratio. This pack changes that leftward crossing threshold to `0.28`, so the pointer has to move farther left inside the target card before the placeholder crosses. The thresholds are now named constants in `main.js` so future tuning is easier.

## Validation

```text
node --check local-editor/static/js/main.js
CSS brace-balance check
npm run build
unzip -t
```

## Manual test

Test dragging left and right across cards in a category-specific Images view. Confirm the placeholder feels less twitchy when crossing left of another card, then save and reload to confirm ordering still persists.
