# Pack Notes — Phase 8J Dramatic Lighting and Frame Highlights

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

Phase 8J continues the Phase 8 gallery environment work from the Phase 8I frame-sheen baseline. It moves the virtual gallery toward the approved dramatic museum/private-archive visual target by tuning lighting, ceiling tone, ceiling detail, and frame highlight geometry while avoiding the earlier artifact-prone approaches.

## Runtime changes

- `src/gallery/environment/galleryLighting.ts`
  - Reduces broad ambient/fill intensity.
  - Adds focused, non-shadow-casting spotlights from the existing ceiling-panel positions.
  - Retunes point lights and low room fill for warmer dramatic lighting.

- `src/gallery/environment/galleryMaterials.ts`
  - Darkens ceiling and ceiling detail material values.
  - Warms wall, trim, mat, plaque, fixture, and frame material values.
  - Adds frame catchlight and depth-edge materials.
  - Keeps procedural surface texture maps removed.

- `src/gallery/GalleryScene.ts`
  - Sets darker warm scene/clear color and slightly lower tone-mapping exposure.
  - Makes ceiling relief strips thinner.
  - Adds opaque frame catchlight/depth-edge rail geometry.
  - Preserves high-resolution texture replacement behavior for all frame rail layers.

## Validation

- `npm run build`
- Static check that `src/gallery/environment/galleryMaterials.ts` does not create procedural `CanvasTexture` surface maps
- Static check that no `shadowMap`, `castShadow`, or `receiveShadow` usage was added in `src/`
- Root-relative pack structure check
- `unzip -t`

## Notes

- Browser screenshot iteration could not be completed inside this sandbox because Chromium navigation to local and file URLs is blocked by environment policy.
- The pack deliberately uses no dynamic shadows, no post-processing, no new dependencies, no new image assets, and no transparent per-artwork shadow geometry.
- Manual visual review should focus on whether the lighting now feels closer to the approved dramatic gallery mockup while avoiding the previous motion tracer and top-wall/cap band artifacts.
