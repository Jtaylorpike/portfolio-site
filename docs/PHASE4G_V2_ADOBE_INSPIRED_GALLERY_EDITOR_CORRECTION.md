# Phase 4G v2 — Adobe-inspired Gallery editor correction

Date: 2026-05-15

## Purpose

Phase 4G v2 corrects the first Gallery editor visual professionalization pass. The Phase 4G layout direction is still useful, but the oversized saturated green checkbox treatment did not match the intended professional editor design.

The approved editor direction is Adobe-inspired archive software: neutral, compact, panel-based, visually quiet, image-first, and free of decorative status icons.

## Changed

```text
Removed the oversized/loud checkbox treatment by normalizing local-editor checkboxes
Changed Gallery boolean controls such as Show plaque to compact neutral controls
Reduced success-color dependence in Gallery status chips
Kept warning/empty states muted instead of decorative
Confirmed editor typography uses system sans and standard system monospace only, not the VCR/pixel font
Bumped editor assets to v=52
Documented future drag-and-drop ordering for category-specific Images views
```

## Not changed

```text
No public-site behavior changed
No Three.js gallery runtime changed
No wall placement math changed
No collision logic changed
No plaque fallback logic changed
No gallery curation JSON schema changed
No drag-and-drop ordering implemented yet
```

## Future backlog note

Add drag-and-drop ordering for photos inside category-specific Images views. This should apply to every Images category view except All images, because All images should remain a neutral archive-wide listing rather than a curated sequence.

## Manual test focus

```text
Open the local editor
Open Gallery
Confirm Show plaque renders as a compact neutral checkbox, not a green block
Toggle Show plaque and save a wall
Reload data and confirm plaque state persists
Open the add-wall overlay and confirm its Show plaque control matches the same treatment
Open Images and confirm bulk-selection checkboxes still work
Open Import and confirm import review controls still work
```
