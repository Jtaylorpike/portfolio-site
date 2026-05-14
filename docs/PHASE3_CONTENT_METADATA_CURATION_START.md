# Phase 3A — Portfolio Content + Metadata Curation Start

Date: 2026-05-14
Status: Phase 3 started
Scope: Documentation and workflow only

## Purpose

Phase 3 moves the Taylor Pike portfolio site from public-shell polish into actual portfolio content readiness. The site structure, homepage, navigation, portfolio index, lightbox behavior, mobile baseline, and public interaction layer are now stable enough to stop polishing the frame and begin curating the work inside it.

This phase should be slower and more deliberate than the previous public UI phase. The quality of this phase depends less on code changes and more on image selection, sequencing, metadata, category assignment, hero eligibility, and gallery placement decisions.

## Current assumption

The public site baseline is usable after Phase 2. Phase 3 should not reopen homepage, nav, portfolio shell, mobile spacing, or gallery-entry polish unless a specific issue is discovered while curating real content.

## What Phase 3 is for

Phase 3 is for:

- Choosing which photographs belong on the public site.
- Importing missing final image candidates through the editor/import pipeline.
- Removing or hiding placeholder/test/import-only images that should not be public.
- Filling useful metadata for selected images.
- Assigning appropriate categories.
- Deciding which images should be eligible for the homepage hero.
- Deciding which images belong in the 3D gallery room.
- Sequencing/weighting work so the public presentation feels curated rather than dumped.
- Creating a launch-ready minimum viable image set, even if the full archive is completed later.

## What Phase 3 is not for

Phase 3 is not for:

- Rewriting site copy.
- Generating About page text.
- Redesigning the homepage.
- Reworking the public navigation.
- Building mobile 3D controls.
- Expanding the 3D room model.
- Starting the dedicated SEO pass.

Those can happen later, but they should not interrupt the content curation pass unless they become blockers.

## User-authored copy rule

Final public copy should be authored by Taylor Pike. AI assistance may be used for structure, placeholders, checklists, implementation notes, or copy inventory, but not for final About page prose or final artist/project statements unless explicitly requested.

## Suggested Phase 3 workflow

### Step 1 — Inventory current image records

Use the local editor to review the current image set. For each image, decide whether it is:

- Keep public
- Keep but hide for now
- Replace later
- Remove as test/import noise
- Candidate for homepage hero
- Candidate for 3D gallery

Do not try to finish every metadata field on the first pass. The first pass should be about selection.

### Step 2 — Decide minimum launch set

Before trying to complete the full portfolio archive, define a smaller minimum launch set. A good minimum launch set is enough to make the site feel intentional without requiring every future image to be present.

Suggested target:

- 12–24 strong public portfolio images
- 5–8 hero-eligible images
- 8–16 gallery-room images
- 2–4 meaningful categories

The exact numbers can change, but the site should not launch with obviously placeholder content.

### Step 3 — Fill metadata for selected images

For public-facing image records, prioritize:

- Title
- Category
- Year, if known
- Location, if useful
- Alt text or descriptive label
- Hero eligibility
- Gallery eligibility
- Curation notes, if the editor supports them

Keep metadata concise. It should support the image, not overpower it.

### Step 4 — Curate hero slides

Hero images should be visually strong, landscape-friendly, and capable of working in the existing hero crop system. Portrait images should generally remain excluded from hero use unless the site intentionally adds portrait-specific hero handling later.

Hero slides should feel sequenced, not random. The homepage is currently hero-only, so the selected hero images are carrying the first impression of the entire site.

### Step 5 — Curate portfolio index

The portfolio index should feel like a clean archive. It does not need every image immediately. It needs enough quality and consistency that the categories feel intentional.

Review category balance. Avoid categories with only one weak or placeholder image unless that category is essential.

### Step 6 — Curate 3D gallery placement

The 3D gallery should use fewer, stronger pieces rather than filling every possible wall slot too early. Placement should consider how the user moves through the room, how plaques fit, and whether each wall feels intentional.

Do not expand the room until the current room has a strong enough curated baseline.

### Step 7 — Validate

After major curation changes, run the normal validation sequence:

```powershell
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
npm run build
```

If images were imported or removed, also run the appropriate image import/removal workflow validation.

## Recommended Phase 3 deliverables

Phase 3 should eventually produce:

- A curated public image set.
- Clean image metadata.
- A reliable hero slide set.
- A clean portfolio category structure.
- A usable first gallery-room curation.
- A short curation status document for future chats.

## Phase 3 completion criteria

Phase 3 can be considered complete when:

- The homepage hero set feels intentional.
- The portfolio index contains only images that are acceptable to show publicly.
- Image metadata is sufficiently filled for the selected work.
- Categories make sense and are not cluttered with placeholders.
- The 3D gallery has a curated starting set.
- Validation passes.
- Any remaining unfinished content is documented as intentional post-launch work.
