# Gallery Map Drag Direction and Rectangle Wall Refinement

## Purpose

This update is a focused editor-map refinement after the voxel map orientation/boundary pass.

The previous map orientation pass correctly flipped the resting wall markers, but the temporary drag/drop preview still used the older X-axis mapping. That made the interaction feel inverted while dragging left and right.

## Changes

- Updated the drag/drop preview X-axis mapping so it matches the resting wall marker mapping.
- Kept the grid's visually mirrored orientation, but made the drag feedback move consistently with the visible map.
- Made resting wall blocks use the same clean rectangular visual language as the wall preview shown while dragging.
- Removed rounded/pill styling from wall lines.
- Tightened the map controls container so it does not occupy unnecessary vertical space.
- Hid the helper sentence inside the compact control bar; the icon buttons and selected wall label now carry the interaction.
- Bumped the local editor asset cache to `v=39`.

## Notes

This does not change the gallery runtime, saved gallery data, wall collision math, boundary validation, image data, or backend routes.

The pack is strictly an editor interaction/visual refinement for the gallery placement map.
