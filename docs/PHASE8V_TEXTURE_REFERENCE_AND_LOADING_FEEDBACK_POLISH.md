# Phase 8V — Texture Reference and Loading Feedback Polish

## Summary

Phase 8V continues from the Phase 8U selective-shadow baseline after the user provided texture references for the floor, ceiling, and gallery walls, and noted that the gallery loading bar can feel hung while larger gallery code initializes.

## Scope

- preserve the selective-shadow architecture from Phase 8U;
- remove explicit ceiling-grid strip geometry;
- make the wall sand/plaster texture more visible;
- rework the floor toward a stronger faint matte-marble / stone effect;
- lift and texture the ceiling as warm charcoal knockdown/venetian plaster;
- improve perceived loading smoothness with idle module prewarming and loading-phase text;
- It does not change room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, dependencies, post-processing, fog, transparent shadow planes, logo/favicon/social-preview work, or external texture assets.

## Files

```text
src/app/galleryController.ts
src/app/renderSite.ts
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8V_TEXTURE_REFERENCE_AND_LOADING_FEEDBACK_POLISH.md
docs/pack-notes/PACK_NOTES_PHASE8V.md
docs/pack-manifests/PACK_MANIFEST_PHASE8V.txt
PROJECT_CHANGELOG.md
```
