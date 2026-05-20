# Phase 8G — Gallery Tonal Refinement Restart

## Summary

Phase 8G restarts the gallery visual-improvement work from the stable Phase 8F baseline after the user confirmed the greenish-grey camera-movement tracer appeared to be gone.

This pack deliberately avoids the approaches that caused the Phase 8B-8F issues:

- no procedural wall, ceiling, floor, or paper texture maps;
- no per-artwork transparent shadow planes;
- no dynamic WebGL shadow maps;
- no post-processing;
- no HDRI/environment assets;
- no new dependencies.

The pack focuses on a conservative tonal and fixture pass intended to make the current room feel warmer, more refined, and less flat without changing the gallery layout or interaction model.

## Runtime changes

- Warms and cleans up the matte wall, room-shell, ceiling, trim, frame, mat, fallback-artwork, and plaque-body material palette in `src/gallery/environment/galleryMaterials.ts`.
- Replaces the translucent ceiling-light panel material with an opaque, softly emissive `MeshStandardMaterial` to avoid transparency-related artifacts while keeping the fixture visually luminous.
- Adds a small ceiling-light panel frame material for recessed architectural fixture geometry.
- Warms the low-cost hemisphere/directional/point-light balance in `src/gallery/environment/galleryLighting.ts`.
- Slightly raises renderer tone-mapping exposure and aligns scene/clear color with the warmer gallery room palette in `src/gallery/GalleryScene.ts`.
- Rebuilds ceiling-light panel presentation as small grouped fixture geometry with four simple frame bars around each panel.

## Preserved boundaries

No changes were made to:

- room footprint;
- wall placement;
- wall IDs;
- collision behavior;
- movement controls;
- mobile controls;
- plaque collision/fallback logic;
- gallery curation data flow;
- editor behavior;
- image assets;
- routing;
- SEO files;
- public copy;
- favicon/logo/social-preview deferrals;
- dependencies.

## Manual check

After applying, hard refresh and open the virtual gallery. Check that:

1. the greenish-grey movement tracer remains gone;
2. the darker top-wall/cap band remains gone;
3. the room reads warmer and cleaner rather than more yellow, muddy, or game-like;
4. the ceiling panels feel more architectural and less like floating translucent overlays.

If the room still feels too flat after this pass, the next attempt should consider small architectural grounding geometry or explicitly authored low-frequency baked-light shapes, but only after visual review.
