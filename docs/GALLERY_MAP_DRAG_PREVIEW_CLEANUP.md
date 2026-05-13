# Gallery Map Drag Preview Cleanup

Date: 2026-05-13

## Purpose

The floor-grid map already renders the wall footprint that matters while a wall entity is being placed. The browser's default drag ghost was also showing the full sidebar card text over the map, which made placement harder to read.

This update hides the native browser drag ghost for gallery wall drags so the user sees the actual map footprint preview instead of a floating text/card overlay.

## Behavior

- Dragging from the wall-entity sidebar still begins a wall placement operation.
- Dragging an existing map footprint still moves that placed wall.
- The map still shows the live footprint landing preview.
- Collision preview styling still appears when the target grid cell would overlap another wall.
- The sidebar card or map marker being dragged is visually muted in place.
- Dragging an existing map footprint off the map still marks it as not placed; it does not delete the wall card/entity.

## Implementation notes

- `main.js` creates a transparent one-pixel drag image and passes it to `dataTransfer.setDragImage()` during gallery wall drag start.
- The editor body gets `data-gallery-wall-dragging="true"` during a gallery drag for cursor and styling hooks.
- Matching sidebar items and map markers get `data-gallery-dragging="true"` while they are being dragged.
- The implementation does not change gallery curation data, backend routes, runtime Three.js behavior, or wall placement math.

## Also cleaned up

The `addGalleryWallCard()` default record had a duplicated `placedInGallery: false` key from the prior drag/drop pack. This was harmless at runtime because the second value won, but it was removed to keep the source cleaner.
