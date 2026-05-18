# Pack Notes — Phase 5F About Float Viewport Breakout

## Purpose

Fix the About/contact background-float layout so the transparent background images are not constrained by the centered content column. They should behave like viewport-level atmospheric elements, with most floats spilling beyond the browser edge while the foreground copy/collage layout remains unchanged.

## Changes

- Moved `renderAboutFloatingPhotos()` out of the About `main` element in `src/app/sitePages.ts`.
- Updated About scroll-motion logic so it still finds background float elements after they moved outside `.modern-about-page`.
- Added CSS overrides that make the About page shell the float positioning context.
- Set the float layer to span the full About page shell rather than the centered `.modern-main` width.
- Repositioned edge floats using viewport-based offsets.
- Kept one middle float slightly off-center.
- Added horizontal overflow clipping to the About page shell to avoid side-scroll.

## Validation

- Installed dependencies with `npm ci --ignore-scripts`.
- Ran CSS brace-balance validation.
- Ran `npm run build` successfully.
- Ran static structure checks for the new About DOM placement and motion selector.
- Verified the zip with `unzip -t`.

## Caveat

A headless Chromium visual check was attempted, but this sandbox blocked both local dev-server and file navigation. The pack therefore relies on build validation and static structural checks rather than a rendered browser screenshot from this environment.

## Manual test

1. Open the About page on desktop.
2. Confirm the red/background float images are no longer clipped to the central content width.
3. Confirm most background floats spill beyond the browser edge by a visible amount.
4. Confirm one background float still sits slightly off-center toward the middle of the page.
5. Scroll the About page and confirm the background floats still drift subtly.
6. Confirm there is no horizontal scrollbar caused by the large floats.
