# Pack Notes — Phase 5H About Background Motion Refinement

## Purpose

Make the public About/contact background-photo animation more subtle without changing the approved layout structure.

## Changes

- Slowed the background-float scroll-linked vertical movement.
- Slowed the background-float horizontal movement.
- Removed the sine-wave lateral wobble from the About scroll-motion controller.
- Reduced the maximum transform offset applied during scroll.
- Preserved the current viewport-wide float placement, edge spill, lower-collage frame removal, and bottom margin correction.

## Validation

- `npm run build` passed.
- Static source checks confirmed the reduced motion constants and removed sine drift.
- `unzip -t` passed on the delivery pack.

## Manual test

1. Apply the replacement files.
2. Open the About page.
3. Scroll through the page and confirm the background photos now read as almost static atmospheric images with only slight parallax movement.
4. Confirm there is no side-to-side wobble while scrolling.
