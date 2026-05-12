# Gallery Wall Type and Display Status Cleanup

This update separates two concepts that were previously muddled in the Gallery editor:

1. **Wall block type** describes the physical form and scale of the wall.
2. **Display status** describes whether that wall slot is currently active in the 3D gallery.

## Why this changed

The earlier `unassigned-wall` option was useful as a technical fallback, but it was not a good authoring control. It mixed a physical wall type with an editorial state. A wall can be physically narrow, compact, standard, wide, or feature-scale while still being hidden/inactive for the current gallery curation.

The editor should make that distinction clear.

## Current wall block types

```text
Feature wall
Wide display wall
Standard display wall
Compact display wall
Narrow transition wall
```

These labels are based on physical form/scale rather than current room placement. That makes them more stable if the room layout changes later.

## Display status

Each wall card now has a separate Display status control:

```text
Active / visible
Hidden / inactive
```

The status still writes to the existing `showInGallery` field in `src/data/galleryCuration.json`, so the public gallery data contract stays simple.

## Internal fallback behavior

Old `unassigned-wall` values are migrated to `narrow-transition-wall` during normalization. Unknown wall types fall back to `standard-display-wall` instead of remaining visible as an editor option.

## What did not change

This update does not redesign the gallery room, move walls, change collisions, or alter lighting/fog/plaque placement. It only clarifies the curation data model and editor UX.
