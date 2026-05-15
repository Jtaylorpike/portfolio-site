# Current Project Handoff — Phase 3 Active

Updated: 2026-05-15

## Current status

The portfolio project is currently in **Phase 3: content, photo, and metadata curation**.

The user confirmed they are happy with how the portfolio is looking. The current design baseline should be treated as stable.

Do not begin broad redesign work unless the user identifies a specific issue. The next useful work is practical curation, metadata, alt text review, and eventual launch preparation.

## Completed phase summary

### Phase 0 — Editor map whitespace closure

Complete. The gallery editor map whitespace issue was fixed and confirmed by the user.

### Phase 1 — Public-site audit

Complete. The audit established that the public design direction was working and needed refinement rather than redesign.

### Phase 2 — Public polish

Complete. Major public-shell polish was completed and pushed to both `dev` and `main` at the confirmed checkpoint.

Key Phase 2 outcomes:

- Homepage simplified to hero-only.
- Desktop homepage no longer needs unnecessary scroll in the current hero-only state.
- Pixel/VCR font restored only as a narrow numeric/accent style.
- Header/wordmark kept off the pixel font.
- Portfolio/index header red underline removed.
- Portfolio meta strip simplified to counters only.
- Extra gallery button removed from portfolio meta strip.
- Gallery remains reachable from nav and homepage hero CTA.
- Mobile homepage spacing tightened.
- Mobile virtual gallery button removed.
- Mobile hero body copy removed.
- Visual Index spacing corrected.
- Mobile metadata made more compact.
- Portfolio category rail scroll position preserved.
- Mobile hero performance improved.
- Lightbox received accessibility/focus and mobile swipe polish.

### Phase 3 — Content and metadata curation

Active. This phase depends heavily on the user selecting the actual image set and metadata.

## Current data and image notes

The latest reviewed package showed the project had moved beyond the original small sample set. It contained a larger active gallery image set and active thumbnail coverage.

The active runtime image structure is:

```text
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/portfolio/texture/
public/images/portfolio/full/
public/images/ui/cards/
```

There is no active `public/images/logo/` folder.

If public images are not pushing to GitHub, the likely issue is staging/commit flow, not `.gitignore`. Stage public runtime assets explicitly when needed:

```powershell
git add -A public/images/portfolio
git add -A public/images/ui
git add -A public/fonts
git add -A src/data
git add index.html
```

## Copy policy

The user wants to write the actual final website copy. Do not replace or generate final public prose, especially About page copy, unless asked.

Existing About text should be treated as placeholder unless the user confirms they wrote or approved it.

## Subcategory decision

Subcategories are not being added now. If future organization needs grow, use a restrained model:

```text
Category = public navigation
Series/collection = optional curated body of work
Tags = optional internal/search/SEO layer
```

Do not add nested category UI unless the user requests it later.

## Portfolio size target

Working guidance:

```text
Minimum viable portfolio: 18–24 images
Strong complete portfolio: 30–45 images
Likely too much for launch: 60+ images unless tightly curated
Homepage hero slides: 5–8 images
3D gallery room: 12–18 images
```

The site should feel curated, not exhaustive.

## Next practical user workflow

From repo root:

```powershell
cd C:\Users\jtayl\portfolio-site
git checkout dev
.\scripts\Run-LocalEditor.ps1
```

Then focus on:

1. importing final/near-final images;
2. hiding/removing weak images;
3. assigning categories;
4. adding title/year/location/basic metadata;
5. choosing hero candidates;
6. choosing 3D gallery images;
7. validating and committing stable batches.

## Validation commands

Use as appropriate:

```powershell
npm run build
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
```

Do not repeat the old known active/placed/unassigned wall-slot warning unless it becomes directly relevant or blocking.
