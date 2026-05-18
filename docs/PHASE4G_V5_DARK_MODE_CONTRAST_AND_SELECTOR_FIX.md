# Phase 4G v5 — Dark Mode Contrast and Selector Fix

## Purpose

Phase 4G v5 is a corrective CSS-only pass on top of the Adobe/archive editor direction. The previous dark-mode pass worked functionally, but the real editor screenshots showed that dark mode was too low contrast and the image selection control still appeared as two nested shapes.

## Changes

- Increased dark-mode contrast across the local editor workspace, panels, cards, form fields, navigation tabs, category tabs, status messages, buttons, badges, gallery wall previews, and metadata labels.
- Reworked the bulk image selection control so it renders as one coherent square control instead of a custom square containing a second native checkbox square.
- Preserved the accessible native checkbox input by hiding the browser-drawn box and styling the label as the single visible control.
- Kept the gallery wall preview trim/baseboard/floor elements hidden.
- Bumped the local editor asset query string to `v=55`.

## Intentionally unchanged

- No public-site code or styling was changed.
- No image data, gallery data, or category data was changed.
- No editor save/reload behavior was changed.
- No bulk-edit, import, gallery map, wall placement, collision, plaque fallback, or Three.js runtime behavior was changed.
- No VCR/pixel font was added to the editor.

## Validation

- CSS brace-balance check.
- `npm run build`.
- Zip integrity check with `unzip -t`.
