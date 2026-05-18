# Pack Notes — Phase 6B Mobile Gallery Polish

## Purpose

Polish the Phase 6A mobile gallery touch-control baseline before pushing to a dev preview for real-device phone testing.

## Apply order

Apply after the Phase 6A Mobile Gallery Touch Controls pack. Copy the files in this pack over the matching project paths from the repository root.

## Changed files

```text
src/app/galleryController.ts
src/app/renderSite.ts
src/gallery/controls/lookController.ts
src/gallery/controls/movementController.ts
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6B_MOBILE_GALLERY_POLISH.md
docs/pack-notes/PACK_NOTES_PHASE6B.md
docs/pack-manifests/PACK_MANIFEST_PHASE6B.txt
PROJECT_CHANGELOG.md
```

## Manual test

1. Run `npm run build` locally after applying.
2. Push the applied changes to the `dev` branch.
3. Test the deployed dev preview on a real phone.
4. Open the virtual gallery.
5. Confirm the touch hint appears briefly and fades after interaction.
6. Confirm the left movement pad moves the camera without drift.
7. Confirm drag-to-look feels controlled and does not jump.
8. Confirm the artwork info panel does not block the movement pad.
9. Rotate to landscape and confirm controls remain usable.
10. Check desktop gallery behavior to confirm pointer-lock/WASD behavior remains intact.

## Notes

This pack intentionally does not alter gallery curation data, artwork placement, wall placement, collision, plaque fallback, lighting, texture loading, About/contact work, or editor behavior.
