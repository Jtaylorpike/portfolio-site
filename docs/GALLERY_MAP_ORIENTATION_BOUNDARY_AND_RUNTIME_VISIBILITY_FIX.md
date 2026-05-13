# Gallery Map Orientation, Boundary, and Runtime Visibility Fix

Date: 2026-05-13

## Purpose

This update fixes several issues discovered after the voxel-based gallery map editor was introduced.

The editor map should read as a physical floor-layout tool. Walls should be visible as clear wall lines, facing arrows should communicate the side of the wall that faces the viewer, map orientation should feel natural, and invalid wall placement should be blocked before it reaches the runtime gallery.

## Changes

- Hidden gallery walls are now filtered out of the runtime 3D gallery wall mesh list.
- Hidden walls still remain as saved editor entities, but they no longer appear as physical walls in the virtual gallery.
- The floor map is horizontally mirrored in the editor so the layout reads more naturally from the editing view.
- The map no longer displays X/Z axis labels.
- The map grid now uses a uniform floor-cell grid instead of stacked minor/major line layers, which removes the irregular close-line artifact near the center.
- Wall marks on the map now render as darker continuous wall lines with squared ends.
- Facing arrows now stay attached to the side of the wall they indicate and inherit the wall rotation correctly, including 45-degree rotations.
- The Save Gallery Curation button now lives inside the map-control bar, next to the layout controls.
- Placement validation now detects walls whose footprint extends beyond the outside border of the map.
- Out-of-bounds walls disable Save Wall and Save Gallery Curation until corrected.
- Backend validation and the Node image-data validator now also reject out-of-bounds wall footprints.

## Notes

Dragging a wall off the map still marks it as not placed; it does not delete the wall entity. Boundary validation applies only to placed walls.

The public 3D gallery runtime now treats `showInGallery: false` as hiding the physical wall as well as its artwork. `placedInGallery: false` continues to mean the wall entity exists in the editor but is not placed in the room.
