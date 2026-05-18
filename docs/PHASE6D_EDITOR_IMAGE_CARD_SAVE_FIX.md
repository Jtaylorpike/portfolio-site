# Phase 6D — Editor Image Card Save Fix

Date: 2026-05-18

## Purpose

The lower **Save JSON** button at the bottom of an individual image editor page was reported as not reliably persisting metadata edits, while the top global **Save Changes** button did persist those changes.

This pack keeps the global save path intact and makes the lower image-card save action explicit and card-scoped.

## Implementation

- Added `collectImageCardSavePayload(state, card)` in `local-editor/static/js/collect.js`.
- The new collector reads the open image card, replaces the matching image record in the current image array, preserves current categories/About data, and rebuilds hero-slide membership only for that open image.
- Updated the lower image-card **Save JSON** click handler in `local-editor/static/js/main.js` to call the dedicated card save path instead of the broad `saveData()` path.
- Kept the top global **Save Changes** button unchanged.
- Bumped the editor cache version in `local-editor/templates/editor.html` from `v=72` to `v=73`.

## Manual test

1. Run the Flask local editor.
2. Open an individual image editor page.
3. Edit a field such as title, year, location, alt text, note, public visibility, gallery fit mode, gallery frame style, or gallery size.
4. Click the lower **Save JSON** button inside the image editor card.
5. Click **Reload Data** or refresh the editor.
6. Confirm the edited field persisted in `src/data/galleryImages.json`.
7. Repeat once with the hero checkbox/target category if needed.

## Scope

This is a local-editor hotfix. It does not change the public site, the Three.js gallery runtime, gallery curation data, wall placement, plaque metadata, collision behavior, About layout, or image rendition pipeline.
