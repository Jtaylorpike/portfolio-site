# Phase 6E — Mobile Gallery Responsiveness Tuning

Date: 2026-05-18

## Purpose

Phase 6E is a narrow follow-up to Phase 6A/6B mobile gallery controls. Real-phone testing confirmed that the mobile controls work, but the movement and camera feel can be slightly more responsive.

This pack tunes responsiveness only. It does not change gallery layout, artwork placement, collision rules, plaque metadata, lighting, image data, About/contact layout, or local-editor save behavior.

## Changes

- Increased touch drag-look sensitivity from `0.0034` to `0.0041`.
- Increased the maximum touch-look delta clamp from `44` to `52` pixels.
- Increased touch-only movement speed multiplier from `0.82` to `0.94`.
- Reduced analog movement dead zone from `0.14` to `0.10`.
- Changed analog response curve from `1.12` to `1.02` so input feels closer to linear.
- Reduced effective movement-pad vector radius from `0.36` to `0.33`, making normal thumb travel produce a stronger movement vector.

## Manual QA

After deploying the dev branch, test on a real phone:

1. Open the public gallery.
2. Confirm drag-to-look feels more responsive but not jumpy.
3. Confirm the left thumb movement pad starts movement with less thumb travel.
4. Confirm full forward/back/strafe speed is still controlled enough to inspect images and plaques.
5. Confirm the Exit button and artwork info card remain usable.
6. Confirm desktop WASD/mouse-look behavior is unchanged.
