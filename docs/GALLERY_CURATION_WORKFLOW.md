# Gallery Curation Workflow

This pack introduces `src/data/galleryCuration.json` as the editable assignment layer for the 3D gallery.

## Purpose

The Three.js gallery architecture still lives in `src/gallery/environment/galleryBlueprint.ts`. That file remains responsible for the physical room layout: floor size, room shell, wall positions, movement-sensitive wall blocks, and light panels.

`galleryCuration.json` now controls what appears on those gallery wall slots:

```text
wallId
artworkId
showInGallery
displayOrder
wallType
plaqueEnabled
plaqueSide
```

This keeps the room architecture stable while allowing the local editor to curate the exhibition.

## Editor workflow

Open the Flask editor and use the new Gallery tab.

The Gallery tab lets you:

- assign an image to each fixed gallery wall
- leave guide/blank walls empty
- move wall assignments to change display-order metadata
- change the wall section label
- choose plaque side
- hide an artwork from the gallery without deleting the wall
- disable plaques for individual walls

Save with **Save Gallery Curation**. This writes only `src/data/galleryCuration.json` and does not rewrite image/category/hero data.

## Rename safety

When an image ID is renamed through the controlled editor workflow, matching `galleryCuration[].artworkId` references are updated with the new ID.

## Known boundary

This pack does not create a visual drag-and-drop room map. The physical wall layout is still TypeScript-driven. This is the first safe step toward a richer gallery wall placement editor.


## Visual assignment UX

The editor now keeps the precise Assigned artwork ID select as a fallback, but normal assignment should happen through the **Assign artwork** button. That button opens a thumbnail grid of all portfolio images so artwork can be chosen visually.

## Wall type model

The earlier `wallSection` field was too category-like and did not describe the physical role of the wall. The curation data now uses a smaller descriptive `wallType` set:

- `entry-feature-wall`
- `transition-guide-wall`
- `outer-gallery-wall`
- `inner-partition-wall`
- `rear-gallery-wall`
- `unassigned-wall`

The wall ID remains an internal blueprint slot. The wall type is the human/editor-facing role of that slot, which gives the future layout more room to evolve.


## Wall block type model

The editor now treats wall type as physical wall-block metadata, not gallery-zone language. Use `feature-wall`, `wide-display-wall`, `standard-display-wall`, or `compact-display-wall` to describe the wall size/shape. The current wall slot still controls position/rotation, but wall type now affects the wall preset and artwork scale in the rendered Three.js gallery.

Each wall card also has a local `Save Wall` action. Use it for isolated changes to one assignment. Use `Save All Gallery Curation` for batch edits, reordering, or multi-wall changes.

## Current editor usability layer

The Gallery tab now includes a curation summary, wall filters, wall-card badges, and searchable artwork assignment overlay filters. These are editor usability features; they do not alter the physical gallery room by themselves.

