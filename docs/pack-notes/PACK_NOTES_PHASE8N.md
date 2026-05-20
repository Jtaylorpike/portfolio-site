# Pack Notes — Phase 8N Light Volume and Ceiling Readability

## Purpose

Correct the Phase 8M screenshot result without repeating the Phase 8K mistake.

Phase 8M made the room readable again, but user screenshots showed the ceiling was still too close to black and the visible fixtures were not creating convincing warm light volume. Phase 8N adds controlled, non-shadowing light volume and improves ceiling readability while preserving the streamlined runtime constraints.

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

- adds browser-native Three.js `RectAreaLight` fixture and artwork wall-wash lights through the existing `three` dependency;
- keeps the new lights non-shadowing and avoids runtime shadow maps;
- raises ceiling material emissive warmth so the ceiling reads dark and atmospheric rather than pure black;
- warms and lowers the base wall/floor palette so light pools are more legible;
- strengthens ceiling-panel point/spot lighting for warmer fixture-driven illumination;
- adds capped artwork wall-wash lights to improve frame/wall presence around curated artworks;
- makes ceiling relief slightly thinner so it reads as subtle ceiling detail instead of a hard grid.

## Documentation changes

Updates the current handoff, Phase 8 active handoff, roadmap, transfer workflow, changelog, Phase 8N notes, pack notes, and manifest to mark Phase 8N as the current screenshot-guided light-volume refinement.

## Not changed

This pack does not change room footprint, wall placement, collision, plaque fallback, editor logic, gallery curation, mobile controls, image assets, routing, SEO files, public copy, logo/favicon/social-preview work, or package dependencies.

This pack does not add dynamic shadow maps, procedural surface texture maps, transparent shadow geometry, post-processing, fog, new image assets, or new package dependencies.

## Validation

Validated with:

```text
npm run build
static no-shadow-map checks
static no-CanvasTexture check in galleryMaterials.ts
root-relative pack structure check
unzip -t
```
