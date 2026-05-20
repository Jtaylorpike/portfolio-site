# Phase 7E — SEO and Lighthouse Closeout

Date: 2026-05-18

## Purpose

Phase 7E closes the SEO/discoverability and launch-readiness infrastructure phase after the Phase 7D navigation font-size cleanup was accepted.

This is a documentation-only closeout. It does not change runtime code, CSS, editor behavior, image data, routing, gallery behavior, public copy, favicon/logo assets, or social preview assets.

## Accepted closeout baseline

Latest local production-preview Lighthouse baseline after Phase 7D:

```text
Performance: 98
Accessibility: 100
Best Practices: 93
SEO: 100
FCP: 1.5s
LCP: 2.3s
Speed Index: 1.5s
TBT: 0ms
CLS: 0
TTI: 2.3s
```

The navigation font-size warning cleanup worked: primary site navigation is no longer in the small-font warning list. Remaining small-font warnings are intentional homepage/editorial microtype and should stay deferred unless the user chooses to broaden the visual/accessibility scope later.

## Phase 7 completed work

- SEO metadata centralized in `src/data/siteSeo.json` and normalized in `src/data/siteSeo.ts`.
- Route-aware metadata updates added through `src/app/seoController.ts` and `src/app/siteRouter.ts`.
- Canonical/search baseline set to `https://taylorpike.com/`.
- `public/robots.txt` and `public/sitemap.xml` added for the intended public domain.
- Repeatable Lighthouse runner added at `scripts/Run-LighthouseBaseline.ps1`.
- Homepage `View Portfolio` accessible-name/touch-target issue fixed.
- Current first-hero LCP image preload hints added.
- Primary navigation type raised to the Lighthouse 12px mobile legibility threshold.

## Routing decision

Keep hash routing for now.

The current evidence does not justify moving away from hash routing:

- latest SEO score is 100;
- latest accessibility score is 100;
- latest performance score is 98;
- root canonical/domain metadata is correct for `https://taylorpike.com/`;
- the user prefers the speed and simplicity of hash routing.

Revisit real routes or prerendering only if deployed-domain data, Google Search Console evidence, or launch requirements show a clear indexing need.

## Deferred items

Deferred by user preference:

- favicon/logo/app-icon work until after logo redesign;
- social preview image work until after logo redesign;
- final SEO copy polish until the user writes final launch copy.

Deferred by roadmap placement:

- homepage thumbnail rendition efficiency until the pre-launch image pipeline/performance pass after final image/gallery/homepage curation;
- final image alt text/content metadata pass until launch curation is closer;
- final gallery/homepage/About image curation until pre-launch content work.

## Next phase

Historical Phase 7E note: Phase 8 was the next future phase at closeout time. Current project status is superseded by the active handoff docs; Phase 8 is now active and Phase 8B has implemented the first materials/lighting foundation.

Phase 8 should be careful, incremental work that preserves collision behavior, wall placement, plaque fallback logic, gallery curation/editor data flow, and accepted mobile controls.
