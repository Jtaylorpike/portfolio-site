# Phase 2D — Gallery Entry CTA Polish

Generated: 2026-05-13

## Purpose

This phase makes the existing virtual-gallery entry points feel more intentional without reopening gallery mechanics, editor tooling, room geometry, image data, or final site copy.

The goal is not to explain the full gallery experience yet. The goal is to make the gallery feel like a deliberate part of the public site rather than a hidden or incidental button.


## Scope correction after visual review

After the first Phase 2D pack, the user reviewed the homepage and clarified that the Gallery nav item should not have a red/accent dot and that the homepage archive/status strip should remain a clean three-box section unless it is intentionally redesigned as one condensed slide.

The corrected implementation removes the internal `Enter` button, control chips, and special visual treatment from the `02 / Spatial` card. Gallery entry remains available through the primary homepage CTA, entry page CTA, top-nav Gallery button, and portfolio page `Open gallery room` action.

The portfolio `Open gallery room` button affordance is preserved. The top-nav red/accent dot is removed.

## Files changed

- `src/app/sitePages.ts`
- `src/styles/global.css`
- `docs/PHASE2D_GALLERY_ENTRY_CTA_POLISH.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PUBLIC_SITE_POLISH_AUDIT.md`

## Public UI changes

### Homepage archive/status strip

The initial Phase 2D pack upgraded the `02 / Spatial` card into a stronger embedded gallery-entry surface. After review, that was narrowed back. The corrected direction keeps the homepage archive/status strip as three balanced boxes.

The `02 / Spatial` card no longer contains an internal `Enter` button, gallery control chips, or a special one-off visual treatment.

### Portfolio route gallery CTA

The portfolio header's `Open gallery room` action keeps a dedicated class and arrow affordance so it reads like an intentional cross-link instead of a plain metadata chip.

### Global navigation affordance

The top-nav Gallery button should remain restrained. The red/accent dot marker added in the original Phase 2D pack was removed.

## What did not change

- No final About page copy was changed.
- No public prose was rewritten.
- No image data was changed.
- No gallery curation data was changed.
- No gallery room data was changed.
- No editor files were changed.
- No 3D gallery movement, collision, plaque, loading, or interaction behavior was changed.
- No mobile gallery-control work was started in this phase.

## Validation

Run from the project root:

```powershell
npm run build
node scripts/validate-portfolio-image-data.mjs --project-root .
```

Result in the working package used to create this pack:

- Build: passed.
- Image-data validation: 0 errors, 1 known warning.

The known warning is the existing active/placed gallery wall slot with no assigned artwork. This warning predates Phase 2D and is not related to this pack.

## Manual review checklist

After applying this pack:

1. Open the homepage.
2. Confirm the archive/status strip reads as three balanced boxes.
3. Confirm the `02 / Spatial` card does not contain an internal Enter button or control chips.
4. Open the portfolio page and click `Open gallery room`.
5. Confirm the top-nav Gallery item has no red/accent dot marker.
6. Confirm the VCR/pixel font remains limited to minor numeric accents and does not affect the Taylor Pike wordmark.
7. Check the homepage archive cards at desktop, tablet, and narrow mobile widths.

## Next recommended phase

Move to Phase 2E: public navigation/global UI polish.

That pass should review the shared header, route transitions, buttons, global link styles, focus states, footer or contact access if present, and consistency between homepage, portfolio, about, and gallery entry points. It should remain copy-safe.
