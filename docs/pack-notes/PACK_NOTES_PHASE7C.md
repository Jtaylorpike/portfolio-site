# Pack Notes — Phase 7C Lighthouse Accessibility + LCP Cleanup

## Purpose

Fix the remaining low-risk Lighthouse issues that are worth addressing now, while preserving hash routing and deferring launch-branding/image-pipeline work.

## Included changes

- Removes the mismatched homepage `View Portfolio` CTA `aria-label` pattern.
- Adds screen-reader-only category context to the CTA so the accessible name includes the visible label.
- Enlarges the CTA touch target without making it look like a new button.
- Adds static first-hero image preloads for the current mobile and desktop LCP candidates.
- Updates Phase 7 handoff/roadmap documentation.

## Explicitly not included

- No hash-routing migration.
- No favicon, logo, app-icon, or social-preview asset work.
- No gallery microtype changes.
- No thumbnail rendition pipeline change.
- No public copy or image curation change.

## Manual check after applying

1. Run `npm run build`.
2. Run `./scripts/Run-LighthouseBaseline.ps1`.
3. Confirm the homepage `View Portfolio` link still looks visually consistent.
4. Confirm the link still routes to the active hero slide's portfolio category.
