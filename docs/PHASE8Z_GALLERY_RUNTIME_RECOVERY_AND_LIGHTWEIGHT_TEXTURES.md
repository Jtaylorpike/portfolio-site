# Phase 8Z — Gallery runtime recovery and lightweight textures

Date: 2026-05-19

## Summary

Phase 8Z is a recovery/refinement pack after the Phase 8Y pack caused the gallery to show the loading screen briefly and then return to the welcome screen.

Likely cause:

- the active gallery controller from Phase 8X expects `prewarmGalleryEnvironmentMaterials` from `src/gallery/environment/galleryMaterials.ts`;
- Phase 8Y replaced `galleryMaterials.ts` with a file that did not export that function;
- Phase 8Y also used higher-cost per-pixel procedural texture work that was a poor direction for the loader/freezing issue.

## Runtime changes

### `src/gallery/environment/galleryMaterials.ts`

- restores `prewarmGalleryEnvironmentMaterials` so the current gallery controller can call it safely;
- replaces the expensive fBM/per-pixel procedural texture generation with cheaper Canvas drawing routines;
- keeps visible sand/plaster wall texture while reducing the organized grid look;
- keeps the floor in the improved matte-marble/polished-stone direction;
- lightens the ceiling and keeps a warm-charcoal knockdown-style texture;
- keeps the same public material function names used by `GalleryScene.ts`.

## Out of scope

This pack does not change:

- room footprint or wall placement;
- collision, plaque fallback, or gallery curation logic;
- editor behavior;
- mobile gallery controls;
- image assets;
- routing, SEO, or public copy;
- new dependencies, post-processing, fog, or external texture assets.

## Validation

Validated with:

```text
npm run build
unzip -t
```
