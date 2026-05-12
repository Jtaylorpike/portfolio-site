# Future Gallery Map Editor Plan

The current Gallery tab edits wall assignments, wall block type, display status, and plaque behavior. A future update should move toward a top-down map editor.

## End goal

The editor should eventually let the user understand and curate the 3D gallery as a real room. It should feel like arranging a small museum/private archive installation, not editing abstract JSON rows.

## Proposed phases

### Phase 1: Read-only map

Show a top-down room diagram using current `galleryBlueprint.ts` wall positions. Each wall slot should display:

- wall label
- wall block type
- active/hidden status
- assigned artwork thumbnail

This phase should not move walls yet.

### Phase 2: Select wall from map

Clicking a wall in the map should scroll to or open the matching wall card. The card remains the editing surface.

### Phase 3: Basic wall organization

Expose safer controls for:

- wall block type
- active/hidden status
- assigned artwork
- plaque side
- display order

The physical blueprint remains stable.

### Phase 4: Room layout authoring

Only after the curation model is stable, consider editing physical wall positions, rotations, and dimensions. This should be treated as a major gallery architecture update because it affects collisions, movement, framing, and the museum/private-archive feeling of the room.

## Long-term visual direction

The room should eventually feel like a real museum/private archive space. Possible future environmental features include windows that reflect the user's local time of day outside, but that should come after the core room, lighting, wall layout, and curation tools are stable.
