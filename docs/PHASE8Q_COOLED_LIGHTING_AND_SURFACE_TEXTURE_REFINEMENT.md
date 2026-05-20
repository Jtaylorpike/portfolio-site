# Phase 8Q — Cooled Lighting and Surface Texture Refinement

## Summary

Phase 8Q continues the accepted Phase 8N/8O/8P dramatic-lighting direction after the latest screenshot review. The goal of this pass is to move the room closer to the approved private-archive/museum target by cooling and neutralizing the overall room, reintroducing subtle low-frequency wall/floor surface character, and making the floor mostly matte with only a hint of reflection.

## Scope

- cool the room toward a more neutral museum balance rather than amber/gold;
- add subtle deterministic low-frequency wall and floor surface texture without external assets;
- keep the floor matte overall, with a restrained reflective response;
- preserve the accepted Phase 8 lighting architecture and avoid broad experimental changes;
- keep dynamic shadow maps, transparent shadow planes, post-processing, fog, new assets, new dependencies, room changes, collision changes, plaque fallback changes, and editor changes out of scope.

## Files

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8Q_COOLED_LIGHTING_AND_SURFACE_TEXTURE_REFINEMENT.md
docs/pack-notes/PACK_NOTES_PHASE8Q.md
docs/pack-manifests/PACK_MANIFEST_PHASE8Q.txt
PROJECT_CHANGELOG.md
```

## Validation

```text
npm run build
root-relative pack structure check
unzip -t
```
