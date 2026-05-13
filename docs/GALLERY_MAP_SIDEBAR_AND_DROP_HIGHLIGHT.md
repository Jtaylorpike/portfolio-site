# Gallery Map Sidebar and Drop Highlight

This update refines the drag/drop wall entity editor so the map behaves more like a layout workspace.

## Changes

- The floor map now sits on the left side of the placement row.
- The wall entity sidebar now sits on the right side of the placement row.
- Sidebar wall items have stronger card framing so each draggable entity reads as a separate draggable object.
- Sidebar labels now prioritize:
  - wall number as the primary header
  - assigned artwork title as the secondary header
  - wall block type and map status as supporting metadata
- Dragging over the map now shows a live footprint preview of where the wall will land.
- The landing preview uses the dragged wall's current wall block type and facing direction.
- If the hovered landing position would collide with another placed wall, the preview changes to the collision warning treatment.

## Behavior preserved

Dragging a wall footprint off the map still marks the wall card as not placed. It does not delete the wall entity. The wall card can be dragged back onto the map later.

This update does not change the 3D runtime gallery, image data, wall entity schema, or backend routes.
