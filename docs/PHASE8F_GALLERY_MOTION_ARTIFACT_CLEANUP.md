# Phase 8F — Gallery Motion Artifact Cleanup

Date: 2026-05-18

## Purpose

Phase 8F responds to the user's Phase 8E visual feedback: the darker top-wall/cap band was resolved, but a greenish-grey tracer appeared to be left behind by wall geometry while moving the camera.

The goal of this pack is not to push the room farther visually. The goal is to stabilize the gallery again before another texture or grounding attempt.

## Runtime changes

- Removed the remaining procedural floor texture map from `galleryMaterials.ts`.
- Removed the remaining procedural paper/mat texture map from `galleryMaterials.ts`.
- Restored stable flat matte room material values from the accepted pre-Phase-8B baseline.
- Restored the pre-Phase-8B lighting balance in `galleryLighting.ts`.
- Restored safer ceiling light panel material behavior instead of the Phase 8B/8C/8E `depthWrite: false` transparent panel treatment.
- Explicitly set renderer frame-clear flags in `GalleryScene.ts` to protect against visual residue between camera frames.

## Preserved boundaries

This pack does not change:

- room footprint;
- wall placement;
- collision behavior;
- plaque fallback logic;
- gallery curation data flow;
- local editor behavior;
- mobile gallery controls;
- image assets;
- public routing;
- public copy;
- favicon/logo/social preview deferrals;
- dependencies.

## Follow-up direction

If this resolves the motion artifact but the room feels too flat, the next pass should be proposed before implementation. Avoid broad procedural wall textures, high-frequency floor/paper texture maps, and transparent per-artwork shadow geometry. A safer direction would be low-frequency geometry-level grounding cues, restrained fixture adjustments, or subtle material value changes that can be judged from screenshots before deeper implementation.
