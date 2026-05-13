# Gallery Drag/Drop Wall Entity Editor

This update changes the gallery placement editor from a coordinate-first tool into a more physical wall-entity layout tool.

## What changed

- The floor map now has a wall-entity sidebar beside it.
- Wall names can be dragged from the sidebar onto the map.
- Placed wall footprints can be dragged directly on the map.
- Dragging a placed wall off the map marks it as not placed instead of deleting the wall card.
- Each wall card now has a separate map-placement state:
  - `placedInGallery: true` means the wall exists on the map and can render as physical gallery geometry.
  - `placedInGallery: false` means the wall entity stays in curation data but does not exist on the map/runtime room.
- The Add Wall Card button creates a new custom wall entity in the editor.
- Each wall card has a Remove Wall button with confirmation to prevent accidental removal.

## Why this exists

Freehand X/Z placement worked technically but did not match the mental model of arranging physical gallery walls. A wall is a block that occupies floor space, so dragging wall entities onto a 0.5m grid is more intuitive than typing coordinates.

This also separates three different ideas that were starting to blur together:

- Wall entity: the editable card/data row.
- Map placement: whether that wall is physically in the room.
- Display status: whether a placed wall should actively show work in the gallery.

## Important behavior

Dragging a wall off the map does not remove the card. It only sets the wall to not placed.

Removing a wall card is different. Removal deletes the wall entity from the visible curation list and requires Save All Gallery Curation to persist the removal.

## Runtime behavior

The 3D gallery now treats `galleryCuration.json` as the wall-entity source of truth once the file exists. This allows custom editor-created wall entities to appear in the gallery, and it prevents removed base wall cards from being resurrected by the older hardcoded fallback layout.

If `galleryCuration.json` is missing or empty, the original TypeScript base wall layout remains the safety fallback.

## Current limitations

- Dragging is grid-snapped but not yet keyboard-nudgeable.
- Rotation still uses the existing Facing select, not map handles.
- Removing a wall card persists only after saving the full gallery curation list.
- This does not yet add wall duplication templates or room-boundary validation beyond the current grid limits and footprint collision checks.
