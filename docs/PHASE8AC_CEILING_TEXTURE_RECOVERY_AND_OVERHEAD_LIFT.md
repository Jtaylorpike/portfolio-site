# Phase 8AC — Ceiling Texture Recovery and Overhead Lift

## Summary

Phase 8AC continues from the Phase 8AB stabilized material baseline. The latest screenshots showed the room was much more coherent and the floor/wall surface restraint was working better, but the ceiling still read as a broad, heavy, mostly flat plane.

This pack keeps the wall and floor direction intact and focuses on controlled ceiling recovery.

## Runtime changes

```text
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
```

### Material changes

- increases organic ceiling knockdown/chipped-paint variation;
- lifts the ceiling base texture slightly so it does not collapse as much into a single dark mass;
- increases ceiling bump/roughness response modestly;
- preserves the restrained wall/floor material direction from Phase 8AB.

### Lighting changes

- adds a small overhead-wash increase;
- adds a small ceiling-atmosphere lift increase;
- avoids broad exposure swings or another full lighting rework.

## Out of scope

This pack does not change room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, dependencies, post-processing, fog, transparent shadow planes, logo/favicon/social-preview work, or external texture assets.

## Validation

```text
npm run build
unzip -t
```
