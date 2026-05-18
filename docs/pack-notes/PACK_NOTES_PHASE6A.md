# Pack Notes — Phase 6A Mobile Gallery Touch Controls

## Purpose

Start Phase 6 by making the public Three.js gallery usable on mobile/touch devices instead of showing the old desktop-only fallback.

## Apply order

Copy the files in this pack over the matching project paths from the repository root.

## Changed files

```text
src/app/galleryController.ts
src/app/renderSite.ts
src/gallery/GalleryScene.ts
src/gallery/controls/lookController.ts
src/gallery/controls/movementController.ts
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6A_MOBILE_GALLERY_TOUCH_CONTROLS.md
docs/pack-notes/PACK_NOTES_PHASE6A.md
docs/pack-manifests/PACK_MANIFEST_PHASE6A.txt
PROJECT_CHANGELOG.md
```

## Manual test

1. Run the site locally.
2. Open the public site at a mobile viewport or on a real phone.
3. Trigger the virtual gallery.
4. Confirm the desktop-only mobile fallback does not appear.
5. Confirm the 3D gallery canvas appears.
6. Use the left thumb pad to move.
7. Drag on the gallery canvas to look around.
8. Confirm Exit closes the gallery cleanly.
9. Repeat on desktop and confirm pointer-lock/WASD behavior still works.

## Notes

This pack intentionally does not alter gallery curation data, wall placement, collision geometry, plaque placement, image texture loading, lighting, or gallery editor behavior.
