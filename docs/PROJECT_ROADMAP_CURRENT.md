# Taylor Pike Portfolio — Current Roadmap

Updated: 2026-05-15

## Current project state

The portfolio has exited the public polish phase and is now in **Phase 3: portfolio content, image, and metadata curation**.

The public design baseline is stable. The user is happy with the current portfolio direction. Future work should avoid broad visual churn unless a specific problem is identified.

## Source of truth rules

```text
1. Fresh uploaded current source files are the source of truth.
2. docs/ contains human-readable continuity and should be kept current.
3. PROJECT_CHANGELOG.md records durable project history.
4. Memories and older handoffs are backup context only.
5. If source conflicts with older docs/memory, follow source.
```

Active data lives in `src/data/`. Do not restore `public/data/` as active data.

Active runtime images live under:

```text
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/portfolio/texture/
public/images/portfolio/full/
public/images/ui/cards/
```

There is no active `public/images/logo/` folder.

## Phase 0 — Editor map whitespace closure

Status: complete.

The gallery map whitespace issue was fixed and confirmed by the user. Treat this as closed unless new visual evidence appears.

## Phase 1 — Public-site audit

Status: complete.

The audit established that the overall public design direction works and should be refined rather than redesigned.

## Phase 2 — Public polish

Status: complete.

Phase 2 completed the current public presentation baseline:

- homepage hero-only simplification;
- desktop homepage viewport-fit cleanup;
- narrow VCR/pixel accent use;
- portfolio/index header cleanup;
- removal of unnecessary gallery CTA from portfolio meta strip;
- global nav and interaction polish;
- mobile public-page spacing cleanup;
- mobile hero performance fix;
- lightbox accessibility and mobile swipe polish.

Phase 2 should not continue unless the user reports a specific public UI issue.

## Phase 3 — Content, image, and metadata curation

Status: active.

Current goals:

1. Import and organize final/near-final photos.
2. Hide/remove weaker or test images.
3. Assign categories.
4. Add metadata: title, category, year, location, and alt text.
5. Select final hero slides.
6. Select final 3D gallery images.
7. Validate and commit stable content batches.

The user may only partially finish metadata before launch preparation; this is expected.

## Phase 4 — Editor curation controls

Status: future.

Potential scope:

- public hide/show toggle for images;
- bulk selection;
- bulk hide/show;
- bulk category change;
- bulk hero-candidate mark/clear;
- possible gallery eligibility controls;
- import review remove buttons;
- clearer import button wording;
- import progress bar and log text;
- category creation from dropdown;
- rename ID + rendition state-refresh bug fix.

This should remain separate from public-site polish.

## Phase 5 — About/contact redesign

Status: future.

The user wants to redesign this page with personal photos cascading in the background and text blocks about:

- themselves;
- the project;
- their career journey so far;
- photography.

The user wants to write the actual page copy. Do not generate final About copy unless asked.

## Phase 6 — Mobile 3D gallery controls

Status: future.

The 3D gallery should eventually be viewable on mobile using touch movement controls similar to Minecraft mobile and drag-to-look camera controls.

The current public mobile pass did not implement this. It only improved the public site and mobile hero performance.

## Phase 7 — SEO/discoverability and launch pass

Status: future.

Dedicated SEO should happen after public structure and content are closer to final.

Scope should include:

- page titles;
- meta descriptions;
- Open Graph/social previews;
- structured data;
- alt text review;
- semantic headings;
- performance;
- image loading;
- indexing behavior;
- sitemap/robots if needed;
- GitHub Pages deployment behavior;
- public copy completeness.

## Phase 8 — Advanced 3D gallery expansion

Status: future.

Long-term direction: museum/private archive feeling.

Potential future work:

- larger gallery room;
- less square/non-rectangular room layouts;
- corridors or alcoves;
- archive-room direction;
- window wall/time-of-day concept;
- formalized room model from `galleryRoom.json`;
- careful preservation of collision, wall placement, plaque fallback, and editor curation logic.
