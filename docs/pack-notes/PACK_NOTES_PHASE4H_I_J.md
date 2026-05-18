# Pack Notes — Phase 4H-I-J Combined Editor Functionality

## Summary

This pack combines the remaining high-value Phase 4 editor workflow items into one update:

- category-specific image drag-and-drop ordering;
- editor-wide saved/unsaved state and discard protection;
- import collision/error hardening.

It uses the confirmed-working Phase 4G v6 Gallery curation stabilization state as the baseline and preserves the existing public site, Three.js runtime, gallery schema, wall placement math, collision logic, and plaque fallback behavior.

## Key changes

### Category ordering

- Adds drag handles to cards on category-specific Images views.
- Keeps All images non-draggable.
- Keeps the existing Top / Up / Down buttons.
- Saves category order through the existing Save Category Order flow.

### Save/dirty state

- Adds a header `Saved` / `Unsaved changes` indicator.
- Keeps the browser refresh/close warning.
- Adds discard confirmation before route changes with unsaved changes.
- Adds discard confirmation before Reload Data.
- Adds confirmation before clearing a pending import review.

### Import hardening

- Adds duplicate-filename warnings during import review.
- Sends original filenames through the import review records.
- Backend validates all import records before writing files.
- Backend rejects duplicate IDs, existing image IDs, invalid IDs, unsupported extensions, and existing rendition-file collisions.
- Backend cleans up newly created source/rendition files if optimization or JSON validation fails mid-import.

## Files included

See `PACK_MANIFEST_PHASE4H_I_J.txt` for the exact file inventory.

## Validation run

```text
node --check local-editor/static/js/main.js
node --check local-editor/static/js/render.js
node --check local-editor/static/js/collect.js
node --check local-editor/static/js/api.js
node --check local-editor/static/js/importValidation.js
python3 -m py_compile local-editor/app/image_importer.py local-editor/app/data_store.py local-editor/app/routes.py
CSS brace-balance check
npm run build
Backend import preflight duplicate/existing/valid ID smoke test
```

## Manual test steps

```text
1. Open the local editor.
2. Go to Images > a category such as Climbing or Landscape.
3. Drag cards with the top-right handle.
4. Save Category Order.
5. Reload Data and confirm the order persists.
6. Confirm All images has no drag handles.
7. Edit an image field, then click another editor section and confirm the discard warning appears.
8. Edit an image field, then click Reload Data and confirm the discard warning appears.
9. Prepare an import with duplicate IDs and confirm it blocks before import.
10. Prepare an import with an ID that already exists and confirm it blocks clearly.
```

## Caveats

- This pack does not implement true backend-streamed per-file import progress.
- This pack does not add gallery-specific bulk eligibility controls.
- This pack does not perform another broad visual redesign.
