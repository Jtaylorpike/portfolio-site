# Phase 4G — Gallery Editor UX Professionalization

Updated: 2026-05-15

## Purpose

Phase 4G brings the virtual gallery curation page into the same archive-editor visual system introduced for the rest of the Flask local editor.

The goal is not to redesign the public portfolio site or change the Three.js gallery runtime. This pack only improves the local editor surface used to manage gallery wall cards, map placement, artwork assignment, wall type, visibility, and plaque behavior.

## Changed

```text
Gallery page now has an archive-room editor summary header
Top-level Save All Gallery Curation action added to the gallery summary
Gallery status cards now show wall cards, map placement, artwork assignment, and visible/hidden counts
Filter controls are grouped into a clearer Wall Finder panel
Gallery wall cards now use a cleaner two-column editor layout
Wall-card headers now separate blueprint identity from status chips
Status chip labels are more readable: Visible in room, Hidden from room, On map, Not on map, Artwork assigned, Needs artwork
Artwork assignment section is clearer and keeps Assign artwork / Preview artwork actions together
Fallback artwork-ID select is moved into a precise/advanced details block while remaining available for exact ID edits
Wall behavior controls are grouped into a Room behavior section
Map-position and footprint readouts are easier to scan
Card actions are grouped as Save Wall, Move Top, Move Up, Move Down, Remove Wall
Gallery artwork picker, preview overlay, add-wall overlay, map controls, and sidebar received matching archive-editor polish
Editor asset version bumped to v=51
```

## Files changed

```text
local-editor/static/editor.css
local-editor/static/js/main.js
local-editor/static/js/render.js
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4G_GALLERY_EDITOR_UX_PROFESSIONALIZATION.md
PROJECT_CHANGELOG.md
```

## Behavior intentionally preserved

```text
No public-site behavior changes
No gallery runtime / Three.js changes
No galleryCuration.json schema change
No wall placement math change
No collision or boundary logic change
No plaque fallback logic change
No image visibility model change
```

The existing data selectors remain in the rendered markup so save, filter, map, picker, preview, and wall movement behavior can continue using the existing JavaScript event handlers.

## Validation

Run from repo root:

```powershell
npm run build
```

Useful local editor test flow:

```text
1. Open the local editor.
2. Go to Gallery.
3. Confirm the page renders existing wall cards without a missing galleryCuration.json warning.
4. Use the Wall Finder filters.
5. Click a wall thumbnail and confirm the artwork preview opens.
6. Click the wall-preview card and confirm the wall preview opens.
7. Assign a different artwork with the visual picker.
8. Change wall type, display status, plaque side, and plaque checkbox.
9. Move one card up/down.
10. Save one wall.
11. Save all gallery curation.
12. Reload and confirm the saved state persists.
```

## Notes

This pack is a UX/readability pass. It should make the gallery editor feel like a professional archive-control surface while preserving the bare-bones local-tool philosophy.
