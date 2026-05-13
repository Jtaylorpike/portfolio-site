# Gallery Voxel Map + Rotation Controls

This update changes the gallery placement editor from a meter/coordinate-first control model into a floor-grid model that reads more like a simple voxel or tile-based room editor.

## What changed

- Wall footprints now occupy whole grid cells instead of visually sitting between grid lines.
- Wall block types use discrete footprint lengths:
  - Feature wall: 13 x 1 cells
  - Wide display wall: 11 x 1 cells
  - Standard display wall: 7 x 1 cells
  - Compact display wall: 5 x 1 cells
  - Narrow transition wall: 3 x 1 cells
- The card-level Grid X, Grid Z, and Facing controls were removed from the visible wall cards.
- Placement is now handled from the map itself:
  - drag a wall card from the sidebar onto the map
  - drag a placed wall footprint around the map
  - use map controls to rotate selected walls by 45 degrees
  - use map controls to flip which side the wall faces
  - use map controls to remove a wall from the map without deleting the wall card/entity
- Each placed wall now shows a facing indicator on the map so the front side is visible.
- Collision detection now checks occupied grid cells rather than rectangle bounds.

## Why this exists

The previous grid worked technically, but it was not intuitive. A horizontal wall could appear to sit on a line or halfway between lines, which meant the user had to experiment to understand where the wall actually lived. The new model treats every wall as a set of occupied floor squares, so the map behaves more like a small tile-based room editor.

## Data model notes

The saved schema remains compatible with the existing curation model:

```text
positionX
positionZ
rotationYDegrees
placedInGallery
wallType
```

The editor still saves meter positions because the Three.js gallery runtime uses meter coordinates. The map converts those meter values into grid cells for editing.

`rotationYDegrees` now supports 45-degree increments:

```text
-180, -135, -90, -45, 0, 45, 90, 135, 180
```

## Current limitations

- The map is still an editor surface, not a full room-layout solver.
- Diagonal wall footprints are represented as diagonal occupied cells in the editor.
- Runtime wall rendering still uses the existing Three.js wall block system and meter positions.
- The editor does not yet show camera/player collision bounds or walking-path clearance.
