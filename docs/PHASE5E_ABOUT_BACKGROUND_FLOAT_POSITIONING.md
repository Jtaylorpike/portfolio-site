# Phase 5E — About Background Float Positioning

Date: 2026-05-16

## Purpose

Phase 5E refines the transparent background-image layer on the public About/contact page. Phase 5D made the background floats large enough to read, but the placement still kept too many images comfortably inside the page field. The intended direction is more atmospheric: most background images should spill off the viewport edges, while at least one image floats slightly off-center toward the middle of the page.

## Changes

- Repositioned About background-float images so most of them intentionally sit beyond the browser viewport edge.
- Targeted roughly 20-30% edge spill for the left/right floating images.
- Kept one mid-page background float slightly off-center toward the page middle.
- Kept the foreground upper/lower collage behavior unchanged.
- Kept About editor grouping and placement controls unchanged.
- Kept final public About copy as placeholders.

## Files changed

- `src/styles/global.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE5E_ABOUT_BACKGROUND_FLOAT_POSITIONING.md`
- `docs/pack-notes/PACK_NOTES_PHASE5E.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE5E.txt`
- `PROJECT_CHANGELOG.md`

## Validation

- CSS brace-balance check.
- `npm run build`.
- Zip integrity check.

## Notes

No editor behavior, About data model, gallery curation behavior, public portfolio behavior, Three.js runtime behavior, portfolio import behavior, wall placement, collision, or plaque fallback behavior was changed.
