# Taylor Pike Portfolio — Current Roadmap

Updated: 2026-05-15

## Current project state

The portfolio has exited the public polish phase and is now in Phase 3: content, image, and metadata curation.

The public design baseline is stable enough to stop broad polish churn. The editor is functional enough for current curation work, though several editor UX improvements are queued for a later dedicated pass.

## Source of truth rules

When continuing the project in any chat:

```text
1. Fresh uploaded current source files are the source of truth.
2. docs/ contains human-readable continuity and should be kept current.
3. PROJECT_CHANGELOG.md records durable project history.
4. Memories and older handoffs are backup context only.
```

Current active data lives in `src/data/`. Do not restore `public/data/` as active data.

Current active runtime images live under:

```text
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/portfolio/texture/
public/images/portfolio/full/
public/images/ui/cards/
```

There is no active `public/images/logo/` folder right now.

## Phase 0 — Editor map whitespace closure

Status: complete.

The gallery map whitespace issue was fixed and confirmed by the user. Do not reopen the editor map layout unless a new visible issue appears.

## Phase 1 — Public site audit

Status: complete.

The public site was audited before polish. Main conclusion: the overall design direction was working and needed refinement rather than a conceptual redesign.

## Phase 2 — Public site polish

Status: complete.

Completed work included:

```text
Public typography correction with VCR/pixel font scoped as a minor accent
Homepage hero polish
Homepage hero-only simplification
Removal of unnecessary below-hero UI
Portfolio index polish
Portfolio header cleanup
Removal of red underline and awkward gallery button from portfolio header
Global nav and public UI cleanup
Mobile public-site refinement
Mobile hero performance fix
Lightbox accessibility, focus, and swipe improvements
```

Do not continue adding Phase 2 polish unless the user identifies a specific visual or functional issue.

## Phase 3 — Content, image, and metadata curation

Status: active.

Primary work:

```text
Import the real image set.
Remove or hide weak/test images.
Assign categories.
Add titles, years, locations, and basic metadata.
Choose hero slides.
Choose 3D gallery images.
Validate and commit stable batches.
```

Recommended target size:

```text
Minimum viable portfolio: 18–24 photos
Strong complete portfolio: 30–45 photos
Probably too much for launch: 60+ photos
Hero slides: 5–8
3D gallery room: 12–18
```

Subcategories should not be added unless the user later feels the image set needs them. If added, prefer a light `series` or `collection` model rather than nested category navigation.

## Phase 4 — Alt text and metadata accessibility pass

Status: future.

After the image set is near-final, review every public-facing image and add concise, descriptive alt text. Use the actual images, not filenames alone. Avoid keyword stuffing or overly artistic descriptions.

Likely data targets:

```text
src/data/galleryImages.json
src/data/heroSlides.json if needed
public UI/card image references if relevant
```

## Phase 5 — About/contact redesign

Status: future.

The user wants a more intentional About/contact page with personal photos cascading in the background and text blocks about:

```text
the user
the project
the user's career journey
photography
```

Final copy must be written by the user. The project can provide layout structure, placeholder zones, and editing scaffolding, but not final prose unless explicitly requested.

## Phase 6 — Mobile 3D gallery controls

Status: future.

The 3D gallery should eventually remain viewable on mobile with a touch control schema, roughly:

```text
virtual movement controls similar to Minecraft mobile
drag-to-look camera controls
mobile-safe interaction affordances
```

This is separate from the completed public mobile layout pass.

## Phase 7 — SEO/discoverability and launch pass

Status: future.

Do this after content and copy are more final.

Scope:

```text
page titles
meta descriptions
Open Graph/social previews
structured data
image alt text
semantic headings
performance
sitemap/robots/canonical behavior if needed
GitHub Pages path behavior
indexing readiness
```

SEO should reflect the final site and final user-authored copy.

## Phase 8 — 3D gallery room expansion

Status: future.

Long-term design direction: museum/private archive, eventually possibly larger and less square, with corridors, alcoves, archive-room feeling, windows, or time-of-day-aware atmosphere.

Do not start this until the room model and validation are formal enough to avoid breaking:

```text
collision
wall placement
map editing
plaque fallback
camera bounds
lighting
performance
mobile controls
```

## Future editor tooling backlog

Separate future editor packs should cover:

```text
Import review remove button per card
Clearer “Import X photo(s)” button wording
Import progress bar
Import status/log text
Optional category creation from category dropdown
Hide/show public visibility per image
Bulk select image cards
Bulk hide/show
Bulk category edit
Bulk hero-candidate edit
Possible gallery eligibility controls
Rename ID + rendition state refresh bug fix
```

These are useful, but not blockers for continuing Phase 3 manually.
