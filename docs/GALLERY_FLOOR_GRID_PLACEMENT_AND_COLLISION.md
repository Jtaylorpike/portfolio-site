# Gallery Floor Grid Placement and Collision

This update makes gallery wall placement use a floor-grid model instead of freehand meter inputs.

## Why

The prior X/Z controls technically worked, but they were not intuitive. They also allowed two wall blocks to be placed on top of each other because the editor treated each wall as a single point instead of a physical object with width and thickness.

The new model treats each wall as a footprint on a 0.5m floor grid. Wall block type controls the size of the footprint, and facing controls whether that footprint runs horizontally or vertically on the top-down map.

## Editor behavior

Each wall card now shows:

- Grid X
- Grid Z
- Facing
- Footprint size in floor cells and meters
- Collision warning when another wall occupies the same floor cells

The editor still writes the runtime fields the 3D gallery already uses:

```json
{
  "positionX": 0,
  "positionZ": 7,
  "rotationYDegrees": 0
}
```

The grid controls are the human-facing placement layer. The meter values remain the runtime layer.

## Collision rules

The collision checker uses the physical wall preset attached to each wall type:

```text
Feature wall            6.25m x 0.26m
Wide display wall       4.90m x 0.22m
Standard display wall   3.55m x 0.22m
Compact display wall    2.70m x 0.22m
Narrow transition wall  2.15m x 0.20m
```

The editor blocks Save Wall and Save All when wall footprints overlap.

The backend also validates collisions before writing `galleryCuration.json`, so a stale browser or direct API call cannot save overlapping wall placements.

## Runtime behavior

The 3D gallery still reads `positionX`, `positionZ`, and `rotationYDegrees` from `src/data/galleryCuration.json`.

This pack does not add drag-and-drop movement yet. It creates the safe grid/voxel foundation for that future editor.
