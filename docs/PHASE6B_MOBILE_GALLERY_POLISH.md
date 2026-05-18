# Phase 6B — Mobile Gallery Polish

Date: 2026-05-18

## Summary

Phase 6B refines the Phase 6A mobile/touch gallery baseline so it is ready to push to a dev preview branch for real-phone testing.

This pass intentionally stays narrow. It does not change gallery curation data, wall placement, collision boxes, plaque fallback, lighting, textures, editor behavior, or public-page layout outside the gallery overlay.

## Public behavior refined

Touch/coarse gallery mode now has:

- a single clearer touch hint: `Drag to look · left thumb to move`;
- touch UI state tracking so the hint fades after the viewer starts interacting;
- a slightly smaller, quieter movement pad;
- safe-area-aware control placement for phone preview testing;
- capped artwork info-panel height and long-note clamping in touch mode;
- smaller, less dominant touch-mode crosshair treatment;
- compact landscape-phone safeguards;
- a more controlled touch look sensitivity;
- clamped touch look deltas to reduce accidental camera jumps;
- analog movement shaping with a dead zone and softer response curve;
- slightly reduced touch movement speed while leaving desktop movement unchanged.

## Implementation notes

- `galleryController.ts` now tracks first touch-look and touch-move interaction, then adds state classes to the touch-control layer so instructional UI can fade away.
- `renderSite.ts` updates the touch hint wording and adds a more explicit Exit button label.
- `lookController.ts` reduces touch look sensitivity and clamps unusually large touch deltas.
- `movementController.ts` shapes analog movement through a dead zone/curve and applies a touch-only movement speed multiplier.
- `global.css` adds Phase 6B overrides for touch control size, hint placement/fade, safe-area spacing, info-panel clamping, landscape-phone layout, and reduced-motion behavior.

## QA status

Validated by static/build checks in the pack environment. Real-device QA should happen from the dev preview branch rather than spending more time on local firewall/tunnel testing.

## Recommended dev-preview test

1. Apply Phase 6A and Phase 6B.
2. Push to the `dev` branch.
3. Open the dev deployment on an actual phone.
4. Confirm the gallery opens, moves, looks, and exits correctly.
5. Tune only concrete issues found on real hardware.
