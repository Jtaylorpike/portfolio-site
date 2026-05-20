# Pack Notes — Phase 8F Gallery Motion Artifact Cleanup

## Apply method

This is a root-relative replacement pack. Copy/extract the zip contents directly into the project root and overwrite matching files.

The zip root intentionally contains changed project paths directly. It does not use `source/`, `01-source/`, `updated-files/`, or a root-level phase README.

## Changed files

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8F_GALLERY_MOTION_ARTIFACT_CLEANUP.md
docs/pack-notes/PACK_NOTES_PHASE8F.md
docs/pack-manifests/PACK_MANIFEST_PHASE8F.txt
PROJECT_CHANGELOG.md
```

## Summary

Phase 8F is a corrective visual-stability pass after Phase 8E. It removes the remaining procedural surface texture maps and restores the stable pre-Phase-8B lighting/material baseline after the user reported a greenish-grey motion trace around wall geometry.

## Manual check

After applying, hard refresh the browser, open the virtual gallery, and move/turn near the walls. The check is whether the greenish-grey tracer is gone while the darker top-wall/cap band remains fixed.
