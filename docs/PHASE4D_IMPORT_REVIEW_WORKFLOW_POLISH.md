# Phase 4D — Import Review Workflow Polish

Updated: 2026-05-15

## Purpose

Phase 4D improves the local editor import workflow after the bulk editor controls were confirmed working. The goal is to make the import review feel less like a raw form and more like a professional editor workflow for reviewing, pruning, categorizing, and importing a batch of portfolio images.

## Completed

- Added a remove button to each import review card.
- Changed the reviewed import action from `Save Reviewed Import` to a dynamic label such as `Import 3 photos`.
- Disabled the import action when no reviewed photos are pending.
- Added an import progress panel with:
  - progress label;
  - percentage text;
  - progress bar;
  - import log/status list.
- Replaced the normal fetch-based multipart import request with an XMLHttpRequest wrapper so the editor can show real upload progress.
- Added import-category creation controls on the main import screen and within each import review card.
- Updated the backend import endpoint so category changes submitted with the import review can be saved in the same import transaction.
- Kept the existing `src/data/categories.json` model; new categories are still normal category records with `id` and `label`.

## Important behavior notes

The progress bar can show real browser upload progress. The Flask backend still processes renditions as a single request and does not stream per-rendition events back to the browser. For that reason, the backend-processing step is stage-based instead of true per-file server progress.

New categories created from the import screen are not written immediately on button click. They are included with the reviewed import payload and saved when the user clicks the final import action. This avoids forcing a separate pre-save step before import.

Removing an item from the import review only removes it from the pending browser review list. It does not delete source files from disk because no rendition files have been written yet.

## Manual test checklist

1. Open the local editor.
2. Go to Import.
3. Choose multiple image files.
4. Click Prepare Import Review.
5. Confirm the final action reads `Import X photos`.
6. Remove one review card and confirm the count updates.
7. Create a new category from the import screen.
8. Create a category from a review card and assign that card to the new category.
9. Import the reviewed photos.
10. Confirm imported image records and any new category persist after reload.

## Files changed

```text
local-editor/app/image_importer.py
local-editor/static/js/api.js
local-editor/static/js/dom.js
local-editor/static/js/main.js
local-editor/static/js/render.js
local-editor/static/editor.css
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4D_IMPORT_REVIEW_WORKFLOW_POLISH.md
PROJECT_CHANGELOG.md
```
