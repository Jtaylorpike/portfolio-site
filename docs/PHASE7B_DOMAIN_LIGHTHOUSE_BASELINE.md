# Phase 7B — Domain + Lighthouse Baseline Prep

Date: 2026-05-18

## Summary

Phase 7B updates the SEO canonical baseline from the temporary GitHub Pages project URL to the intended public domain:

```text
https://taylorpike.com/
```

This pack keeps hash routing intact. The current decision is to defer any route architecture change until production Lighthouse/deployment testing gives a concrete reason to move away from the current hash-router approach.

## Runtime changes

- Updated `src/data/siteSeo.json` so `siteUrl` is `https://taylorpike.com/`.
- Updated the fallback `siteUrl` in `src/data/siteSeo.ts`.
- Updated static canonical, Open Graph URL/image, Twitter image, and JSON-LD URLs in `index.html`.
- Updated `public/robots.txt` to point to `https://taylorpike.com/sitemap.xml`.
- Updated `public/sitemap.xml` to list `https://taylorpike.com/`.
- Added `scripts/Run-LighthouseBaseline.ps1` for repeatable local/deployed Lighthouse checks.

## Lighthouse status from this environment

A production build completed successfully. A true Lighthouse browser run against the local preview server could not be trusted from this sandbox because Chromium navigation to the local preview URL is blocked by the environment with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Earlier Lighthouse output therefore showed `chrome-error://chromewebdata/` and should not be used as a real SEO score.

Because of that sandbox limitation, Phase 7B uses static validation here and provides a repeatable Lighthouse script for the user machine or deployed URL.

## Static SEO validation completed

The production `dist/` output was checked for the crawl basics that Lighthouse's SEO category expects on the root document:

- `<title>` present.
- Meta description present.
- Canonical link uses `https://taylorpike.com/`.
- Open Graph URL uses `https://taylorpike.com/`.
- JSON-LD structured-data URL uses `https://taylorpike.com/`.
- `robots.txt` points to `https://taylorpike.com/sitemap.xml`.
- `sitemap.xml` lists `https://taylorpike.com/`.
- No active SEO file still points to the old GitHub Pages project URL.

## Build-size baseline from this upload

The source upload used for this pack does not include the full runtime image set, so this is a code/CSS/HTML bundle baseline, not a complete final production payload audit.

```text
dist/assets/galleryTextureLoader-BY5daPw3.js   500.83 kB / 124.96 kB gzip
dist/assets/index-DRv6F56Z.js                  133.66 kB /  27.52 kB gzip
dist/assets/index-CBRSvE3T.css                  81.25 kB /  14.51 kB gzip
dist/assets/GalleryScene-DgRUW_RS.js            22.97 kB /   6.71 kB gzip
dist/index.html                                  3.01 kB /   0.88 kB gzip
```

The largest code file is the texture loader chunk. That is expected for the current Three.js/gallery pipeline and should be reviewed in the later performance phase only if Lighthouse or real-device testing shows an actual problem.

## How to run Lighthouse after applying this pack

For local production-preview testing:

```powershell
.\scripts\Run-LighthouseBaseline.ps1
```

For the deployed public domain after DNS/deploy is ready:

```powershell
.\scripts\Run-LighthouseBaseline.ps1 -Url https://taylorpike.com/
```

Reports are written under:

```text
asset-reports/lighthouse/
```

That folder is ignored by git.

## Hash-routing decision

No route change is recommended from Phase 7B alone.

Current recommendation:

```text
Keep hash routing for now.
```

Reasons:

- The site's root document now has the correct canonical public-domain baseline.
- The current architecture performs well and keeps deployment simple.
- A hash-to-real-route migration would be architectural churn and should be justified by real deployment data, Search Console data, or a clear route-level indexing requirement.
- Portfolio, About, and Gallery route metadata is still centralized and can support a later prerender/real-route migration if needed.

## Deferred intentionally

- No favicon/logo update.
- No app-icon update.
- No new social preview image asset.
- No final launch metadata copy rewrite.
- No hash-router replacement.
- No visual design change.
