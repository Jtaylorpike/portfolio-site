# Phase 8O — Gallery Polish and Future Lighting Backlog

Date: 2026-05-19

## Status

Implemented as a conservative runtime polish pass after the user confirmed Phase 8N looked great.

## Context

The user reviewed Phase 8N with the requested wide, close-up, and corridor screenshots and confirmed that the direction was working. The same review also identified future needs that should remain documented but not implemented in this pass:

- optimize the heavier dramatic lighting mode later, after the visual target is more polished;
- add a local editor toggle later so the editor can use a basic/fast gallery lighting mode during curation work;
- consider adding visible geometric gallery spotlight/wall-wash fixture objects later because the current wall-wash lighting has visible illumination without a clear physical source.

## Runtime scope

This pass keeps the Phase 8N lighting architecture and makes smaller polish adjustments only:

- reduces the golden/yellow cast of the wall and shell materials slightly;
- keeps the ceiling atmospheric but makes the dark surface a little more readable;
- softens the visible ceiling panel glow so the fixtures feel less like flat bright screens;
- nudges warm light colors and intensities toward a calmer museum/private-archive balance;
- refines frame colors away from copper/orange and back toward dark stained walnut;
- keeps the existing no-shadow, no-texture-map, no-post-processing runtime model.

## Deferred work explicitly recorded

### Basic/fast lighting toggle for local editor

Add a future editor-only control to switch the gallery preview/editor environment between:

```text
Dramatic / public lighting
Basic / fast editor lighting
```

This should be implemented after the dramatic lighting target is more visually stable. It should preserve the public gallery default and avoid changing curation data, collision behavior, wall placement, or plaque fallback logic.

### Visible spotlight/wall-wash fixture geometry

Add future visible geometric light-source objects for the wall-wash/artwork accent lights. The current Phase 8N/8O wall-wash lights improve the look, but some illumination appears to come from invisible sources. A later pass should add restrained museum-style spotlight or wall-washer geometry that explains the light source without making the room decorative, gimmicky, or performance-heavy.

### Optimization and performance pass

Do not optimize prematurely while the visual target is still moving. Once the lighting direction is accepted, review fixture counts, RectAreaLight usage, material count, frame geometry count, and editor preview performance. The basic/fast editor toggle belongs with that later optimization/authoring-experience work.

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
