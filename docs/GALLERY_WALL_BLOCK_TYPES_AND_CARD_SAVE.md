# Gallery Wall Block Types and Per-Card Save

This update changes the gallery curation editor from semantic/location-based wall labels to physical wall-block types. The goal is to make the controls survive future room-layout changes. A wall type now describes the size/shape role of a wall block instead of where that block currently sits in the room.

## Wall block types

Current wall block types:

```text
feature-wall           = hero-scale wall and hero-scale artwork
wide-display-wall      = long wall and large artwork
standard-display-wall  = medium wall and medium artwork
compact-display-wall   = short wall and small artwork
narrow-transition-wall = slim wall and small artwork for transitional/guide moments
```

The physical position and rotation of each wall slot still come from `galleryBlueprint.ts`. Changing a wall block type does not move a wall, but it now affects the wall preset and artwork scale used by the Three.js gallery. This makes the field meaningful without turning the editor into a full spatial layout editor yet.

## Per-card save

Each gallery wall card now includes a `Save Wall` button. The button sends only that wall card's curation record to the backend, where it is merged into the current `galleryCuration.json`. The global `Save All Gallery Curation` button remains available for batch changes and reordering.

## Why this direction

The gallery is expected to evolve into a museum/private-archive room rather than stay locked to the current wall positions. Human-facing editor language should therefore avoid labels like `Left outer wall` or `Rear wall` unless the placement itself is being edited. Physical wall types are more durable: feature, wide, standard, compact, and narrow transition. Display status is handled separately, so a wall does not need an `unassigned` type to be inactive.
