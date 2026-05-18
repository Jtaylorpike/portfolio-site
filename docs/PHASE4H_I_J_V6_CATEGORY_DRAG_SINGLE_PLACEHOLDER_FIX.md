# Phase 4H-I-J v6 — Category Drag Single-Placeholder Fix

Updated: 2026-05-16

## Purpose

This pack corrects the remaining category-image drag ordering issue where an extra blank cell could appear to the left or right of the intended drop placeholder.

## Change summary

The previous drag implementation used a separate placeholder node while hiding the source card. In CSS Grid, that could still produce confusing placement artifacts during drag activation and live movement. This pack changes the model so the real card becomes the placeholder while a cloned ghost card floats above the grid.

## Completed

```text
Category drag now uses the source card as the single grid placeholder.
The floating ghost card remains the visible dragged preview.
No separate placeholder element is created during drag.
The duplicate/adjacent blank-cell artifact should be removed.
Window-level pointermove handling keeps the placeholder updating even when the pointer leaves the editor list area.
The mouse cursor remains normal before drag activation and switches only during active drag.
Pack notes and pack manifests are now stored under docs/ instead of the project root for this pack and future packs.
A PowerShell cleanup script can move older root-level pack notes/manifests into docs folders.
Editor asset version bumped to v=62.
```

## Manual test focus

```text
1. Open Images > a specific category.
2. Short-click a photo preview and confirm it opens the image editor page.
3. Press and hold on the photo preview or non-control card area, then drag.
4. Confirm the ghost card lifts.
5. Confirm there is only one blank placeholder in the grid.
6. Confirm no extra adjacent blank cell appears at the row start, row end, or beside the intended placeholder.
7. Drop, click Save Category Order, reload, and confirm the order persists.
8. Confirm All Images remains read-only for ordering.
```

## Untouched

```text
Public site behavior
Image data schema
Import workflow behavior
Bulk editor behavior
Gallery curation behavior
Three.js runtime
Gallery wall placement math
Collision logic
Plaque fallback logic
```
