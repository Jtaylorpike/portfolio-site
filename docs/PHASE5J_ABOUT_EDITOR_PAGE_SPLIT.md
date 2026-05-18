# Phase 5J — About Editor Page Split

## Summary

Phase 5J separates the About editor into two editor routes:

- `#/about` — default About Copy page
- `#/about/photos` — About Photos page

The goal is to keep the copy editor immediately available when clicking About in the editor navigation while moving the larger image import and curation controls onto their own page.

## Changed files

- `local-editor/templates/editor.html`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/static/editor.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `PROJECT_CHANGELOG.md`

## Behavior

The editor top navigation now includes:

- About — opens `#/about` and shows copy controls by default.
- About Photos — opens `#/about/photos` and shows About image import and curation controls.

The About Copy page includes a secondary button to open About Photos. The About Photos page includes a secondary button to return to About Copy.

## Data model

No data model change was made. The split is route and presentation only.

- About copy still saves to `src/data/aboutCopy.json`.
- About photos still save to `src/data/aboutPhotos.json`.
- Native About imports still write to `public/images/about/`.
- Portfolio-reference About photo records still point back to existing portfolio image paths.

## Notes

This keeps Phase 5I's copy editor intact while making the About editor less crowded and easier to navigate before the responsive QA phase.
