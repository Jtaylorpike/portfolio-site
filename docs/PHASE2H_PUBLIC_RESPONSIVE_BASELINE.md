# Phase 2H — Public Responsive Baseline

Generated: 2026-05-13

## Purpose

This pack tightens the existing public-site responsive behavior after the homepage was simplified to a hero-only route and the portfolio/index heading was cleaned up.

The goal is a small public polish pass, not the future mobile 3D gallery controls phase.

## Files changed

- `src/styles/global.css`
- `docs/PHASE2H_PUBLIC_RESPONSIVE_BASELINE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PUBLIC_SITE_POLISH_AUDIT.md`
- `PROJECT_CHANGELOG_APPEND_20260513_PHASE2H_PUBLIC_RESPONSIVE_BASELINE.md`

## Changes

- Tightened shared public header and main-shell width on tablet and phone.
- Improved mobile home hero sizing after the hero-only simplification.
- Made the hero thumbnail strip horizontally scroll on small phones instead of consuming too much vertical space.
- Improved touch scrolling behavior for the hero index rail and portfolio category rail.
- Kept the portfolio meta strip as the three simple counters only.
- Added small-screen safeguards for long contact links.
- Adjusted mobile lightbox controls so previous/next buttons stay inside the viewport instead of hanging off the image frame.
- Reduced hover-only lift behavior on coarse pointer/touch devices.

## Explicit non-goals

This pack does not:

- change public website copy
- change About page copy
- redesign the About/contact page
- add mobile movement controls to the 3D gallery
- change virtual gallery mechanics
- change editor files
- change image data
- change gallery curation or room data

## Manual checks

After applying, check:

- Home route at phone, tablet, and desktop widths
- Home hero thumbnail strip on phone
- Portfolio category rail on phone
- Portfolio meta strip on phone
- Portfolio lightbox previous/next/close controls on phone
- About/contact email wrapping on narrow widths

