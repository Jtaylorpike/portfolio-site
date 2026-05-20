# Phase 8Y — Organic wall texture and ceiling recovery

Date: 2026-05-19

## Summary

Phase 8Y responds to the latest local screenshots after the Phase 8X texture/loading iteration.

User feedback for this pass:

- the floor direction is better and should largely be preserved;
- the ceiling looked worse and had become too dark again;
- the wall texture finally showed up, but the pattern looked too organized and grid-like rather than organic.

This pass therefore focuses on the procedural material authoring only, while keeping the rest of the accepted dramatic-lighting/gallery behavior intact.

## Runtime changes

### `src/gallery/environment/galleryMaterials.ts`

- adds deterministic value-noise/fBM helper functions;
- replaces the older wave-heavy wall texture field with a more organic warped sand/plaster field;
- increases wall bump/material presence while reducing the organized grid feel;
- keeps the improved floor material direction intact;
- reauthors the ceiling knockdown field so it reads lighter and more visibly textured instead of collapsing toward black;
- raises ceiling emissive response modestly so the ceiling finish can stay visible under the dramatic-lighting setup.

### `src/gallery/environment/galleryLighting.ts`

- carried forward to preserve the gallery-lighting import recovery state so the project builds cleanly from this source set.

## Out of scope

This pass does not change:

- room footprint or room shape;
- wall placement, collision, plaque fallback, or artwork layout;
- editor logic or gallery-curation data flow;
- mobile gallery controls;
- public copy, routing, SEO, or image assets;
- external texture assets, new dependencies, or post-processing.

## Validation

Validated locally with:

- `npm run build`
- `unzip -t` on the final root-format pack

## Follow-up guidance

If the loader still feels frozen after this pass, the next fix should target chunk parsing / staged scene initialization rather than more loading-text polish.
