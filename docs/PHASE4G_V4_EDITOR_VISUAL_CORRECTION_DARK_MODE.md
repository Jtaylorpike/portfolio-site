# Phase 4G v4 — Editor visual correction and dark mode

Updated: 2026-05-15

## Purpose

Phase 4G v3 moved the local editor toward an Adobe/archive-editor design system, but user review identified several rough CSS outcomes: Wall Finder controls overlapped, gallery wall preview trim looked noisy, rectangular buttons felt too rigid, the image selection overlay was awkward, and the editor needed a dark-mode option.

Phase 4G v4 corrects those issues while keeping the editor behavior and public site unchanged.

## Changed

```text
Wall Finder layout changed to a clean heading row plus filter-control grid
Gallery wall-preview baseboard/floor/label/trim decorations hidden in editor thumbnails
Editor buttons softened into compact rounded software controls instead of hard rectangles
Bulk image selection overlay replaced by a small top-left selection square
Local light/dark editor theme toggle added to the command header
Dark theme CSS variables and contrast overrides added for panels, controls, inputs, cards, overlays, and map surfaces
Editor cache version bumped to v=54
```

## Technical notes

The light/dark toggle is local-editor-only and stores its value in `localStorage` under `taylor-pike-editor-theme`. It does not change portfolio data or public-site appearance.

The wall preview change is visual-only. It hides editor-thumbnail trim/baseboard/floor elements with CSS; it does not change Three.js gallery geometry, wall data, frame placement, plaque placement, collision logic, or runtime rendering.

## Files changed

```text
local-editor/static/editor.css
local-editor/static/js/dom.js
local-editor/static/js/main.js
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4G_V4_EDITOR_VISUAL_CORRECTION_DARK_MODE.md
PROJECT_CHANGELOG.md
```

## Manual test focus

```text
Open Gallery editor and confirm Wall Finder no longer overlaps
Confirm wall previews no longer show the baseboard/floor trim at thumbnail size
Confirm image overview selection is a compact square, not a large Select Image banner
Confirm buttons feel softer and remain readable in light mode
Use Dark Mode / Light Mode toggle and confirm the theme persists after reload
Confirm Save/Reload/import/gallery/bulk editor behavior still works as before
```
