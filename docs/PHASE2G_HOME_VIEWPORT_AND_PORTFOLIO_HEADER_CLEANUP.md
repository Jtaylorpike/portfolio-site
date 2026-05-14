# Phase 2G — Home Viewport Fit and Portfolio Header Cleanup

Generated: 2026-05-13

## Purpose

This pack keeps the current public-site direction narrow and cleanup-focused. It responds to the visual review that the hero-only homepage should not require scrolling on a normal 1920x1080 desktop viewport, and that the portfolio/index heading had two unnecessary elements: a red accent underline and an extra `Open gallery room` button.

## Changes

### Homepage viewport fit

- Removed the remaining bottom padding from the hero-only homepage route.
- Added desktop viewport-fit overrides for the home route so the hero-only page uses the available viewport height instead of creating extra space below the hero.
- Tightened desktop hero stage height and thumbnail-strip height slightly so the hero, index rail, metadata panel, and thumbnail strip can fit more cleanly inside common desktop viewports.
- Kept mobile and tablet behavior scroll-friendly.

### Portfolio/index header cleanup

- Removed the `Open gallery room` button from the portfolio meta strip.
- Left gallery entry available through the global top navigation and the homepage hero CTA.
- Removed the red accent underline from the portfolio page heading.
- Kept the neutral heading border and metadata counters.

## Files changed

- `src/app/sitePages.ts`
- `src/styles/global.css`

## Intentional non-changes

- No public website copy was changed.
- No About page copy was changed.
- No editor files were changed.
- No image data was changed.
- No gallery curation or room data was changed.
- No virtual gallery mechanics were changed.
- No mobile gallery controls were added in this phase.

## Manual review checklist

After applying this pack, review:

1. Home route on a 1920x1080 viewport: it should not need vertical scrolling in the current hero-only state.
2. Home route on smaller laptop widths/heights: the hero should remain usable and should not feel cramped.
3. Mobile home route: scrolling should still work naturally if the content needs more height.
4. Portfolio route: the red accent underline should be gone.
5. Portfolio route: the meta strip should show only the counters.
6. Global Gallery nav button: it should remain the main gallery entry outside of the homepage hero CTA.

## Validation

The available production build was run successfully:

```powershell
npm run build
```

A Playwright browser-level viewport check was attempted in the sandbox, but browser binaries were not installed in this environment. Final visual confirmation should be done in the local project with the real runtime image folders present.
