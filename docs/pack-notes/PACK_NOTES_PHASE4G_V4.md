# Pack Notes — Phase 4G v4 Editor Visual Correction and Dark Mode

## Purpose

This pack corrects the Phase 4G v3 CSS overhaul after real editor review. It keeps the Adobe/archive-editor direction, but fixes the specific rough edges that showed up in the local editor: Wall Finder overlap, noisy wall-preview trim, awkward Select Image overlays, rigid rectangle buttons, and the lack of a dark-mode option.

## What changed

- Added a local light/dark editor theme toggle in the top command header.
- Stores the selected editor theme in browser `localStorage` using `taylor-pike-editor-theme`.
- Bumped the local editor asset version to `v=54`.
- Fixed Gallery Wall Finder layout so the heading and filter controls do not overlap.
- Removed decorative baseboard/floor/wall-label trim from gallery wall-preview thumbnails.
- Replaced the large `Select Image` banner overlay with a compact top-left selection square.
- Softened the editor button treatment so buttons are compact professional controls without the harsh rectangle look.
- Added dark-mode token overrides for panels, controls, inputs, cards, overlays, wall previews, and map surfaces.
- Updated current handoff docs, roadmap, and changelog.

## What did not change

- Public site behavior or public site styling.
- Portfolio image data.
- Gallery curation schema.
- Three.js gallery runtime.
- Wall placement math.
- Collision logic.
- Plaque fallback logic.
- Import behavior.
- Bulk editor behavior.
- Save/reload behavior.

The only new JavaScript behavior is the local editor theme toggle.

## Validation run

```text
node --check local-editor/static/js/main.js
node --check local-editor/static/js/dom.js
node --check local-editor/static/js/render.js
CSS brace-balance check
npm ci --ignore-scripts
npm run build
unzip -t TaylorPikePortfolio-Phase4G-v4-EditorVisualCorrectionDarkMode-Pack-20260515.zip
```

## Manual test focus

```text
1. Open the local editor.
2. Confirm the top header shows a Dark Mode / Light Mode toggle.
3. Toggle dark mode and reload the editor; confirm the selected theme persists.
4. Open the Gallery page and confirm Wall Finder filters no longer overlap.
5. Confirm gallery wall preview thumbnails no longer show floor/baseboard trim.
6. Open Images and confirm selection UI is a compact square, not a large Select Image banner.
7. Confirm Save, Reload, import, bulk edit, and gallery save behavior still work as before.
```
