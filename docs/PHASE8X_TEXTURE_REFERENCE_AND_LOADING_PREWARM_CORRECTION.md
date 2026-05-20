# Phase 8X — Texture Reference and Loading Prewarm Correction

## Summary

Phase 8X responds to the Phase 8V + Phase 8W visual review. The loader is improved but still appears to pause, and the wall/floor/ceiling textures remain too subtle in normal gallery views. This pass strengthens the generated material maps, removes ceiling shadow receiving so shadows do not read as a grid, and adds material-module prewarming so generated surface textures are prepared earlier.

## Scope

- make wall sand/plaster texture more visible;
- rework the floor toward clearer faint matte-marble / polished-stone movement;
- brighten and texture the ceiling toward warm charcoal knockdown/Venetian plaster;
- disable ceiling shadow receiving to remove grid-like ceiling lines;
- prewarm generated material textures before/during gallery loading;
- preserve room layout, collision, plaque fallback, editor logic, controls, assets, routing, public copy, dependencies, transparent shadow planes, post-processing, and fog.

## Files

```text
src/app/galleryController.ts
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8X_TEXTURE_REFERENCE_AND_LOADING_PREWARM_CORRECTION.md
docs/pack-notes/PACK_NOTES_PHASE8X.md
docs/pack-manifests/PACK_MANIFEST_PHASE8X.txt
PROJECT_CHANGELOG.md
```

## Validation

```text
npm run build
unzip -t
```
