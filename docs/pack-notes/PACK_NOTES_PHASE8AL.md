# Pack Notes — Phase 8AL Reference-Led Surface and Light Calibration

## Apply behavior

Copy or extract this pack directly into the project root. It is root-relative and intentionally overwrites the current Phase 8AK runtime/docs files.

## What changed

- Updates `src/gallery/environment/galleryMaterials.ts` with warmer floor/wall values, darker smoother ceiling values, restrained bump/roughness response, and subtle floor-slab texture lines.
- Updates `src/gallery/environment/galleryLighting.ts` with small fill and warm-pool calibration while preserving the existing light architecture.
- Updates `src/gallery/GalleryScene.ts` only to reduce the visual mass of the existing ceiling light-panel geometry.
- Updates handoff/roadmap/changelog docs to record Phase 8AL as the current visual-calibration baseline pending local review.
- Adds `docs/PHASE8AL_REFERENCE_LED_SURFACE_AND_LIGHT_CALIBRATION.md`.

## What did not change

- No new architectural geometry was added.
- No rejected Phase 8AJ ceiling fields, end caps, base/floor strips, or fixture wells were restored.
- No room footprint, wall placement, movement/collision, plaque fallback, editor, curation data, controls, image assets, routing, SEO, public copy, package, fog, post-processing, or external texture changes.

## Validation

`npm run build` passed.

A browser screenshot/runtime check was attempted using a temporary Vite test page and sandbox Chromium, but Chromium could not initialize a usable headless WebGL/GPU path in this sandbox. The temporary test page was removed and is not included in the pack.
