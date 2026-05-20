# Phase 8N — Light Volume and Ceiling Readability

Date: 2026-05-19

## Status

Current Phase 8 runtime refinement after screenshot review of Phase 8M.

Phase 8M improved the post-Phase-8K recovery, but the user's three screenshots showed that the ceiling was still collapsing toward black, the visible fixtures were not creating enough believable surface illumination, and the room still felt more flat/muddy than the approved dramatic museum/private-archive mockup.

Phase 8N makes a controlled lighting-volume correction from Phase 8M. The goal is not to make the room darker. The goal is to keep a dark, warm ceiling while adding enough fixture-driven light volume that the walls, frames, floor, and artwork areas feel intentionally lit.

## Reason

The user provided the requested wide, frame-close, and corridor/depth screenshots after applying Phase 8M. Review showed:

- the ceiling remained too black relative to the target mockup;
- the fixtures were visible but did not convincingly illuminate nearby architecture;
- the large wall and floor were readable but too evenly filled and flat;
- the frame geometry was improved but still needed light to catch the stained-wood rail surfaces;
- the corridor/depth view needed warmer falloff rather than uniform ambient darkness.

## Runtime changes

Changed files:

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
```

Runtime behavior:

- adds Three.js `RectAreaLight` fixture and artwork wall-wash lights using the existing `three` dependency, not a new package dependency;
- keeps all lighting non-shadowing and low-cost relative to runtime shadow maps;
- raises ceiling material emissive warmth so the ceiling reads dark brown/charcoal instead of black;
- warms and slightly lowers the base wall/floor palette so fixture and artwork lighting can define the room rather than global fill alone;
- strengthens ceiling-panel point/spot lighting so fixtures create warmer pools;
- adds soft artwork wall-wash lights, capped to the first eight curated artworks, to give frames/walls more focused presence;
- keeps ceiling relief thinner and visually quieter;
- preserves the Phase 8 frame geometry/material approach, relying more on lighting to create catchlights instead of making the frame material broadly glossy.

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
package dependencies
```

This pack does not add:

```text
dynamic shadow maps
castShadow / receiveShadow
procedural surface texture maps
transparent shadow geometry
post-processing
fog
new image assets
new package dependencies
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

## Manual review

After applying, hard refresh and provide the same three screenshots:

1. wide main-artwork exposure check;
2. frame/material close-up;
3. corridor/depth lighting check.

The primary visual questions are whether the ceiling is now visible but still atmospheric, whether fixtures finally seem to illuminate architecture, and whether the frame catchlights read more naturally without making the room too bright or showroom-like.
