# Phase 8I — Frame Sheen Tuning

Date: 2026-05-19

## Purpose

Phase 8I responds to user visual review of Phase 8H. The Phase 8H frame geometry direction was useful, but the frame material read too dark and did not show enough gloss after a hard browser refresh.

This pass tunes the existing frame system rather than adding a larger environmental effect.

## Changes

- Lightened the dark wood/walnut frame palette modestly.
- Increased `MeshPhysicalMaterial` clearcoat response for the main frame and frame rails.
- Reduced frame and rail roughness so the material can catch light more clearly.
- Added a narrow inner-sheen rail layer as simple opaque geometry on the front of each frame.
- Preserved the Phase 8H ceiling relief strip treatment.
- Preserved the no-procedural-surface-texture-map and no-shadow-geometry baseline from the Phase 8F/8G recovery path.

## Files changed

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8I_FRAME_SHEEN_TUNING.md
docs/pack-notes/PACK_NOTES_PHASE8I.md
docs/pack-manifests/PACK_MANIFEST_PHASE8I.txt
PROJECT_CHANGELOG.md
```

## Explicit non-goals

Phase 8I does not change:

- room footprint;
- wall placement;
- wall IDs;
- collision behavior;
- movement controls;
- mobile controls;
- plaque placement or fallback logic;
- gallery curation/editor logic;
- image assets;
- routing;
- SEO files;
- public copy;
- favicon/logo/social-preview work;
- dependencies.

## Visual review target

After applying Phase 8I, hard refresh and confirm:

- the previous greenish-grey motion tracer remains gone;
- the previous top-wall/cap band remains gone;
- frames read slightly lighter than Phase 8H;
- frame rails show a controlled wood/lacquer-like sheen;
- frames do not become orange, plastic, metallic, or visually heavier than the artwork.
