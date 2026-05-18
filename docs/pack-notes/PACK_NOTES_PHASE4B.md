# Taylor Pike Portfolio — Phase 4B Bulk Editor Visibility Pack

Date: 2026-05-15

## Purpose

This pack combines the first bulk editor curation updates into one replacement pack. It builds on the confirmed-working Phase 4A v2 rename fix.

## Scope

- Adds optional `isPublic: false` visibility support to image records.
- Keeps hidden images in `src/data/galleryImages.json` and keeps rendition file paths untouched.
- Filters hidden images out of public-facing `galleryImages` while preserving `allGalleryImages` for complete editor/internal access.
- Adds a single-image **Show on public website** checkbox in the Flask local editor.
- Adds bulk controls on all-images and category image pages:
  - select visible;
  - clear selection;
  - selected count;
  - bulk show/hide;
  - bulk category reassignment;
  - bulk hero add/remove.
- Adds Public/Hidden/Hero badges to editor overview cards.
- Bumps the local editor asset query string to `v=46`.

## Files included

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
PACK_NOTES_PHASE4B.md
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

Additional checks:

- Backend visibility normalization test passed.
- Backend hidden-image hero filtering test passed.
- Backend `isPublic: true` cleanup test passed.
- Render markup test confirmed the bulk toolbar, Hidden badge, Hero badge, and single-image visibility checkbox render.
- Standalone bulk payload logic test passed for hide/category/hero add/hero remove behavior.

## Validation caveat

`node scripts/validate-portfolio-image-data.mjs` was attempted and failed because this chat upload does not include the full runtime rendition folders under `public/images/portfolio/{display,thumb,texture,full}`. The errors were missing rendition-file errors for the sandbox upload, not errors introduced by this pack.

A browser-level Playwright test was attempted with a mocked editor API. This sandbox does not have Playwright's managed browser bundle installed, and the system Chromium path blocks localhost navigation, so the browser test could not be completed here.

## Recommended manual test after applying

```text
1. Run the local editor.
2. Open Images.
3. Select one or more image cards.
4. Bulk hide selected images.
5. Confirm the Hidden badge appears.
6. Reload the editor and confirm hidden status persists.
7. Bulk show the same images and confirm the Hidden badge clears.
8. Bulk change selected images to another category and confirm it persists after reload.
9. Bulk add selected landscape images to hero and confirm only public landscape images are added.
10. Bulk remove selected images from hero.
11. Run npm run build.
```

## Not included

- Import review remove buttons.
- Import progress bar/logging.
- Category creation from import dropdown.
- Gallery-specific bulk eligibility controls.
