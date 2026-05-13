# Gallery Map Visible Voxel Walls and Icon Controls

Date: 2026-05-13

## Purpose

This update tightens the floor-grid editor after the voxel placement pass. The previous version represented wall direction clearly with numbers and facing arrows, but the actual wall footprints could read too faintly on the grid. This made the map feel like a set of labels instead of a tile-based wall layout editor.

## Changes

- Makes placed wall footprints visibly occupy their grid cells at rest.
- Keeps each occupied wall cell as a full tile, matching the voxel/tile mental model.
- Improves selected-wall treatment so the current wall is easier to locate.
- Keeps collision styling on the wall cells themselves.
- Keeps hidden/inactive walls visible but visually reduced.
- Changes map rotation controls from text labels to icon-style controls:
  - `↺` rotate left 45 degrees
  - `↻` rotate right 45 degrees
  - `⇄` flip facing direction
- Preserves accessible labels and tooltips for the icon buttons.
- Bumps the local editor asset cache to `v=36`.

## What did not change

- No runtime 3D gallery files changed.
- No gallery curation data changed.
- No wall placement math changed.
- No collision detection logic changed.
- No image data or renditions changed.
- No backend routes changed.

## Notes

This is an editor-map readability update. It does not change how the walls are saved or where they appear in the 3D gallery. It only makes the current grid editor easier to understand visually.
