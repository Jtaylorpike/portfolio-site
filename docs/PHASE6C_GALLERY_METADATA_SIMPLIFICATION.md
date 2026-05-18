# Phase 6C — Gallery Metadata Simplification

Date: 2026-05-18

## Summary

Phase 6C simplifies the viewer-facing metadata shown in the public Three.js gallery plaques and bottom-right artwork info card.

The previous display exposed internal wall architecture labels such as `Standard display wall`. Those labels are useful in the editor and layout model, but they are not meaningful to a public viewer standing in the gallery.

## Public behavior changed

Gallery plaques and the bottom-right artwork info card now use the same public metadata format:

```text
08 / CLIMBING / ARCHIVE
```

The wall type is no longer shown in public gallery metadata.

The retained number is the curated display order/archive index, not a wall-type label. This keeps the site’s gallery/archive numbering language without exposing technical wall-block metadata.

## Implementation notes

- Added `formatGalleryArtworkPublicMeta()` in `src/gallery/artwork/galleryLayout.ts`.
- Updated plaque texture generation in `src/gallery/GalleryScene.ts` to use the shared public metadata formatter.
- Updated the bottom-right gallery info card in `src/app/galleryController.ts` to use the same formatter.
- No gallery curation data, wall placement, wall type controls, plaque fallback positioning, collision, lighting, image loading, or editor behavior changed.

## QA status

Validated by production build.

Manual visual check after applying:

1. Open the virtual gallery.
2. Focus or approach several artworks.
3. Confirm plaques no longer show wall type labels.
4. Confirm the bottom-right card no longer shows wall type labels.
5. Confirm the artwork title, category/year metadata, location, and note still render normally.
