# Pack Notes — Phase 4G v6 Gallery Curation Stabilization

## What this pack is

This is a stabilization pack for the Gallery curation editor after the Phase 4G visual/CSS passes caused a regression.

## What changed

- Preserves `galleryRoom` in the frontend editor state when the Flask API returns it.
- Re-ships the full local editor Gallery curation dependency set instead of only CSS/template fragments.
- Keeps the current visual direction and dark-mode work from Phase 4G v5.
- Bumps editor cache version to `v=56`.

## Files intentionally included

This pack includes more than CSS because Gallery curation depends on a coordinated set of API, render, collect, and route files. Including all of them reduces the chance of a mixed stale state after applying sequential replacement packs.

## What was not changed

- Public site styling and behavior.
- Three.js gallery runtime.
- Wall placement math.
- Collision logic.
- Plaque fallback logic.
- Gallery curation schema.
- Runtime image assets.

## Manual test after applying

1. Open the local editor.
2. Hard refresh the browser.
3. Open the Gallery tab.
4. Confirm wall cards load.
5. Assign an artwork to one wall, then save that wall.
6. Reload data and confirm the assignment persists.
7. Toggle Show plaque on one wall, save that wall, reload data, and confirm it persists.
8. Use Save All Gallery Curation and confirm it completes without errors.
