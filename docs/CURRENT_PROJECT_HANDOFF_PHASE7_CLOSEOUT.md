# Taylor Pike Portfolio — Phase 7 Closeout Handoff

Updated: 2026-05-18

## Phase status

Phase 7 is complete/closed as of Phase 7E.

Phase 7 covered SEO/discoverability infrastructure, the final public-domain SEO baseline, repeatable Lighthouse checks, and narrow report-backed accessibility/readability/LCP cleanup. It did not complete final public launch copy, favicon/logo assets, social preview assets, final image curation, or final gallery curation.

## Completed Phase 7 baseline

```text
src/data/siteSeo.json
src/data/siteSeo.ts
src/app/seoController.ts
src/app/siteRouter.ts
index.html
public/robots.txt
public/sitemap.xml
scripts/Run-LighthouseBaseline.ps1
```

## Phase 7A completed

- Centralized site metadata in `src/data/siteSeo.json`.
- Normalized metadata through `src/data/siteSeo.ts` so missing or malformed values fall back safely.
- Updated `document.title`, description, robots, canonical, Open Graph, Twitter card, and JSON-LD metadata when the hash route changes.
- Added stronger static baseline metadata in `index.html` for crawlers and social preview tools that do not execute the app.
- Added baseline crawl/index files under `public/`.

## Phase 7B completed

- Updated the intended public domain to `https://taylorpike.com/`.
- Updated `siteSeo.json`, `siteSeo.ts`, `index.html`, `robots.txt`, and `sitemap.xml` so active SEO/crawl files no longer point to the temporary GitHub Pages project URL.
- Added `scripts/Run-LighthouseBaseline.ps1` to run local production-preview Lighthouse checks or deployed-domain Lighthouse checks.
- Documented that the sandbox could not produce a trustworthy Lighthouse score because Chromium local navigation is blocked by the environment.
- Completed static SEO validation against the production `dist/` output.

## Phase 7C completed

- Reviewed the user's local Phase 7B Lighthouse baseline: Performance 99, Accessibility 96, Best Practices 93, SEO 100.
- Kept hash routing because the root SEO score was already 100 and there was no Lighthouse-backed reason for a real-route migration.
- Fixed the homepage `View Portfolio` CTA accessible-name mismatch by replacing the mismatched changing `aria-label` with visible text plus screen-reader-only category context.
- Increased the homepage portfolio CTA touch target while keeping the existing quiet editorial visual treatment.
- Added static first-hero image preloads for the current mobile and desktop LCP candidates.
- Deferred homepage thumbnail rendition efficiency work to a pre-launch image pipeline/performance pass after final image/gallery/homepage curation.

## Phase 7D completed

- Raised primary public-site navigation font sizing to the 12px Lighthouse mobile legibility threshold.
- Preserved the quiet uppercase editorial nav treatment with tighter tracking.
- Left gallery plaque/card type, homepage metadata microtype, homepage thumbnail microtype, favicon/logo/social-preview work, hash routing, and thumbnail rendition work out of scope.

## Phase 7E closeout baseline

The user's post-Phase 7D local Lighthouse report is accepted as the Phase 7 closeout baseline:

```text
Performance: 98
Accessibility: 100
Best Practices: 93
SEO: 100
FCP: 1.5s
LCP: 2.3s
Speed Index: 1.5s
Total Blocking Time: 0ms
Cumulative Layout Shift: 0
Time to Interactive: 2.3s
```

Phase 7E makes no runtime code, CSS, data, image, routing, editor, or public-copy changes. It only updates documentation, pack notes, manifests, and changelog state.

## Hash-routing position

The site currently uses hash routes. Routes such as `#/portfolio` and `#/about` are not separate crawlable server paths.

Current decision:

```text
Keep hash routing for now.
```

Rationale:

- The user currently prefers the performance and simplicity of the hash router.
- The root document has the correct `https://taylorpike.com/` canonical/search baseline.
- The latest local Lighthouse SEO score is 100.
- A real-route/prerender migration should only happen after production Lighthouse, Search Console, deployment, or launch requirements show it is worth the architectural churn.
- Route-aware metadata remains centralized, so a future migration is still possible.

## Lighthouse workflow

Local production-preview Lighthouse baseline:

```powershell
.\scripts\Run-LighthouseBaseline.ps1
```

Deployed-domain Lighthouse baseline after DNS/deploy are ready:

```powershell
.\scripts\Run-LighthouseBaseline.ps1 -Url https://taylorpike.com/
```

Reports are written to:

```text
asset-reports/lighthouse/
```

That folder is ignored by git.

## Deferred by user preference or roadmap placement

Do not reopen Phase 7 for these unless the user asks:

- favicon/logo update;
- app-icon update;
- final social preview image asset;
- final launch metadata copy rewrite;
- final image alt-text/content curation;
- final gallery curation;
- homepage thumbnail rendition efficiency before final image/homepage/gallery curation;
- hash-router replacement without deployment/Search Console evidence.

## Next available phase

Historical Phase 7 note: at Phase 7 closeout, Phase 8 had not yet started. Current project status is superseded by `docs/CURRENT_PROJECT_HANDOFF.md` and `docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md`; Phase 8 is now active and Phase 8B has implemented the first materials/lighting foundation.

Phase 8 should preserve the accepted gallery/editor foundations: collision behavior, wall placement, plaque fallback, gallery curation data flow, and mobile touch controls.

Final public copy remains user-authored unless the user explicitly asks for draft copy.
