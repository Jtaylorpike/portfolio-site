# Phase 8E — Gallery Surface Tone Correction

Date: 2026-05-18

## Purpose

Phase 8E corrects the first Phase 8 runtime visual issue after user screenshot review. The gallery opened after Phase 8C, but the user observed that the most visible change was an unappealing darker tone along the top of the walls. The room did not feel meaningfully more refined.

The likely cause was the Phase 8B/8C wall and ceiling texture-map treatment being applied to box geometry faces, including visible wall cap/top faces. Phase 8E removes that treatment rather than trying to tune it further.

## Runtime changes

```text
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
```

### Materials

- Removed procedural wall texture maps.
- Removed procedural ceiling texture maps.
- Restored cleaner flat off-white wall, shell-wall, and ceiling tones.
- Preserved deterministic floor texture.
- Preserved deterministic paper/mat texture.
- Preserved restrained frame, trim, plaque, and panel material refinements.

### Lighting

- Kept the low-cost hemisphere/directional/point-light model.
- Slightly corrected the upper-room balance to reduce muddy ceiling/top-wall appearance.
- Did not add dynamic shadows, post-processing, or new dependencies.

## Preserved boundaries

No changes were made to:

- `src/gallery/GalleryScene.ts`;
- wall placement;
- room footprint;
- collision behavior;
- plaque fallback logic;
- gallery curation data;
- editor behavior;
- mobile controls;
- image assets;
- routing;
- public copy;
- logo/favicon/social preview work.

## Phase 8D note

A Phase 8D rollback pack was generated during troubleshooting when the gallery was initially thought to still be inaccessible after Phase 8C. The user later clarified that Phase 8C worked after a proper browser refresh. Phase 8D should therefore be treated as fallback-only/not accepted unless the user explicitly says it was applied.

## Next visual review question

After applying Phase 8E, check whether the darker top-wall/cap band is gone. If the gallery still feels too flat, the next pass should be a separately approved spatial-grounding proposal rather than another broad procedural wall texture attempt.
