# Gallery Editor Stabilization and Polish

This update turns the Gallery tab from a raw wall-assignment list into a more useful curation dashboard.

## What changed

- Added a curation summary above the wall cards.
- Added counts for total wall slots, active walls, hidden walls, and assigned artwork.
- Added wall block type count pills.
- Added filters for search, display status, wall block type, and artwork category.
- Added visual status badges to each wall card.
- Added search/category filters inside the visual artwork assignment overlay.
- Kept the existing Assigned Artwork ID select as the precise fallback control.

## Design intent

The Gallery tab should feel like a private archive/control room for the 3D museum space. The editor should help the user make curatorial decisions visually and quickly, while still keeping stable internal wall IDs available for precise debugging.

Wall card labels should remain human-readable. Internal wall IDs are still visible, but they are not the main user-facing organization model.

## What this does not change

This update does not move physical wall positions, redesign the room, change collisions, change lighting, re-enable fog, or alter plaque placement in the public Three.js gallery. It is a control-surface and data-safety update.
