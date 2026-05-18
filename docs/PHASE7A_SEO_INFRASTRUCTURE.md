# Phase 7A — SEO Infrastructure Baseline

Date: 2026-05-18

## Summary

Phase 7A starts the SEO/discoverability phase by adding metadata infrastructure and crawl/indexing baseline files.

This pack intentionally avoids final launch-copy decisions. The current text is functional metadata scaffolding that can be edited later once public copy, image curation, and launch positioning are final.

## Runtime changes

- Added `src/data/siteSeo.json` as the editable metadata source.
- Added `src/data/siteSeo.ts` as the typed fallback/normalization layer.
- Added `src/app/seoController.ts` for route-aware metadata updates.
- Updated `src/app/siteRouter.ts` so route changes call the SEO controller.
- Updated `index.html` with canonical, Open Graph URL/locale, absolute social preview image URLs, and an ID on the JSON-LD script so the runtime controller can update it cleanly.
- Added `public/robots.txt`.
- Added `public/sitemap.xml`.

## Hash-route note

The site still uses hash routing. Hash routes do not behave like independent crawlable pages. The sitemap currently lists only the canonical GitHub Pages project root. Route-aware metadata exists for browser context, future migration, and general polish.

## Validation

- `npm run build`
- TypeScript compile through the production build
- Vite production build
- Static checks for SEO controller wiring and crawl files
- `unzip -t`
