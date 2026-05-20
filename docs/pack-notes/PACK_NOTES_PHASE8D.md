# Pack Notes — Phase 8D Gallery Runtime Recovery Rollback

Date: 2026-05-18

## Summary

This is a recovery rollback pack. It restores the gallery runtime environment files to the uploaded Phase 8A working versions after the user reported that the gallery still could not be accessed after Phase 8C.

## Root-relative pack format

This pack is formatted so its contents can be copied/extracted directly into the project root.

Expected zip root contents:

```text
src/
docs/
PROJECT_CHANGELOG.md
```

Do not nest these files under `source/`, `01-source/`, `updated-files/`, or another wrapper folder.

## Files changed

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8D_GALLERY_RUNTIME_ROLLBACK.md
docs/pack-notes/PACK_NOTES_PHASE8D.md
docs/pack-manifests/PACK_MANIFEST_PHASE8D.txt
PROJECT_CHANGELOG.md
```

## Validation

- Applied Phase 8B root-format pack and Phase 8C hotfix pack to the uploaded Phase 8A source in a simulated working tree.
- Applied Phase 8D rollback files over that simulated post-Phase-8C state.
- Confirmed the three runtime files match the uploaded Phase 8A source exactly.
- Ran `npm ci --ignore-scripts` and `npm run build` successfully in the simulated post-Phase-8D tree.
- Verified root-relative pack structure.
- Verified `unzip -t`.

## Notes

This pack intentionally sacrifices the Phase 8B runtime material/lighting work to restore gallery access first. Continue Phase 8 only after the gallery is confirmed to open again.
