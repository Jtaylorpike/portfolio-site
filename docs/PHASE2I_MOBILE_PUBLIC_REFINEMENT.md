# Phase 2I — Mobile Public Refinement

Generated: 2026-05-13

## Purpose

This pack refines the mobile public-site baseline after phone-width visual review. It is a targeted responsive cleanup, not a new visual direction and not the future 3D-gallery mobile-controls phase.

## User-facing issues addressed

- Fast horizontal scrolling through mobile hero/image rails felt slower after the responsive baseline.
- The active visual-index marker rendered like a misplaced period near the previous number on mobile.
- `Visual Index` sat too close to the numeric rail on mobile.
- The mobile homepage hero contained too much copy and too many actions.
- The `Enter Virtual Gallery` homepage CTA took too much space on mobile and should remain hidden there even after mobile gallery controls exist.
- The mobile homepage metadata was too vertical and needed a more compact two-column layout where screen width allows.
- The gap between the shared nav and page content was too large on mobile, especially on the homepage and portfolio page.
- The portfolio category rail lost its horizontal scroll position when a category was selected.

## Files changed

- `src/styles/global.css`
- `src/app/siteInteractionsController.ts`
- `docs/PHASE2I_MOBILE_PUBLIC_REFINEMENT.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PUBLIC_SITE_POLISH_AUDIT.md`
- `PROJECT_CHANGELOG_APPEND_20260513_PHASE2I_MOBILE_PUBLIC_REFINEMENT.md`

## Implementation summary

### Mobile homepage hero

- Reduced mobile spacing between the top nav and the hero system.
- Hid `.home-hero-gallery-cta` on mobile so the home hero keeps only the portfolio CTA on phones.
- Hid `.home-hero-statement` on mobile so the hero keeps the lighter `Selected Work` / `View Portfolio` treatment.
- Kept desktop behavior unchanged.

### Mobile visual index

- Increased the separation between the `Visual Index` label and the numeric rail.
- Removed the mobile `::before` and `::after` active markers from hero index buttons because the old left-offset marker read like a misplaced dot/period beside the previous number in a horizontal rail.
- Kept active state visible through type color rather than extra mobile markers.

### Mobile metadata

- Kept hero metadata in two columns on normal phone widths to reduce vertical height.
- Falls back to one column only on very narrow screens.

### Mobile rail performance

- Removed scroll snapping from mobile hero/index/category rails.
- Reduced thumbnail hover/active transition cost on touch widths.
- Removed thumbnail image filter on mobile to reduce rendering overhead during fast horizontal movement.

### Portfolio category scroll memory

- Added session-storage-backed horizontal scroll memory for `.portfolio-category-sidebar`.
- The rail saves its `scrollLeft` while scrolling and immediately before category route changes.
- After the portfolio route re-renders, the rail restores its previous horizontal offset on the next animation frame.
- If session storage is unavailable, the rail still works normally without restoration.

## Non-goals

This pack does not:

- change public website copy
- change About page copy
- change editor files
- change image data
- change gallery curation or room data
- add mobile 3D gallery controls
- redesign the About/contact page

## Manual test checklist

1. Open the homepage at a phone-width viewport.
2. Confirm the nav-to-hero vertical gap is reduced.
3. Confirm the visual-index active state no longer looks like a stray period near the previous number.
4. Confirm `Visual Index` has better spacing above the numbers.
5. Confirm the mobile hero shows `Selected Work` and `View Portfolio`, but not the hero statement or `Enter Virtual Gallery`.
6. Confirm the hero metadata uses two columns on normal phone widths and one column on very narrow widths.
7. Confirm horizontal scrolling through the hero thumbnails feels less sticky.
8. Open the portfolio page at phone width.
9. Scroll the category rail horizontally, click a category, and confirm the rail restores its horizontal position after the route changes.
10. Confirm the About page top spacing is slightly tighter but not compressed as aggressively as home/portfolio.
