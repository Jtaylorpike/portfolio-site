# Pack Notes — Phase 8AK Remove Rejected Phase 8AJ Geometry

This is a corrective rollback pack.

## Apply behavior

Copy or extract this pack directly into the project root. It is root-relative and intentionally overwrites the current Phase 8AJ runtime files.

## What changed

- Restores `src/gallery/GalleryScene.ts` from the Phase 8AI uploaded source baseline.
- Restores `src/gallery/environment/galleryMaterials.ts` from the Phase 8AI uploaded source baseline.
- Updates handoff/roadmap docs to mark Phase 8AJ as rejected and Phase 8AK as the current corrective baseline.
- Adds `docs/PHASE8AK_REMOVE_REJECTED_AJ_GEOMETRY.md`.

## What did not change

- No gallery lighting file changes.
- No room footprint, wall placement, collision, plaque fallback, editor, curation, controls, image assets, routing, SEO, public copy, package, fog, or post-processing changes.

## Validation

`npm run build` passed from the restored source.
