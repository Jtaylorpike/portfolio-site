# Phase 5C — About Three-Layer Collage Controls

Updated: 2026-05-16

## Purpose

Phase 5C refines the About/contact page toward the user's second mockup. The public page now treats About imagery as three distinct visual layers that are controlled from the editor instead of relying only on array order.

## Public layout model

The About page now uses:

1. **Copy blocks** — the same overall copy structure from Phase 5B: top intro block, full-width copy band, lower split copy block, and contact block.
2. **Foreground collage photos** — active About photos with `placementRole: "upper-collage"` or `placementRole: "lower-collage"`.
3. **Background float photos** — active About photos with `placementRole: "background-float"`, rendered as low-opacity transparent background images with scroll-linked drift.

The upper collage intentionally renders only the first two active `upper-collage` records. The lower collage renders an ordered group of lower-collage records. Background float images are decorative and hidden from assistive technology.

## Data model update

About photo records now support:

```json
"placementRole": "upper-collage"
```

Allowed values:

- `upper-collage`
- `lower-collage`
- `background-float`
- `unused`

The editor and backend normalize invalid or missing values to `lower-collage`.

## Editor update

The local editor About tab now exposes an **About placement** select for each About photo record and import review card. Native About imports can also choose a default placement before preparing the import review.

Normal portfolio image edit pages still support **Add to About**. Portfolio references added that way default to `lower-collage` and can be reassigned in the About tab.

## Temporary imagery

`src/data/aboutPhotos.json` now includes additional temporary portfolio-reference records so the upper collage, lower collage, and transparent background float layers are populated for visual testing. These are still placeholders and can be replaced with native About imports later.

## Boundaries

This pack does not change gallery curation, portfolio image rendering, Three.js runtime behavior, portfolio import writing, wall placement, collision, or plaque fallback behavior.
