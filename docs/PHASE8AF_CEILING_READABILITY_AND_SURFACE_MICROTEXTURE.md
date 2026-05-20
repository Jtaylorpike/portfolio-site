# Phase 8AF — Ceiling readability and surface microtexture

Date: 2026-05-19

## Summary

Phase 8AF continues from Phase 8AE after local screenshots showed that the gallery was stable and the lighting direction was close, but the ceiling had dropped too far toward black again and the wall finish still read flatter than intended from normal viewing distance.

This is a controlled material and ceiling-lighting refinement, not a broad visual redesign.

## Runtime changes

### `src/gallery/environment/galleryMaterials.ts`

- keeps the restrained Phase 8AE floor direction intact;
- slightly increases wall sand/plaster microtexture visibility while avoiding the heavier mottled Phase 8Z look;
- adjusts wall texture repeat and bump response so the finish reads as surface grain rather than large blotchy marks;
- lightens the ceiling texture base and increases knockdown material response so the ceiling remains visible around fixture pools;
- increases ceiling bump/emissive response carefully so the ceiling does not collapse into black but also does not return to the broad brown slab problem.

### `src/gallery/environment/galleryLighting.ts`

- keeps the current selective-shadow lighting architecture;
- adds a small overhead wash increase;
- strengthens the ceiling-atmosphere lift and fixture pool intensity slightly so ceiling texture can register without a full exposure swing.

## Out of scope

This pass does not change:

- room footprint or room shape;
- wall placement, collision, plaque fallback, or artwork layout;
- editor logic or gallery-curation data flow;
- mobile gallery controls;
- public copy, routing, SEO, or image assets;
- external texture assets, new dependencies, fog, or post-processing.

## Validation

Validated locally with:

- `npm run build`
- `unzip -t` on the final root-format pack
