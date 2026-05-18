# Phase 5G — About Lower Collage Frame and Bottom Float Margin

Date: 2026-05-16

## Purpose

Address the latest visual review screenshots for the public About/contact page.

The requested correction was narrow: remove the visible outline around the lower foreground collage container and keep the lowest background-float images from touching the bottom edge of the page.

## Changes

- Removed the visible border/background treatment from the lower collage container, while preserving the individual photo frames and their placement.
- Increased the bottom offset for the lowest background-float images so they retain visible page-bottom margin even with scroll-linked drift.
- Kept the Phase 5F viewport-wide background-float breakout intact.
- Kept the About editor, About photo data schema, foreground collage records, copy placeholders, public portfolio page, and 3D gallery behavior unchanged.

## Files changed

```text
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE5G_ABOUT_LOWER_COLLAGE_AND_BOTTOM_FLOAT_MARGIN.md
docs/pack-notes/PACK_NOTES_PHASE5G.md
docs/pack-manifests/PACK_MANIFEST_PHASE5G.txt
PROJECT_CHANGELOG.md
```

## Validation

- Ran a CSS brace-balance check.
- Ran `npm run build` successfully.
- Verified the generated zip with `unzip -t`.

## Manual test

1. Open the public About/contact page on desktop.
2. Scroll to the lower foreground collage and confirm the large rectangular container outline behind the photos is gone.
3. Confirm individual foreground photo frames still render normally.
4. Scroll to the Contact section and bottom of the page.
5. Confirm the low-opacity background photos no longer touch the bottom edge of the page and keep visible margin.
6. Confirm the background photos still spill horizontally beyond the browser edges where intended.
