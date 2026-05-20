# Phase 8P — Refined Gallery Lighting Polish

Date: 2026-05-19

## Status

Implemented as a screenshot-guided polish pass after Phase 8O.

## Context

The user reviewed Phase 8O with the normal wide, close-up, and corridor screenshots and confirmed the gallery is moving in the right direction. The remaining issues are subtle polish issues rather than structural failures:

- the room still carries more gold/yellow warmth than the approved mockup;
- the frame catchlights can read too copper/orange rather than dark stained walnut;
- the ceiling still needs more warm-charcoal readability without returning to the over-dark Phase 8K result;
- the visible ceiling panels should feel more recessed and architectural rather than flat bright screens.

## Runtime scope

This pass preserves the Phase 8N/8O dramatic-lighting architecture and only tunes material, fixture, and light-balance values:

- slightly neutralizes the wall, shell, floor, trim, mat, and plaque material palette;
- raises ceiling and ceiling-detail readability toward warm charcoal/brown;
- softens and slightly shrinks the visible ceiling panel surface inside a darker frame;
- adjusts fixture and wall-wash colors toward refined warm museum tungsten instead of saturated yellow;
- slightly lowers artwork wall-wash intensity so the light pool feels more controlled;
- reduces copper/orange frame rail and catchlight color while preserving dark stained-wood depth and sheen;
- keeps the existing no-shadow, no-texture-map, no-post-processing runtime model.

## Out of scope

This phase does not change:

- room footprint;
- wall placement;
- wall IDs;
- collision;
- movement controls;
- mobile controls;
- plaque fallback logic;
- gallery curation/editor logic;
- image assets;
- routing;
- SEO files;
- public copy;
- logo/favicon/social-preview work;
- dependencies;
- dynamic shadow maps;
- `castShadow` / `receiveShadow`;
- procedural surface texture maps;
- transparent shadow geometry;
- post-processing;
- fog.

## Validation

```text
npm run build
static no-shadow-map checks
static no-CanvasTexture check in galleryMaterials.ts
root-relative pack structure check
unzip -t
```

## Review instructions

Review against the same three screenshots:

```text
A. Wide main-artwork exposure check
B. Frame/material close-up
C. Corridor/depth lighting check
```

The expected improvement is not a large visual reset. Phase 8P should make the Phase 8O baseline feel less yellow/copper and more refined, with a slightly more readable ceiling and less screen-like ceiling light panels.
