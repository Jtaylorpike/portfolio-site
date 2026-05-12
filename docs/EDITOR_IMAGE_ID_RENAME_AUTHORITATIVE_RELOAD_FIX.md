# Editor Image ID Rename Authoritative Reload Fix

This pack hardens the local editor image ID rename workflow after the first UI refresh fix was still insufficient.

## Problem

After `Rename ID + Rendition Files`, the editor could still display stale identity data. The likely failure mode is that the editor UI can continue to reflect an old DOM route/state even after the backend has completed the JSON and rendition rename.

## Change

The rename flow now:

1. Calls the backend rename endpoint.
2. Reads `updatedImage.id` from the backend response.
3. Reloads the full editor data from `/api/data` after the backend write completes.
4. Finds the renamed image in the reloaded data.
5. Replaces the old hash route with `#/image/<new-id>`.
6. Renders the image detail page from the authoritative reloaded state.
7. Checks that the visible image card, hidden ID field, and visible Current ID code all match the new ID.
8. Performs a hard page reload only if the visible editor route still does not sync.

This keeps the normal experience smooth, but gives the local editor a final fallback if the dynamic render path remains stale.

## Files changed

```text
local-editor/static/js/main.js
local-editor/static/js/render.js
local-editor/templates/editor.html
```

## Notes

`render.js` now marks the visible Current ID value with `data-current-image-id` so the controller can verify that the identity panel actually updated.

`editor.html` now uses `?v=18` for CSS and JS cache busting.
