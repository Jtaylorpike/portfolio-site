# Phase 5I — About Copy Editor

Date: 2026-05-16

## Purpose

Add an editor-managed copy layer for the public About/contact page so final user-authored copy can be edited without changing TypeScript page markup by hand.

## Changes

- Added `src/data/aboutCopy.json` as the data-backed source for public About/contact copy.
- Added `src/data/aboutCopy.ts` with typed defaults and normalization for the public Vite site.
- Updated `src/app/sitePages.ts` so the About/contact page renders copy from `aboutCopy` instead of hardcoded page strings.
- Added a structured About Copy section to the local editor About tab.
- Added editor fields for:
  - hero/intro eyebrow, headline, and intro paragraph;
  - main About block eyebrow, heading, and two paragraphs;
  - project/practice block eyebrow, heading, and two paragraphs;
  - contact eyebrow, headline, body text, email, and up to four optional link slots.
- Updated local editor data loading, saving, backup creation, and backup restore support to include `aboutCopy.json`.
- Added minimal editor styling for the new copy panels and public styling for optional About contact links.
- Bumped editor asset query strings to `v=71`.

## Copy authorship rule

This pack does not introduce final AI-written About copy. It moves the existing placeholder copy into an editable JSON structure. The user's final About/contact language should still be written by the user unless they explicitly ask for copywriting help.

## Files changed

```text
src/data/aboutCopy.json
src/data/aboutCopy.ts
src/app/sitePages.ts
src/styles/global.css
local-editor/app/data_store.py
local-editor/app/routes.py
local-editor/static/js/collect.js
local-editor/static/js/dom.js
local-editor/static/js/main.js
local-editor/static/js/render.js
local-editor/static/editor.css
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE5I_ABOUT_COPY_EDITOR.md
docs/pack-notes/PACK_NOTES_PHASE5I.md
docs/pack-manifests/PACK_MANIFEST_PHASE5I.txt
PROJECT_CHANGELOG.md
```

## Validation

- `python3 -m py_compile local-editor/app/data_store.py local-editor/app/routes.py`
- `node --check` for edited local-editor JavaScript modules
- `npm run build`
- JSON parse check for `src/data/aboutCopy.json`
- CSS brace-balance checks for `src/styles/global.css` and `local-editor/static/editor.css`
- `unzip -t` on the generated pack

## Manual test

1. Apply the replacement files.
2. Start the local editor.
3. Open `#/about`.
4. Confirm the About Copy panels appear above the About image import controls.
5. Edit at least one About copy field and click **Save Changes**.
6. Confirm `src/data/aboutCopy.json` updates and a backup folder includes `aboutCopy.json`.
7. Run the public site and confirm the About page renders the edited copy.
8. Save from a non-About editor page and confirm existing About copy is not overwritten by empty fields.
