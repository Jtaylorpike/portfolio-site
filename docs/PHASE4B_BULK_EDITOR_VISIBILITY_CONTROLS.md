# Phase 4B — Bulk Editor Visibility and Curation Controls

Updated: 2026-05-15

## Status

Phase 4B adds the first combined editor curation pack after the confirmed Phase 4A v2 rename fix.

This pack intentionally keeps the public site design stable. The public-site change is functional only: images hidden in the editor are excluded from the public portfolio, public hero slideshow, and public 3D gallery artwork catalog.

## What changed

### Public visibility data model

Image records now support an optional field:

```json
"isPublic": false
```

Rules:

- Missing `isPublic` means the image is public.
- `isPublic: true` is normalized away by the Flask editor so visible images do not bloat JSON.
- `isPublic: false` keeps the record in `src/data/galleryImages.json` and keeps rendition files untouched, but removes the image from public-facing output.

### Public filtering

`src/data/images.ts` now exposes:

```ts
allGalleryImages
```

for complete editor/internal access, and keeps:

```ts
galleryImages
```

as the public-facing filtered set where hidden images are excluded.

The legacy in-site TypeScript editor route was updated to use `allGalleryImages` so hidden images remain visible there. The active Flask editor also continues loading all images from JSON.

### Single-image editor control

Each image detail card now has a **Show on public website** checkbox.

If unchecked:

- the image remains editable;
- the image remains in JSON;
- rendition paths remain untouched;
- the image is no longer eligible for the public homepage hero.

### Bulk editor toolbar

The all-images page and per-category image pages now include a bulk editor toolbar with:

- select visible;
- clear selection;
- selected count;
- public website show/hide;
- category reassignment;
- home hero add/remove.

Bulk hero add only adds public landscape images. Portrait/square/hidden selected images are ignored for hero add. Bulk hide also removes selected images from `heroSlides` so hidden work does not remain in the public homepage carousel.

### Visual editor status

Overview cards now show status badges:

- Public;
- Hidden;
- Hero.

Hidden images are visually dimmed in the editor overview, but they remain selectable and editable.

## Files changed

```text
src/data/images.ts
src/app/editor/imageEditorPage.ts
local-editor/app/data_store.py
local-editor/static/js/collect.js
local-editor/static/js/main.js
local-editor/static/js/render.js
local-editor/static/editor.css
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4B_BULK_EDITOR_VISIBILITY_CONTROLS.md
PROJECT_CHANGELOG.md
```

## Validation performed

```text
python3 -m py_compile local-editor/app/data_store.py local-editor/app/routes.py
node --check local-editor/static/js/api.js
node --check local-editor/static/js/collect.js
node --check local-editor/static/js/main.js
node --check local-editor/static/js/render.js
npm ci --ignore-scripts
npm run build
```

Additional logic checks performed:

- backend visibility normalization test confirmed `isPublic: false` persists;
- backend hero filtering test confirmed hidden images are removed from hero slides;
- backend visibility normalization test confirmed `isPublic: true` is not redundantly persisted;
- standalone bulk payload logic test confirmed bulk hide/category/hero add/remove behavior.

`node scripts/validate-portfolio-image-data.mjs` was also attempted. It failed because the chat upload package does not include the full `public/images/portfolio/{display,thumb,texture,full}` runtime rendition files. The reported errors were missing rendition files for the uploaded sandbox copy, not errors caused by this pack.

A Playwright browser-level test was attempted with a mocked editor API, but this sandbox does not have the Playwright browser bundle installed and the system Chromium path blocks localhost navigation. Treat the build, syntax, backend normalization, and standalone payload tests as the completed validation for this pack.

## Manual test checklist

After applying the pack locally:

```text
1. Run the local editor.
2. Open Images.
3. Select one or more image cards.
4. Bulk hide selected images and confirm they show the Hidden badge.
5. Reload the editor and confirm hidden status persists.
6. Bulk show selected images and confirm the Hidden badge clears.
7. Bulk change selected images to another category and confirm the category changes persist after reload.
8. Bulk add selected landscape images to hero and confirm only public landscape images are added.
9. Bulk remove selected images from hero and confirm hero slides update.
10. Run npm run build.
```

## Known limitations

- Bulk actions operate on the currently selected cards in the editor page; they do not add advanced search/filtering yet.
- Bulk hero add appends eligible selected images to `heroSlides`; it does not replace the hero set or reorder hero slides.
- Gallery-specific bulk eligibility controls were not added in this pack. Existing gallery curation controls remain separate.
- Import review improvements are still future Phase 4 work.
