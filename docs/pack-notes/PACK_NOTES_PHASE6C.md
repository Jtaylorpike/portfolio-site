# Pack Notes — Phase 6C Gallery Metadata Simplification

## Purpose

Remove editor/layout-oriented wall type labels from the public gallery plaques and bottom-right artwork info cards.

## What changed

- Public gallery metadata no longer includes wall type labels such as `Standard display wall`.
- Gallery plaques now show curated display order, category, and year/archive status.
- Bottom-right artwork info cards now use the same public metadata format as plaques.
- Added a shared formatter so public plaque metadata and info-card metadata stay consistent.

## Files included

```text
src/gallery/artwork/galleryLayout.ts
src/gallery/GalleryScene.ts
src/app/galleryController.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6C_GALLERY_METADATA_SIMPLIFICATION.md
docs/pack-notes/PACK_NOTES_PHASE6C.md
docs/pack-manifests/PACK_MANIFEST_PHASE6C.txt
PROJECT_CHANGELOG.md
```

## Validation

- `npm run build`
- Static source checks for removed public `wallSection` metadata usage
- `unzip -t`

## Notes

This pack intentionally preserves wall type data and controls because they are still needed for gallery layout, wall scale, editor filtering, and placement logic. The change is only viewer-facing metadata cleanup.
