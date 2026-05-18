# Pack Notes — Phase 6I Mobile Route and Touch Hardening

## Summary

This pack extends the short landscape-phone treatment beyond the homepage and hardens mobile gallery touch-state cleanup during mobile browser interruptions.

## Included changes

- Added a short landscape-phone public-shell guard for non-home pages.
- Made the Portfolio route use a compact horizontal category rail on wide, short phone screens.
- Tightened Portfolio heading, metadata strip, and grid spacing for phone landscape orientation.
- Tightened About route spacing and reduced background-float dominance on wide, short phone screens.
- Added touch-callout and overscroll guards around the fullscreen gallery overlay.
- Added touch-state cleanup for blur, pagehide, visibility loss, orientation change, touch-mode resize, and gallery teardown.
- Added `LookController.resetInteraction()` so the gallery can clear stale captured touch-look pointers safely.

## Not changed

- Phase 6F touch camera sensitivity.
- Phase 6E touch movement responsiveness.
- Desktop gallery controls.
- Public gallery wall placement, collision, lighting, curation, or plaque metadata.
- Local editor behavior.
- About copy/photo data.
- Desktop, tablet, or portrait-phone route layouts outside the scoped media query.

## Manual checks after applying

- Build the site with `npm run build`.
- Deploy/push to `dev` for real-device testing.
- Check Portfolio and About in horizontal phone orientation.
- Check gallery movement/look after rotating the phone or switching away from the browser.
