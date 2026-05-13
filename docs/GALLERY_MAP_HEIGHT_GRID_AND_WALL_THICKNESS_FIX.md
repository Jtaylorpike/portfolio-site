# Gallery Map Height, Grid, and Wall Thickness Fix

Date: 2026-05-13

## Purpose

This update refines the local editor gallery floor map after the voxel/drag/drop placement controls were introduced.

The prior map behavior had three usability problems:

- The map room stretched too tall, so the user had to scroll from the top of the map to see the bottom.
- The grid used layered repeating backgrounds that could create visually uneven line spacing near the center of the map.
- Wall blocks did not read as uniform wall objects because different wall types could appear to have different visual thicknesses.

## Changes

- Constrains the map room to a viewport-aware height.
- Keeps the controls compact and lets the map fit into a more reasonable page area.
- Replaces the layered grid background with one uniform cell grid.
- Keeps the wall-block visual thickness constant across all wall block types.
- Preserves length differences between wall types.
- Keeps hidden walls subdued while still visible in the editor map.
- Bumps the local editor cache version to `v=41`.

## Not changed

This does not change:

- Runtime 3D gallery wall positions.
- Gallery curation data.
- Backend routes.
- Collision math.
- Drag/drop behavior.
- Rotation behavior.
- Plaque behavior.
- Lighting, fog, camera, or movement.
