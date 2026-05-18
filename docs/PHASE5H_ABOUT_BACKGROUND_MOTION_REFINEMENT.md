# Phase 5H — About Background Motion Refinement

Date: 2026-05-16

## Purpose

Make the public About/contact background-photo motion more restrained after visual review. The previous background floats were correctly positioned, but their scroll-linked movement was too noticeable.

## Changes

- Reduced background-float vertical parallax speeds substantially.
- Reduced background-float horizontal drift speeds substantially.
- Removed the sinusoidal lateral wobble from the scroll-motion controller so the floats no longer feel like they are actively animating across the page.
- Tightened the scroll-motion caps from large movement bounds to small atmospheric offsets.
- Preserved the Phase 5F viewport-wide background-float breakout and the Phase 5G bottom-margin correction.
- Kept About editor behavior, About photo data schema, foreground collage layout, copy placeholders, public portfolio behavior, and 3D gallery behavior unchanged.

## Files changed

```text
src/app/sitePages.ts
src/app/siteInteractionsController.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE5H_ABOUT_BACKGROUND_MOTION_REFINEMENT.md
docs/pack-notes/PACK_NOTES_PHASE5H.md
docs/pack-manifests/PACK_MANIFEST_PHASE5H.txt
PROJECT_CHANGELOG.md
```

## Validation

- Ran a TypeScript/build validation with `npm run build` successfully.
- Ran static source checks for the new About motion speeds and the removed sine drift.
- Verified the generated zip with `unzip -t`.

## Manual test

1. Apply the replacement files.
2. Open the public About/contact page on desktop.
3. Scroll slowly from the top of the page to the Contact section.
4. Confirm the low-opacity background photos now feel nearly fixed to the page, with only slight parallax movement.
5. Confirm the photos no longer wobble side-to-side during scroll.
6. Confirm the background photos still spill beyond the viewport edges and keep margin above the bottom of the page.
