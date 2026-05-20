# Phase 8C — Gallery Load Recovery Hotfix

Date: 2026-05-18

## Reason

After the Phase 8B materials/lighting pack, the user reported that the virtual gallery no longer loaded. The most runtime-risky Phase 8B change was the new `GalleryScene.ts` per-artwork contact-shadow mesh wiring, because it altered gallery scene construction and high-resolution texture update bookkeeping.

## Recovery approach

Phase 8C backs out the experimental contact-shadow scene wiring and keeps the safer deterministic material/lighting foundation.

This pack:

- restores `src/gallery/GalleryScene.ts` to the pre-Phase-8B scene-construction flow;
- removes the unused contact-shadow material helper from `src/gallery/environment/galleryMaterials.ts`;
- preserves deterministic procedural floor, wall, shell-wall, ceiling, and paper/mat textures;
- preserves the warmer lower-cost Phase 8B lighting balance;
- keeps root-relative replacement pack formatting.

## Explicit non-changes

This pack does not change:

- room footprint;
- wall placement;
- collision behavior;
- plaque placement or plaque fallback behavior;
- gallery curation data;
- editor behavior;
- mobile gallery controls;
- image assets;
- public copy;
- hash routing;
- favicon/logo/social preview assets;
- dependencies.

## Follow-up

After applying this pack, verify that the virtual gallery opens again locally. If additional grounding is still needed, the next pass should avoid separate per-artwork shadow meshes until the gallery open path is confirmed stable. Prefer material-only or fixture-level depth cues first.
