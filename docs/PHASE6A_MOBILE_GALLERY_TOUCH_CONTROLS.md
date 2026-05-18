# Phase 6A — Mobile Gallery Touch Controls

Date: 2026-05-16

## Summary

Phase 6A starts the mobile 3D gallery phase by replacing the old touch-device fallback with a real mobile input layer for the existing Three.js gallery.

The goal is not to finish every mobile-gallery detail in one pass. The goal is to make the gallery enterable and controllable on touch devices while preserving the existing room, artwork, collision, wall-placement, plaque, lighting, and texture-loading systems.

## Public behavior

Touch/coarse devices now:

- open the real virtual gallery overlay;
- show a subtle movement pad in the lower-left corner;
- use the movement pad for analog forward/back/strafe movement;
- drag on the canvas to look around;
- keep the Exit button available;
- keep the artwork focus/info behavior active.

Desktop behavior remains:

- pointer-lock mouse look;
- WASD/arrow movement;
- Esc/Exit close behavior;
- control card fadeout after movement/mouse use.

## Implementation notes

- `galleryController.ts` now determines `desktop` vs `touch` input mode when the gallery opens.
- `renderSite.ts` includes a hidden `#galleryTouchControls` layer that becomes visible only in touch mode.
- `GalleryScene.ts` accepts an input mode and exposes `setTouchMovement()` / `clearTouchMovement()` for the touch controller layer.
- `movementController.ts` now supports analog local X/Z input in addition to keyboard state.
- `lookController.ts` keeps desktop pointer lock but adds touch drag-to-look when `inputMode` is `touch`.
- `global.css` adds the quiet touch-control surface and touch-mode panel placement.

## Deferred tuning

Real-device testing should determine whether to adjust:

- movement speed;
- touch look sensitivity;
- thumb pad radius/position;
- safe-area spacing on notched devices;
- whether the look hint should auto-fade after first use;
- whether the artwork info panel should use a different touch-mode position.
