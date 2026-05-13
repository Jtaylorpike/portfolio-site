# Gallery Map Final Viewport and Grid Fix

Date: 2026-05-13

## Purpose

The voxel floor-map editor had three related visual problems:

- the map became vertically condensed after the previous height fix,
- the grid showed uneven/doubled center-line artifacts,
- horizontal and vertical wall blocks appeared to have inconsistent visual thickness.

This pass treats the map as a true square floor-board again while keeping it bounded enough that it does not become a huge page-length panel.

## Changes

- Restores the floor map to a square board so X and Z cells are visually equal.
- Sizes the board with a viewport-aware clamp instead of a fixed short height.
- Removes the legacy `::before` and `::after` center-axis lines that were still drawing over the grid and creating the apparent uneven line spacing.
- Uses one uniform grid rhythm based on `calc(100% / 65)` for both axes.
- Removes the previous fixed `13px` wall thickness override.
- Uses each marker's real voxel depth variable so all wall blocks share the same one-cell thickness while differing only by length.
- Keeps hidden walls subdued and collision/boundary walls visually distinct.
- Keeps the map controls compact.

## Files changed

- `local-editor/static/editor.css`
- `local-editor/templates/editor.html`

## Notes

No gallery runtime files, data files, backend routes, image files, collision math, wall schema, lighting, fog, camera, or plaque logic changed in this pack.
