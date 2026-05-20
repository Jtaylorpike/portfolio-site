# Phase 8AH — Loading Cost Rollback and Ceiling Lift

Date: 2026-05-19

## Summary

Phase 8AH responds to local review after Phase 8AG. The user reported that the gallery was loading even slower than the previous update and that the overall ceiling should be lighter.

This pass is intentionally conservative. It keeps the current gallery room, wall/floor direction, frames, curation logic, controls, routing, and public-site behavior intact while reducing the cost added by the last ceiling pass and lifting the ceiling through existing lighting/material channels.

## Runtime changes

### `src/gallery/environment/galleryLighting.ts`

- removes the two Phase 8AG ceiling rake point lights;
- reduces the number of shadow-casting ceiling spotlights from four to two;
- reduces selective spotlight shadow map size from `1024` to `512`;
- slightly increases broad overhead wash and localized panel pools;
- keeps the selective-shadow architecture in place, but at lower cost.

### `src/gallery/environment/galleryMaterials.ts`

- keeps the wall and floor direction generally intact;
- reduces environment texture generation cost by moving color maps to smaller canvases;
- reduces procedural mark counts used by the wall/ceiling texture generation;
- lightens the ceiling base texture and ceiling material emissive response;
- lowers ceiling bump intensity so the finish does not become noisy while the ceiling gets lighter.

## Out of scope

This pack does not change:

- room footprint, wall placement, collision, plaque fallback, or gallery curation;
- editor behavior;
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

If first-open loading still feels frozen after this pack, the next technical pass should target staged gallery scene initialization or a basic/fast gallery lighting mode rather than adding more material or lighting work.
