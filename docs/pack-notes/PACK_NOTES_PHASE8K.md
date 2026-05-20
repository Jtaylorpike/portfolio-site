# Pack Notes — Phase 8K Dramatic Lighting Target Refinement

## Pack format

This is a root-relative replacement pack. Copy or extract the zip contents directly into the project root and overwrite matching files.

Expected zip-root structure:

```text
src/
docs/
PROJECT_CHANGELOG.md
```

The pack intentionally does not use `source/`, `01-source/`, `updated-files/`, or a root-level phase README.

## Summary

Phase 8K supersedes Phase 8J and moves the gallery closer to the approved dramatic museum/private-archive mockup while keeping the stable Phase 8F/8G safety boundaries: no procedural surface texture maps, no dynamic shadow maps, no transparent shadow geometry, no post-processing, no new assets, and no room/collision/editor changes.

A temporary no-local-URL Three.js visual harness was attempted by bundling inline browser code and using Playwright `page.set_content()`. Chromium executed the inline page but could not create a WebGL context in the sandbox, so exact rendered screenshot iteration was not available. The final values were tuned from the approved mockup, the user screenshot, luminance comparison, and source-level Three.js constraints.

## Runtime changes

- `src/gallery/environment/galleryLighting.ts`
  - Further lowers broad ambient/fill light.
  - Keeps focused non-shadowing ceiling-panel spotlights.
  - Adds focused non-shadow-casting accent spotlights from curated artwork positions, capped at eight artworks.
  - Warms and tightens falloff for a more dramatic museum-lighting balance.

- `src/gallery/environment/galleryMaterials.ts`
  - Darkens floor, ceiling, shell wall, trim, and ceiling-detail values toward the approved mockup.
  - Keeps wall color warm and restrained rather than grey/green.
  - Refines dark stained-wood/walnut frame material values.
  - Keeps procedural surface texture maps removed.

- `src/gallery/GalleryScene.ts`
  - Darkens scene background/clear color.
  - Lowers tone-mapping exposure.
  - Makes ceiling detail strips thinner.
  - Adds angled opaque lacquer-edge bevel geometry to the frame rails.

## Validation

- Attempted temporary no-local-URL Three.js screenshot harness with inline Playwright content.
- Confirmed sandbox Chromium could not create a WebGL context for Three.js rendering.
- `npm run build`
- Static check that `src/gallery/environment/galleryMaterials.ts` does not create procedural `CanvasTexture` surface maps
- Static check that no `shadowMap`, `castShadow`, or `receiveShadow` usage was added in `src/`
- Root-relative pack structure check
- `unzip -t`

## Notes

- This pack does not guarantee exact visual matching because direct WebGL screenshot iteration was unavailable in the sandbox.
- The pass is intentionally stronger than Phase 8J, so local visual review matters. If it overshoots, the next correction should tune lighting intensity and material brightness rather than reintroducing texture maps, transparent shadow planes, or dynamic shadows.
