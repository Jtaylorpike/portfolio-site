# Phase 8AA — Surface restraint and ceiling balance

Date: 2026-05-19

## Summary

Phase 8AA follows the Phase 8Z runtime recovery. Phase 8Z successfully restored the gallery and made the material textures visible, but local review showed that the wall texture became too blotchy, the floor marble became too patterned, and the ceiling needed a more restrained balance.

This pass keeps the lightweight Canvas texture system and the restored material prewarm export, but tunes the generated material maps toward a subtler and more refined gallery finish.

## Runtime changes

### `src/gallery/environment/galleryMaterials.ts`

- keeps `prewarmGalleryEnvironmentMaterials`;
- replaces large wall spots with a softer organic sand/plaster grain;
- lowers wall bump and roughness contrast so the surface reads as gallery plaster rather than mottled stone;
- reins in floor marble contrast and veining so the floor stays faint and matte;
- keeps the ceiling readable while reducing the chance that the ceiling texture becomes the dominant surface;
- preserves lightweight Canvas texture generation and avoids external texture assets or new dependencies.

## Out of scope

This pass does not change room footprint, wall placement, collision, plaque fallback, editor logic, mobile controls, routing, image assets, public copy, new dependencies, or post-processing.

## Validation

- `npm run build`
- `unzip -t`
