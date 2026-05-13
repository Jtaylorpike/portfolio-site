# Phase 2C — Portfolio Index Polish

Generated: 2026-05-13

## Purpose

Phase 2C tightens the public portfolio/index route so it feels more like an intentional archive layer and less like a generic masonry grid.

This pass does not attempt to finalize the portfolio content. The user still expects to add more final images and metadata through the editor before launch, so this phase focuses on structure, hierarchy, spacing, and metadata presentation using the data that already exists.

## Scope

Changed files:

- `src/app/sitePages.ts`
- `src/styles/global.css`
- `docs/PHASE2C_PORTFOLIO_INDEX_POLISH.md`
- `docs/PUBLIC_SITE_POLISH_AUDIT.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`

## What changed

### Category sidebar

The portfolio category sidebar now exposes a small count for each category filter. These counts are generated from `src/data/galleryImages.json`; they are not hard-coded.

The sidebar keeps the existing route/filter behavior:

- `All Work` points to `#/portfolio`
- category filters point to `#/portfolio/{category}`
- filter clicks still route through the hash router

### Image card metadata

Portfolio cards now separate the category label from the title and optional metadata details.

Card metadata now follows this structure:

- category label
- image title
- optional location/year line, only when those values exist in the image record

This avoids showing placeholder-like fallback text on every card while still surfacing useful image metadata when available.

### Grid and hover polish

The portfolio grid received CSS-only refinements for:

- archive/card rhythm
- image-card border and background treatment
- hover/focus lift
- card index readability
- card metadata spacing
- subtle guide-line/detail treatment
- mobile and tablet category-filter behavior

### Lightbox caption polish

The fullscreen image lightbox caption received a small hierarchy pass:

- caption top rule
- clearer counter width
- small frame guide line around the image stage
- improved single-column caption layout on narrow screens

## What did not change

This phase intentionally did not change:

- public website copy
- About page copy
- image data
- gallery curation data
- gallery room data
- editor files
- image import/removal workflows
- 3D gallery behavior
- hero carousel behavior
- route behavior

## Copy policy

The user wants to create the final website copy personally. Phase 2C did not replace major public copy. It only changed how existing image metadata is displayed.

## Validation

Commands run:

```powershell
npm run build
node scripts/validate-portfolio-image-data.mjs --project-root .
```

Result:

- Build: passed
- Image-data validation: 0 errors, 1 warning

The remaining warning is the already-known active placed gallery wall slot without assigned artwork. It is unrelated to this portfolio/index polish pass.

## Manual review checklist

After applying the pack, review:

- `#/portfolio` on desktop
- each category route
- portfolio card hover/focus states
- category sidebar sticky behavior
- mobile horizontal category filter behavior
- image lightbox caption layout
- image lightbox previous/next buttons

## Next recommended phase

Move to Phase 2D: Gallery entry CTA polish.

The goal of Phase 2D should be to make the virtual gallery feel like an intentional public experience and not a hidden experiment. It should review the entry page, homepage gallery CTA, portfolio page gallery CTA, and mobile/fallback guidance while preserving the user's final-copy ownership.
