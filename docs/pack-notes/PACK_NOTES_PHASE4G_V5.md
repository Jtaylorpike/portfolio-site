# Pack Notes — Phase 4G v5 Dark Mode Contrast and Selector Correction

## Purpose

This pack corrects the visual issues reported after Phase 4G v4:

- dark mode was too low contrast;
- the bulk image selector still looked like two separate shapes instead of one clean selectable control.

The pack is intentionally CSS-forward and preserves the editor's technical behavior.

## Changed

- Increased dark-mode contrast across editor surfaces, panels, cards, form fields, navigation, category tabs, badges, status bars, and gallery preview surfaces.
- Reworked the bulk image selector so the visible control is one coherent square.
- Kept the native checkbox input in the DOM for accessibility, but hid the browser-drawn checkbox to avoid the nested-square artifact.
- Kept gallery wall-preview trim/baseboard/floor elements hidden.
- Bumped the local editor cache version to `v=55`.
- Updated Phase 4 docs and changelog.

## Unchanged

- No public-site code or styling changed.
- No editor JavaScript behavior changed.
- No data schema changed.
- No image, category, hero, or gallery curation JSON changed.
- No Three.js runtime, gallery placement, collision, plaque fallback, import, bulk edit, save, or reload behavior changed.
- No VCR/pixel font was added to the editor.

## Validation

Run in the full source tree:

```powershell
npm ci --ignore-scripts
npm run build
```

Also completed:

```text
CSS brace-balance check
unzip -t pack integrity check
```

## Manual checks after applying

1. Open the local editor.
2. Toggle Dark Mode.
3. Check the Images page, Gallery page, Categories page, and bulk toolbar.
4. Confirm text, labels, inactive tabs, cards, and form fields are readable.
5. Select one or more images and confirm the selector appears as one square, not a square containing another square.
6. Confirm gallery wall previews still do not show the old trim/baseboard/floor detail.
