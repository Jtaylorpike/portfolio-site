# Phase 8R — Warmth and Texture Seam Cleanup

## Summary

Phase 8R continues from the accepted Phase 8N/8O/8P direction and the Phase 8Q cooling/surface-texture refinement. The goal of this pass is to clean up the visible floor/wall texture seam grid, restore a bit of warmth after the Phase 8Q cool shift, keep the frames from collapsing into flat black, and remove the floating bottom frame strip seen in the latest screenshots.

## Scope

- smooth the visible procedural texture seam/repeat grid;
- add a bit of warmth back into the lighting and palette without restoring the old gold/yellow cast;
- lighten the frame/rail palette so dark wood still reads under low light;
- remove the floating bottom frame strip;
- keep room geometry, collision, plaque fallback, controls, editor logic, assets, dependencies, routing, public copy, dynamic shadow maps, transparent shadow planes, post-processing, and fog out of scope.

## Files

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8R_WARMTH_AND_TEXTURE_SEAM_CLEANUP.md
docs/pack-notes/PACK_NOTES_PHASE8R.md
docs/pack-manifests/PACK_MANIFEST_PHASE8R.txt
PROJECT_CHANGELOG.md
```
