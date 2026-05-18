# Phase 4H-I-J v7 — Category Drag Pacing Refinement

Date: 2026-05-16

## Purpose

Phase 4H-I-J v7 is a narrow refinement to the category-specific image drag-and-drop ordering interaction.

The v6 single-placeholder model fixed the extra adjacent blank-cell artifact. After testing, the remaining issue was that moving a dragged card to the right of another card felt too abrupt compared with moving left.

## Changes

- Kept the v6 single-placeholder model where the source card becomes the live placeholder.
- Replaced midpoint-only insertion with a direction-aware insertion buffer.
- Rightward movement now requires the pointer to move farther across the target card before the placeholder advances after it.
- Leftward movement keeps a smaller return buffer so the interaction feels steadier instead of over-snapping.
- Pointer movement through the gap between cards now keeps the current placeholder position instead of advancing immediately.
- Bumped local editor cache version to `v=63`.

## Unchanged behavior

- All Images remains read-only for ordering.
- Category-specific Images views remain reorderable.
- Short-clicking an image preview still opens the individual image editor page.
- Press-and-hold still activates drag from the image preview or other non-control card areas.
- The floating ghost-card preview remains.
- The source card remains the single placeholder.
- Existing Top / Up / Down fallback buttons remain.
- Public-site behavior is unchanged.
- Import behavior is unchanged.
- Gallery curation behavior is unchanged.
- Three.js runtime, wall placement, collision logic, and plaque fallback behavior are unchanged.

## Validation

Run:

```powershell
npm run build
```

Manual test focus:

```text
1. Open Images > a specific category.
2. Press/hold on an image preview or non-control card area to start dragging.
3. Move the dragged card to the right of neighboring cards.
4. Confirm placeholder movement feels less abrupt than v6.
5. Move the dragged card left and confirm it still feels controlled.
6. Drop, save category order, reload, and confirm the order persists.
```
