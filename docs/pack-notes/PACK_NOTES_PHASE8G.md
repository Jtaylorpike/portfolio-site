# Pack Notes — Phase 8G Gallery Tonal Refinement Restart

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
docs/PHASE8G_GALLERY_TONAL_REFINEMENT.md
docs/pack-notes/PACK_NOTES_PHASE8G.md
docs/pack-manifests/PACK_MANIFEST_PHASE8G.txt
PROJECT_CHANGELOG.md
```

## Summary

Phase 8G is a conservative visual restart after Phase 8F stabilized the camera-movement tracer. It improves the gallery room through warmer flat materials, low-cost lighting balance, and simple architectural ceiling-light fixture framing.

It intentionally does not reintroduce procedural surface textures, transparent per-artwork shadow geometry, runtime shadow maps, post-processing, new dependencies, or image assets.

## Manual check

After applying, hard refresh the browser, open the virtual gallery, and move/turn near multiple walls. Confirm that the greenish-grey tracer and darker top-wall/cap band remain gone. Then judge whether the room feels warmer, cleaner, and more refined without becoming yellow, muddy, or game-like.
