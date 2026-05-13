# Gallery Room Footprint Settings

Date: 2026-05-13

## Summary

The virtual gallery now has an explicit room footprint settings file:

```text
src/data/galleryRoom.json
```

This is the first step toward making the gallery room larger, configurable, and eventually less strictly square/rectangular. The current default values intentionally preserve the existing room.

## Current file shape

```json
{
  "schemaVersion": 1,
  "id": "main-gallery-room",
  "label": "Main gallery room",
  "shape": "rectangle",
  "grid": {
    "cellMeters": 0.5,
    "minX": -16,
    "maxX": 16,
    "minZ": -16,
    "maxZ": 16
  },
  "floor": {
    "width": 34,
    "depth": 34,
    "color": "#d8d0c3"
  },
  "shell": {
    "height": 3.9,
    "wallThickness": 0.34,
    "ceilingThickness": 0.12
  },
  "movementBounds": {
    "minX": -16.3,
    "maxX": 16.3,
    "minZ": -16.3,
    "maxZ": 16.3
  },
  "start": {
    "position": [0, 1.65, 13.4],
    "yaw": 0
  }
}
```

## Current runtime use

`src/gallery/environment/galleryBlueprint.ts` now reads normalized room settings from:

```text
src/data/galleryRoom.ts
```

The following runtime values are now derived from the data-backed room settings:

```text
galleryFloor
galleryRoom
galleryStart
movementBounds
gallery curation placement clamping grid size
```

The current room remains visually unchanged by default.

## Current editor use

The editor now receives `galleryRoom` in `/api/data`, and the backend backs up `galleryRoom.json` with the other source JSON files.

The editor map still uses its existing map/grid UI. A later pack should connect the map bounds directly to `galleryRoom.json` so room footprint editing and wall placement validation share the same source of truth.

## Future room shapes

Supported shape labels are intentionally forward-looking:

```text
rectangle
l-shaped
custom-footprint
```

Only `rectangle` is currently implemented as a real runtime room shape. Do not set the room to `l-shaped` or `custom-footprint` yet and expect geometry/collision to change automatically.

## Recommended next implementation steps

1. Add read-only room summary UI to the Gallery tab.
2. Let the editor map read `galleryRoom.grid` instead of hardcoded map bounds.
3. Add room footprint presets while keeping rectangle as the default.
4. Add editor-side room dimensions only after map/runtime bounds are proven to stay synchronized.
5. Add non-square room support through an explicit boundary model, not by manually scattering wall/floor/collision numbers.
