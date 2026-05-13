# Gallery Room and Editor Model Baseline

Date: 2026-05-13

## Purpose

This document captures the current stable model after the gallery editor reached a usable state. It is intended to prevent future chats or future packs from confusing the editor map, the 3D room, wall entities, artwork assignment, and room architecture.

## Current mental model

The virtual gallery now has four separate concepts that should stay separate:

```text
Room footprint      = the architectural shell and playable floor area
Wall entities       = saved wall cards that may or may not be placed in the room
Wall placement      = the grid/map position and facing of a wall entity
Artwork curation    = which portfolio image, plaque behavior, and display state belong to a wall
```

Do not collapse these ideas back into one hardcoded `galleryBlueprint.ts` list. The project is moving toward an authored gallery/editor system.

## Current editor model

The Flask local editor is the active editing surface. For the gallery it currently manages:

```text
src/data/galleryCuration.json
```

The curation records include:

```text
wallId
artworkId
showInGallery
placedInGallery
displayOrder
wallType
plaqueEnabled
plaqueSide
positionX
positionZ
rotationYDegrees
```

Important behavior:

- A wall card can exist without being placed on the map.
- Dragging a wall off the map should mark it as not placed, not delete the wall entity.
- `showInGallery: false` means hidden in the runtime gallery.
- `placedInGallery: false` means not physically placed in the current room layout.
- Removing a wall entity should remain a deliberate action with confirmation.
- Map placement uses voxel-style cells, not freeform coordinates.
- Wall blocks should read as continuous rectangular wall segments on the map.
- The map is an editor abstraction, not the final visual style of the 3D room.

## Current room model

The runtime room now has an explicit baseline settings file:

```text
src/data/galleryRoom.json
```

The current default remains the same square/rectangular room used before the room settings file was added. This pack does not redesign the room.

Current default model:

```text
shape: rectangle
floor: 34m x 34m
grid: -16m to 16m on X and Z
cell size: 0.5m
movement bounds: -16.3m to 16.3m on X and Z
shell height: 3.9m
```

The point of the new data file is not to immediately make the room bigger. The point is to establish a future architectural source of truth.

## What should not be changed casually

The following areas are sensitive:

```text
src/gallery/environment/galleryBlueprint.ts
src/gallery/artwork/galleryLayout.ts
src/gallery/controls/movementController.ts
local-editor/static/js/galleryGrid.js
src/data/galleryCuration.json
src/data/galleryRoom.json
```

Do not casually change:

- collision radius
- room movement bounds
- wall footprint math
- plaque fallback behavior
- hidden/placed wall semantics
- gallery curation schema
- GitHub Pages asset path handling
- image ID / rendition path contract

## Design direction reminder

The gallery should feel like a mix of a museum and a private archive. It should eventually feel like a real room, not a generic 3D demo. Future work can explore a larger or non-square footprint, but the room should remain restrained, quiet, architectural, and image-led.

A good future room direction is:

```text
entry feature wall
quiet side display zones
archive-like rear or side wall
selective architectural dividers
controlled lighting
possible windows showing user-local time of day
```

Avoid turning the gallery into a game map, a maze, or a generic white-box environment.
