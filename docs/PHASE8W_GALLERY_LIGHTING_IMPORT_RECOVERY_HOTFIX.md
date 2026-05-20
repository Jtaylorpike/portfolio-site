# Phase 8W — Gallery Lighting Import Recovery Hotfix

## Summary

Phase 8W fixes the Vite import-resolution error reported after Phase 8V. The uploaded source showed that `src/gallery/GalleryScene.ts` imports `./environment/galleryLighting`, but `src/gallery/environment/galleryLighting.ts` was missing from the source tree.

This pack restores the missing lighting module expected by the current gallery runtime. Phase 8V remains the current visual/material/loading baseline pending local review; Phase 8W is only a build/runtime recovery hotfix.

## Scope

- restore `src/gallery/environment/galleryLighting.ts`;
- preserve the current Phase 8 selective-shadow lighting architecture expected by `GalleryScene.ts`;
- update docs/changelog to record the root cause and recovery;
- do not change room layout, wall placement, collision, plaque fallback, editor logic, image assets, routing, SEO, public copy, or branding deferrals.

## Files

```text
src/gallery/environment/galleryLighting.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8W_GALLERY_LIGHTING_IMPORT_RECOVERY_HOTFIX.md
docs/pack-notes/PACK_NOTES_PHASE8W.md
docs/pack-manifests/PACK_MANIFEST_PHASE8W.txt
PROJECT_CHANGELOG.md
```

## Validation

```text
npm run build
unzip -t
```
