# Phase 5F — About Background Float Viewport Breakout

Date: 2026-05-16

## Summary

Phase 5F corrects the About/contact background-float layer after visual review showed that the red/background images were still constrained to the centered content column instead of behaving like page-wide atmospheric images.

The background-float layer is now rendered as a sibling of the About page `main` element inside the About site shell, rather than inside `.modern-about-page`. This lets the float layer use the full browser viewport width while the existing copy blocks and foreground collage remain constrained to the normal content column.

## Public About page behavior

- The transparent background images are no longer locked to the centered `.modern-main` container.
- The float layer spans the page shell/viewport width.
- Edge floats intentionally spill past the left and right browser edges.
- One float remains slightly off-center toward the middle of the page.
- Horizontal page overflow is clipped at the About site shell so the large floats do not create sideways scrolling.
- Scroll-linked movement still applies to the background floats after moving the layer outside `main`.

## Files changed

- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `src/styles/global.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE5F_ABOUT_FLOAT_VIEWPORT_BREAKOUT.md`
- `docs/pack-notes/PACK_NOTES_PHASE5F.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE5F.txt`
- `PROJECT_CHANGELOG.md`

## Validation

- `npm ci --ignore-scripts`
- CSS brace-balance check
- `npm run build`
- Static structure check confirming the float layer renders outside `.modern-about-page`
- Static structure check confirming About scroll-motion targeting now includes the full About site shell
- `unzip -t`

A headless Chromium visual check was attempted in the sandbox, but local/file navigation was blocked by the environment. The code/build/static validation passed.

## Non-goals

This pack does not change:

- About image data schema;
- About editor controls;
- foreground upper/lower collage behavior;
- final About/contact copy;
- public portfolio behavior;
- gallery curation behavior;
- Three.js runtime behavior;
- wall placement, collision, or plaque fallback logic.
