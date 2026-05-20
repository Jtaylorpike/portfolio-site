# Pack Notes — Phase 8I Frame Sheen Tuning

## Copy behavior

This is a root-relative replacement pack. Extract or copy the zip contents directly into the project root and overwrite matching paths.

Expected zip root entries:

```text
src/
docs/
PROJECT_CHANGELOG.md
```

There is no wrapper folder, no `source/` folder, no `updated-files/` folder, and no root-level phase README.

## Summary

Phase 8I tunes the Phase 8H frame refinement after user feedback that the frame material was too dark and did not feel glossy enough after a hard refresh.

The pack lightens the frame palette modestly, increases clearcoat response, reduces roughness, and adds a narrow inner-sheen frame rail layer as simple opaque geometry.

## Changed files

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

## Preserved constraints

- No procedural wall/floor/ceiling/paper texture maps.
- No dynamic shadow maps.
- No `castShadow`, `receiveShadow`, or `shadowMap` use.
- No transparent per-artwork shadow geometry.
- No room footprint or wall placement changes.
- No collision changes.
- No plaque fallback changes.
- No gallery curation/editor logic changes.
- No mobile-control changes.
- No image asset changes.
- No routing, SEO, public-copy, favicon/logo/social-preview, dependency, or data-schema changes.

## Manual visual check

After applying, hard refresh the gallery and check that the frames are slightly lighter and more lacquered/wood-like than Phase 8H, without looking plastic, metallic, orange, or heavier than the photos. Also confirm the earlier top-wall band and greenish-grey motion tracer remain gone.
