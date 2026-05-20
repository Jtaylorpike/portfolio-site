# Pack Notes — Phase 8O Gallery Polish and Future Lighting Backlog

## Pack format

This is a root-relative replacement pack. Copy/extract the zip contents directly into the project root and overwrite matching files.

The zip root contains changed project paths directly. It does not use `source/`, `01-source/`, `updated-files/`, or any other wrapper folder, and it does not include a phase README at the zip root.

## Purpose

Phase 8O preserves the successful Phase 8N dramatic-lighting baseline and makes a smaller polish pass based on the user's latest screenshots and feedback.

The user confirmed Phase 8N looked great, but wanted the gallery to continue moving toward a more polished dramatic museum/private-archive look. This pack reduces some golden/copper heaviness, keeps the ceiling atmospheric but slightly more readable, and records future work for editor basic/fast lighting and visible gallery spotlight/wall-wash geometry.

## Runtime changes

- Slightly calms wall, shell, floor, and trim material warmth.
- Keeps the ceiling dark but marginally more readable.
- Softens the visible ceiling light panel surface.
- Slightly reduces and neutralizes the warm wall/artwork wash colors.
- Pulls frame rail/catchlight materials away from copper/orange toward dark stained walnut.

## Deferred items documented but not implemented

- Local editor basic/fast lighting toggle for gallery curation performance.
- Visible geometric spotlight/wall-washer objects for more believable light sources.
- Later optimization once the visual target is stable.

## Preserved constraints

No room layout, wall placement, collision, plaque fallback, movement, mobile controls, editor data flow, gallery curation logic, routing, SEO, public copy, image assets, dependencies, shadow maps, procedural surface texture maps, transparent shadow geometry, post-processing, or fog changes.

## Validation

```text
npm run build
static no-shadow-map checks
static no-CanvasTexture check in galleryMaterials.ts
root-relative pack structure check
unzip -t
```
