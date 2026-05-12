# Editor Image ID Rename UI Refresh Fix

## Purpose

This update fixes the local editor route/render sequence after the controlled image ID rename action.

The rename backend already updates the image record, hero slide references, and portfolio rendition filenames. The UI issue was that the frontend applied the returned state while the browser hash still pointed at the old image ID. That meant the editor could render the old now-invalid route before the hash changed, leaving the visible Image identity panel stale or briefly showing an invalid image route.

## Updated behavior

After `Rename ID + Rendition Files` succeeds, the editor now:

1. Reads `result.updatedImage.id` from the backend response.
2. Builds an explicit image-detail route for the new ID.
3. Replaces the browser hash with `#/image/<new-id>` before rendering.
4. Applies the returned state while rendering that explicit new route.
5. Updates the Current ID panel, hidden ID field, and path preview immediately.

## Files changed

```text
local-editor/static/js/main.js
local-editor/templates/editor.html
```

## Notes

This is intentionally a small stability pack. It does not add gallery curation controls and does not alter the backend rename logic. Gallery curation should still be regenerated on top of the current source only after this rename flow is confirmed locally.
