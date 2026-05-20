# Phase 8AI — Staged Texture Open and Ceiling Lift

Date: 2026-05-19

## Summary

Phase 8AI responds to local review after Phase 8AH. The user reported that the gallery was still opening slower than the previous update and that the ceiling should be lighter overall, while asking to continue toward the dramatic museum/private-archive reference direction.

The uploaded Chrome trace showed a long gallery-open frame around the first animation frame, with image decode/GPU work visible during the opening path. This pack therefore avoids adding more light objects or post-processing and instead reduces first-open texture pressure while making a controlled ceiling-readability adjustment.

## Runtime changes

### `src/gallery/artwork/galleryTextureLoader.ts`

- changes the preload behavior so only the first priority preview textures are awaited before scene construction;
- streams deferred preview textures and full artwork textures in small idle batches after the room begins opening;
- disables mipmap generation for preview/thumb textures to reduce early GPU upload cost;
- keeps full artwork texture loading available for quality upgrades after entry.

### `src/gallery/GalleryScene.ts`

- tracks active artwork texture URLs so deferred preview textures can populate placeholder artwork surfaces;
- prevents a delayed preview texture from replacing a full-resolution texture that has already loaded;
- keeps gallery layout, controls, collision, wall placement, plaque fallback, and artwork metadata unchanged.

### `src/gallery/environment/galleryLighting.ts`

- keeps the Phase 8AG ceiling rake point lights removed;
- reduces selective shadow work further by leaving only one ceiling spotlight as a low-cost dynamic shadow source;
- lowers that shadow map size to `384`;
- slightly lifts existing overhead and ceiling-atmosphere contributions so the ceiling reads lighter without adding new lights.

### `src/gallery/environment/galleryMaterials.ts`

- keeps the current floor and wall direction intact;
- reduces procedural texture mark counts so first-open generation remains lighter;
- shifts the ceiling finish toward a lighter warm-charcoal/taupe balance;
- slightly reduces ceiling bump response while increasing material self-readability through the ceiling material response.

## Out of scope

This pack does not change:

- room footprint, wall placement, collision, plaque fallback, or gallery curation;
- editor behavior or a fast/basic lighting toggle;
- mobile controls;
- public copy, routing, SEO, logo, favicon, or social previews;
- image assets, dependencies, external texture files, fog, or post-processing.

## Validation

Validated with:

```text
npm run build
unzip -t
```

## Follow-up guidance

If first-open loading still feels frozen after this pack, the next technical pass should add a true gallery lighting/performance mode or staged scene construction. Further attempts to fix the freeze by making small material changes are unlikely to address the main bottleneck.
