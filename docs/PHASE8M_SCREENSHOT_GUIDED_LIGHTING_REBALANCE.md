# Phase 8M — Screenshot-Guided Lighting Rebalance

Date: 2026-05-19

## Status

Current Phase 8 runtime refinement after the Phase 8L rollback.

Phase 8K was rejected because it made the room much too dark with basically no visible lighting. Phase 8L restored the Phase 8J runtime baseline. Phase 8M makes a narrower correction from that baseline: the room should remain dramatic, but the ceiling, walls, fixtures, floor, frames, and plaques should stay readable.

## Reason

The user provided a current wide gallery screenshot showing that the dramatic-lighting direction still needed a better testing loop and narrower changes. The correct target is the approved dramatic museum/private-archive mockup: warm, cinematic, and higher contrast, but not blacked out.

Phase 8M intentionally avoids another large darkness/exposure swing. The goal is a usable middle ground:

- darker and warmer than the flat early gallery baseline;
- brighter and more readable than Phase 8K;
- ceiling remains atmospheric but visible;
- fixture pools and artwork accents are present but not harsh;
- frame highlights remain restrained and wood-like.

## Runtime changes

Changed files:

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
```

Runtime behavior:

- raises the room's base warm visibility from the Phase 8J/8K dramatic direction;
- gives the ceiling material a subtle warm emissive floor so it does not collapse into near-black;
- keeps ceiling relief as simple opaque geometry, not a texture map;
- keeps the scene background/clear color warm and dark, but less black than Phase 8K;
- raises tone-mapping exposure moderately;
- adds restrained non-shadow-casting artwork accent spotlights, capped at eight artworks;
- retunes ceiling-panel point lights and panel spotlights for warmer visible pools;
- keeps dark stained-wood frame materials and rail catchlights restrained.

## Screenshot review workflow

For future visual review, use three consistent screenshots after applying a pack and hard refreshing:

1. **Wide main-artwork view.** Stand back from the main hero wall so the large artwork, ceiling fixture, adjacent walls, floor, and exit button are visible. This checks total exposure, ceiling darkness, wall readability, and whether the room still feels like a gallery.
2. **Frame close-up.** Move closer to the main artwork at a slight angle so the frame rails, mat, plaque, and nearby wall are visible. This checks dark-stained wood depth, sheen, plaque contrast, and whether the frame feels lacquered rather than plastic or flat.
3. **Corridor/depth view.** Look down a longer gallery lane with multiple partitions and ceiling fixtures visible. This checks warm falloff, fixture rhythm, ceiling texture/relief, and whether distant walls disappear into black.

A capture-mode tool is not required right now because normal screenshots are sufficient. Keep the views roughly consistent between packs so visual comparisons are meaningful.

## Preserved constraints

This pack does not change:

```text
room footprint
wall placement
wall IDs
collision
movement controls
mobile controls
plaque fallback logic
gallery curation/editor logic
image assets
routing
SEO files
public copy
logo/favicon/social-preview work
dependencies
```

This pack does not add:

```text
dynamic shadow maps
castShadow / receiveShadow
procedural surface texture maps
transparent shadow geometry
post-processing
fog
new dependencies
new image assets
```

## Validation

Validated with:

```text
npm run build
static no-shadow-map checks
static no-CanvasTexture check in galleryMaterials.ts
root-relative pack structure check
unzip -t
```
