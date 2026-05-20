# Phase 8AK — Remove Rejected Phase 8AJ Geometry

Status: current corrective runtime baseline.

## Reason

Phase 8AJ was rejected after local visual review. The added ceiling architectural fields, layered recessed fixture wells, perimeter floor/base reveal strips, and freestanding-wall end caps created intrusive black geometry and moved the gallery away from the provided dramatic gallery reference.

## Runtime changes

- Restores `src/gallery/GalleryScene.ts` from the Phase 8AI uploaded source baseline.
- Restores `src/gallery/environment/galleryMaterials.ts` from the Phase 8AI uploaded source baseline.
- Removes the rejected Phase 8AJ runtime geometry from the gallery.
- Preserves the Phase 8AI lighting/material direction that the user liked before Phase 8AJ.

## Out of scope

- No gallery lighting architecture changes.
- No room footprint changes.
- No wall placement, collision, or plaque fallback changes.
- No editor or curation data changes.
- No mobile control changes.
- No image asset, routing, SEO, public copy, dependency, fog, or post-processing changes.

## Next visual direction

The next gallery pass should be smaller and more directly tied to the provided reference image. Avoid adding broad architectural geometry until the specific treatment is approved against the reference. The reference direction should prioritize warm localized artwork illumination, a smooth dark ceiling atmosphere, restrained recessed lighting, clean wall planes, and subtle material depth rather than visible decorative end caps, ceiling fields, or heavy black fixture geometry.
