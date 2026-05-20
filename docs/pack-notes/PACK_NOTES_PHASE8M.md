# Pack Notes — Phase 8M Screenshot-Guided Lighting Rebalance

## Purpose

Make a narrower lighting correction after Phase 8K over-darkened the room and Phase 8L restored the Phase 8J runtime baseline.

Phase 8M moves the gallery back toward the approved dramatic museum/private-archive target while keeping the room visibly lit and readable.

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

Changed files:

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
```

Changes made:

- warmed and brightened the base dramatic-lighting exposure from the Phase 8J/8L baseline;
- made the ceiling atmospheric but visibly readable instead of near-black;
- added restrained non-shadowing artwork accent spotlights, capped at eight artworks;
- retuned ceiling-panel point lights and spotlights for warmer visible pools;
- kept dark stained-wood frame material and catchlight values controlled;
- kept ceiling relief as simple opaque geometry without texture maps.

## Documentation changes

Updates the current handoff, Phase 8 active handoff, roadmap, transfer workflow, changelog, Phase 8M notes, pack notes, and manifest to mark Phase 8M as the current screenshot-guided lighting rebalance.

## Not changed

This pack does not change room footprint, wall placement, collision, plaque fallback, editor logic, gallery curation, mobile controls, image assets, routing, SEO files, public copy, logo/favicon/social-preview work, or dependencies.

This pack does not add dynamic shadow maps, procedural surface texture maps, transparent shadow geometry, post-processing, fog, new image assets, or new dependencies.

## Validation

Validated with:

```text
npm run build
static no-shadow-map checks
static no-CanvasTexture check in galleryMaterials.ts
root-relative pack structure check
unzip -t
```
