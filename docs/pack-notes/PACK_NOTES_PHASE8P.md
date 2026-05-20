# Pack Notes — Phase 8P Refined Gallery Lighting Polish

## Pack format

This is a root-relative replacement pack. Copy/extract the zip contents directly into the project root and overwrite matching files.

The zip root contains changed project paths directly. It does not use `source/`, `01-source/`, `updated-files/`, or any other wrapper folder, and it does not include a phase README at the zip root.

## Purpose

Phase 8P continues the accepted Phase 8N/8O dramatic-lighting direction and responds to the user's latest screenshots. The goal is to make the current gallery feel closer to the approved dramatic museum/private-archive mockup without reintroducing the earlier artifacts or over-darkening mistake.

## Runtime changes

- Slightly neutralizes the wall, shell, floor, trim, mat, and plaque material palette.
- Raises ceiling and ceiling-detail readability toward warm charcoal/brown.
- Softens the visible ceiling panel material and makes the visible panel face slightly smaller inside the frame.
- Adjusts fixture/wall-wash colors toward warmer museum tungsten instead of saturated yellow.
- Slightly lowers artwork wall-wash intensity to reduce the rectangular gold field around featured works.
- Pulls frame rail/catchlight colors away from copper/orange and back toward dark stained walnut.

## Preserved constraints

No room layout, wall placement, collision, plaque fallback, movement, mobile controls, editor data flow, gallery curation logic, routing, SEO, public copy, image assets, dependencies, dynamic shadow maps, procedural surface texture maps, transparent shadow geometry, post-processing, or fog changes.

## Validation

```text
npm run build
static no-shadow-map checks
static no-CanvasTexture check in galleryMaterials.ts
root-relative pack structure check
unzip -t
```
