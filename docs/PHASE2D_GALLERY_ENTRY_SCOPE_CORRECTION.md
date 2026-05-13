# Phase 2D — Gallery Entry Scope Correction

Generated: 2026-05-13

## Purpose

This correction narrows the Phase 2D gallery-entry polish after visual review.

The original Phase 2D pass made the homepage `02 / Spatial` archive card more like an embedded gallery CTA, with an internal Enter button, control chips, and a stronger spatial treatment. That made the homepage archive/status section feel less balanced.

The corrected direction is simpler:

- keep the homepage archive/status section as three balanced boxes
- do not add a red dot or accent marker beside the top-nav Gallery button
- keep primary gallery entry available through the existing main CTAs
- keep the portfolio route `Open gallery room` affordance, which is a more appropriate place for a direct gallery cross-link

## Files changed

- `src/app/sitePages.ts`
- `src/styles/global.css`
- `docs/PHASE2D_GALLERY_ENTRY_SCOPE_CORRECTION.md`
- `docs/PHASE2D_GALLERY_ENTRY_CTA_POLISH.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PUBLIC_SITE_POLISH_AUDIT.md`

## Public UI changes

### Removed from the homepage archive/status strip

- the small `Enter` button inside `02 / Spatial`
- the gallery control chips
- the special second-card gallery/grid treatment
- the one-off left accent rail on the second card

The section now returns to the cleaner three-card rhythm.

### Removed from the top navigation

- the red/accent dot beside the Gallery nav button

### Preserved

- the main homepage gallery CTA
- the entry-page gallery CTA
- the portfolio page `Open gallery room` action and subtle arrow affordance
- all gallery opening behavior wired through `data-open-virtual-gallery`

## What did not change

- No About page copy changed.
- No final website copy changed.
- No image data changed.
- No gallery curation data changed.
- No gallery room data changed.
- No editor files changed.
- No 3D gallery movement, collision, plaque, loading, or interaction behavior changed.
- No mobile gallery-control work was started.

## Validation

Run from the project root:

```powershell
npm run build
node scripts/validate-portfolio-image-data.mjs --project-root .
```

Expected result:

- Build passes.
- Image-data validation remains at 0 errors.
- The known active/placed/unassigned gallery wall warning may remain until curation is completed.

## Manual review checklist

After applying this correction:

1. Open the homepage.
2. Confirm the top-nav Gallery item has no red/accent dot beside it.
3. Confirm the archive/status strip reads as three balanced boxes.
4. Confirm the `02 / Spatial` card no longer contains an internal Enter button or control chips.
5. Confirm the main gallery CTAs still open the virtual gallery.
6. Confirm the portfolio page `Open gallery room` button still opens the virtual gallery.

## Next recommended phase

Continue with Phase 2E: public navigation/global UI polish, but keep the nav restrained. Avoid adding ornamental active markers unless they are clearly needed and visually consistent with the rest of the system.
