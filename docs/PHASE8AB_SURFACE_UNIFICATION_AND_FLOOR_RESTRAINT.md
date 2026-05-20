# Phase 8AB — Surface Unification and Floor Restraint

## Summary

Phase 8AB is the current runtime baseline pending local visual review. It continues after Phase 8AA made the gallery stable and restrained the heavy procedural look, but screenshots still showed the floor reading too directional/patterned and the ceiling/walls needing more unified museum polish. Phase 8AB keeps the lightweight Canvas texture path and restored `prewarmGalleryEnvironmentMaterials` export, reduces floor vein directionality, shifts the floor toward quieter matte stone, tones the ceiling toward darker readable warm-charcoal, and keeps wall plaster texture present without blotchy marks or grid patterns.

## Changes

- reduced the remaining floor marble directionality and contrast;
- shifted the floor toward quieter matte stone rather than patterned/rippled marble;
- restrained wall plaster speckling and cloud marks while keeping the wall from becoming flat again;
- toned the ceiling toward darker warm-charcoal while keeping it readable under the current lighting;
- preserved the lightweight Canvas texture path and `prewarmGalleryEnvironmentMaterials` export.

## Out of scope

- room footprint;
- wall placement;
- collision and plaque fallback;
- gallery curation/editor logic;
- mobile controls;
- routing, SEO, public copy, logo/favicon/social previews;
- package dependencies;
- external texture assets;
- new post-processing or fog.

## Validation

```text
npm run build
unzip -t
```
