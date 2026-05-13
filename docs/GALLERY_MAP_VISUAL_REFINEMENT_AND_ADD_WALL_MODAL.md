# Gallery Map Visual Refinement and Add Wall Modal

Date: 2026-05-13

## Purpose

This update improves the Gallery tab's floor-grid editor so the map reads more like a deliberate room-layout tool instead of a debug grid. It keeps the confirmed drag/drop wall-entity workflow, but improves the visual hierarchy and moves wall creation into a controlled modal.

## Changes

- Replaces the visible segmented square footprints with continuous black wall lines.
- Keeps the voxel/grid placement model internally for collision detection and snapping.
- Fixes 45-degree wall visuals so resting walls read the same way as dragged walls.
- Removes the visual axis labels from the map surface.
- Centers the facing indicator on the side of the wall that is currently facing outward.
- Moves the Save Gallery Curation button into the map column beneath the grid.
- Stretches the right wall-entity sidebar so its scroll list reaches the bottom of the sidebar container.
- Widens the editor working area to give the floor map more room.
- Moves Add Wall Card out of the map summary and into the wall-card section header.
- Changes Add Wall Card into a modal flow so wall type, artwork, display status, plaque side, and plaque visibility can be chosen before the card is added.

## Behavior

Dragging walls still works the same:

- Drag a wall card from the sidebar onto the map to place it.
- Drag a placed wall on the map to move it.
- Drag a placed wall off the map to mark it as not on map without deleting the card.
- Use map controls to rotate, flip, or remove the selected wall from the map.
- Use Remove Wall on the wall card to delete the wall entity after confirmation.

## Notes

The visual wall line is continuous, but collision logic still uses occupied grid cells. This preserves the user's preferred voxel-style mental model without making the map look like a collection of disconnected squares.
