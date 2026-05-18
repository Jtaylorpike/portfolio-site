# Phase 7C — Lighthouse Accessibility + LCP Cleanup

Date: 2026-05-18

## Summary

Phase 7C is a narrow Lighthouse cleanup pack based on the user's local Lighthouse report from the Phase 7B baseline.

The report baseline was strong enough to keep the current hash-router architecture:

```text
Performance:     99
Accessibility:   96
Best Practices:  93
SEO:            100
```

The SEO score being 100 means there is no current Lighthouse-backed reason to replace hash routing before launch. Hash routing should remain in place unless later Search Console or deployed-domain evidence shows a real indexing problem.

## Runtime changes

### Homepage portfolio CTA accessibility

The homepage `View Portfolio` link previously used a changing `aria-label` such as `View Climbing portfolio`, while its visible text remained `View Portfolio`. Lighthouse flagged that as a visible-label/accessible-name mismatch.

Phase 7C changes the link so:

- the visible text remains `View Portfolio`;
- the category context is preserved as screen-reader-only text;
- the link no longer needs a mismatched `aria-label`;
- the link's accessible name now starts with the visible label;
- the click/touch target is enlarged without adding a visible button background.

### LCP image discovery

The report identified the first homepage hero image as the LCP element. On mobile Lighthouse, that resolves to the mobile-preferred thumb rendition:

```text
/images/portfolio/thumb/raining-choss.webp
```

Phase 7C adds static preloads for the current first hero image:

```text
/images/portfolio/thumb/raining-choss.webp     # max-width: 700px
/images/portfolio/display/raining-choss.webp   # min-width: 701px
```

This keeps the existing hash router and carousel architecture intact while letting the browser discover the first hero image before the TypeScript app finishes booting.

## What was intentionally not changed

- No hash-router replacement.
- No real-route/prerender migration.
- No favicon/logo/app-icon work.
- No social preview image work.
- No gallery plaque/card microtype changes.
- No thumbnail rendition pipeline changes.
- No public copy changes.
- No image curation changes.
- No editor behavior changes.

## Deferred thumbnail efficiency work

The Lighthouse report also flagged homepage thumbnail-strip images as larger than their displayed size. That should not be solved in Phase 7C.

Roadmap placement:

```text
Pre-launch image pipeline/performance pass,
after final portfolio/gallery/homepage image curation,
before final public launch.
```

Reason: thumbnail rendition sizes should be tuned once the final homepage and gallery image set is closer to launch, so the work is done once against the real content baseline.

## Validation completed

- `npm run build`
- Static source checks for:
  - no remaining `aria-label="View ... portfolio"` homepage CTA pattern;
  - presence of `data-hero-link-context`;
  - presence of `.sr-only` utility;
  - presence of mobile and desktop first-hero preloads;
  - no favicon/logo/social-preview additions.
- `unzip -t`

## Follow-up

After applying this pack, run:

```powershell
.\scripts\Run-LighthouseBaseline.ps1
```

Expected result: accessibility should improve from the fixed CTA label/touch target, and the LCP preload warning may improve or disappear. If Lighthouse still flags font-size issues, handle only core public UI labels if they are a real usability issue; do not enlarge gallery archival microtype just to satisfy the audit.
