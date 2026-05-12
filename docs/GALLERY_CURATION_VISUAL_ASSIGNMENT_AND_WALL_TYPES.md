# Gallery Curation Visual Assignment and Wall Types

This update improves the local editor's Gallery page so curation can happen visually instead of by reading image IDs.

## Artwork assignment

Each wall card keeps the exact `artworkId` select as a fallback, but the preferred workflow is now the **Assign artwork** button. It opens an overlay with a grid of all portfolio thumbnails, titles, categories, and years. Selecting a thumbnail updates the wall card preview, assigned artwork title, metadata line, and hidden/select-backed `artworkId` value.

## Wall types

The earlier `wallSection` field was ambiguous because it looked like category organization rather than spatial architecture. The editor now uses `wallType`, which describes the role of a wall slot inside the room.

Current wall types:

- `entry-feature-wall` — the main first-read wall near the entrance.
- `transition-guide-wall` — architectural walls that shape movement or thresholds.
- `outer-gallery-wall` — perimeter display walls.
- `inner-partition-wall` — freestanding interior walls that create archive-like aisles.
- `rear-gallery-wall` — back wall or end-cap placements.
- `unassigned-wall` — temporary holding type for unresolved layout decisions.

The internal `wallId` values remain stable blueprint slots. The visible editor labels are intentionally more human because the long-term gallery should feel like a museum/private archive, not a raw technical wall list.
