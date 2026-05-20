# Phase 8AG — Ceiling Finish Separation and Localized Rake Light

Date: 2026-05-19

## Summary

Phase 8AG follows local review of Phase 8AF. The room balance, floor direction, and wall finish are stable enough to preserve, but the ceiling still reads too close to a black flat plane in the wide and close screenshots. This pass focuses only on ceiling finish separation.

## Runtime changes

### `src/gallery/environment/galleryMaterials.ts`

- preserves the Phase 8AF wall and floor material direction;
- increases ceiling knockdown texture contrast enough to register near fixtures;
- increases ceiling bump response modestly;
- slightly lifts the ceiling base/emissive response without returning to the earlier broad brown ceiling slab.

### `src/gallery/environment/galleryLighting.ts`

- preserves the existing selective-shadow dramatic-lighting architecture;
- adds two very low-intensity localized ceiling rake/lift point lights;
- slightly strengthens the localized ceiling-panel pool contribution;
- avoids a broad exposure or ambient-light increase.

## Out of scope

This pass does not change room footprint, wall placement, collision, plaque fallback, gallery/editor curation, mobile controls, routing, public copy, image assets, dependencies, external texture assets, post-processing, or fog.

## Validation

Validated with:

```text
npm run build
unzip -t
```
