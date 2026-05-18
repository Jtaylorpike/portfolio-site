# Phase 4H-I-J — Editor functionality pack

Date: 2026-05-15

## Purpose

This combined Phase 4 pack implements the remaining high-value editor workflow items that were identified after the Gallery curation stabilization work:

- Phase 4H: drag-and-drop ordering for category-specific Images views;
- Phase 4I: editor-wide unsaved-changes protection and save-state feedback;
- Phase 4J: import collision and error handling hardening.

This pack intentionally avoids public-site redesign work. It also avoids more broad editor visual experimentation after the Phase 4G visual passes. The only CSS additions support the new functional states.

## Changed behavior

### Category image ordering

Category-specific Images pages now support drag-and-drop ordering with a compact drag handle on each image card.

Important constraints:

- drag ordering is only present on `#/images/category/<category-id>` routes;
- the All images view remains non-draggable;
- the existing Top / Up / Down buttons remain available;
- the existing Save Category Order action still persists the order to `src/data/galleryImages.json`;
- ordering changes do not change image IDs, hero references, gallery assignments, or rendition paths.

### Dirty-state and discard protection

The editor now has a clearer saved/unsaved state in the header.

Changed behavior:

- the header shows `Saved` or `Unsaved changes`;
- the global save button receives a dirty-state marker;
- browser refresh/close still warns about unsaved changes;
- route changes now ask before discarding unsaved edits;
- Reload Data asks before discarding unsaved edits;
- Clear Import Review asks before discarding pending reviewed import metadata.

### Import collision and error hardening

The import workflow now validates more defensively before the backend writes any files.

Frontend additions:

- import review records carry the original filename into validation;
- duplicate filenames in one import batch produce a warning;
- import-card status states are exposed to CSS for readable warning/error styling.

Backend additions:

- import preflight validates all records before writing source files, renditions, or JSON;
- duplicate IDs inside the same import review are rejected;
- IDs that already exist in `galleryImages.json` are rejected;
- IDs that would overwrite existing rendition files are rejected;
- invalid ID formatting is rejected;
- unsupported image extensions are rejected instead of silently skipped;
- if optimization or save validation fails after file writing begins, newly created source/rendition files are cleaned up.

## Files changed

```text
local-editor/app/image_importer.py
local-editor/static/editor.css
local-editor/static/js/api.js
local-editor/static/js/collect.js
local-editor/static/js/dom.js
local-editor/static/js/importValidation.js
local-editor/static/js/main.js
local-editor/static/js/render.js
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4H_I_J_EDITOR_FUNCTIONALITY_PACK.md
PROJECT_CHANGELOG.md
```

## Manual test focus

```text
1. Open Images > a specific category.
2. Drag image cards with the drag handle.
3. Save Category Order, reload, and confirm the order persists.
4. Confirm All images does not expose drag-order handles.
5. Edit an image field, then try to navigate away and confirm the discard warning appears.
6. Edit an image field, then click Reload Data and confirm the discard warning appears.
7. Prepare an import review with duplicate IDs and confirm the import is blocked before upload.
8. Prepare an import review with duplicate filenames and confirm a warning appears.
9. Try an import ID that already exists and confirm the backend blocks it clearly.
10. Run `npm run build`.
```

## Non-goals

```text
No public-site behavior changes
No public-site CSS changes
No Three.js runtime changes
No gallery curation schema changes
No gallery placement/collision/plaque fallback changes
No broad editor visual redesign
No true backend-streamed per-file import progress
```
