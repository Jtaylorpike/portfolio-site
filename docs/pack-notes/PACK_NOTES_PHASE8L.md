# Pack Notes — Phase 8L Dramatic Lighting Rollback to Phase 8J

## Purpose

Revert the over-dark Phase 8K runtime lighting/material changes and restore the Phase 8J runtime baseline.

Use this pack if Phase 8K was applied locally.

## Pack format

This is a root-relative replacement pack. Copy or extract the zip contents directly into the project root and overwrite matching files.

The zip root intentionally contains project paths directly, such as:

```text
src/
docs/
PROJECT_CHANGELOG.md
```

Do not copy the files into a nested `source/`, `01-source/`, or `updated-files/` folder.

No phase README belongs at the zip root. Phase notes and manifests stay under `docs/`.

## Runtime changes

Restores these files from Phase 8J:

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
```

## Documentation changes

Updates the current handoff, Phase 8 active handoff, roadmap, transfer workflow, changelog, and Phase 8L notes to mark:

- Phase 8K as rejected/superseded before acceptance;
- Phase 8J as the current runtime baseline after the rollback;
- Phase 8L as the corrective rollback pack.

## Not changed

This pack does not change room footprint, wall placement, collision, plaque fallback, editor logic, gallery curation, mobile controls, image assets, routing, SEO files, public copy, logo/favicon/social-preview work, or dependencies.

## Validation

Validated with:

```text
npm run build
static no-shadow-map checks
static no-CanvasTexture check in galleryMaterials.ts
root-relative pack structure check
unzip -t
```
