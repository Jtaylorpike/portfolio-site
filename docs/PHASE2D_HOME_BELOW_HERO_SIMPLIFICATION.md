# Phase 2D Follow-up — Homepage Below-Hero Simplification

Generated: 2026-05-13

## Purpose

This follow-up simplifies the public homepage after visual review.

The homepage had two separate UI/content sections below the hero slideshow:

1. the large intro/copy block with CTA buttons
2. the three-card archive/status strip

Those two sections were competing for the same role. The user chose the cleaner direction: keep the three balanced boxes and remove the additional below-hero intro/CTA block.

## Direction

The homepage should now move from:

- hero slideshow
- directly into the three archive/status boxes

The three boxes remain the primary below-hero structural summary. They should stay visually balanced unless there is an intentional later redesign into a single condensed slide.

## Files changed

- `src/app/sitePages.ts`
- `src/styles/global.css`
- `docs/PHASE2D_HOME_BELOW_HERO_SIMPLIFICATION.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PUBLIC_SITE_POLISH_AUDIT.md`

## Public UI changes

### Removed from the homepage

- the large below-hero introduction block
- the duplicate below-hero CTA row
- unused CSS for `.modern-home-copy`
- unused CSS for `.home-copy-actions`

### Preserved

- homepage hero slideshow
- hero slide index and thumbnail strip
- hero metadata panel
- hero CTA buttons inside the hero/copy panel
- three balanced archive/status boxes
- portfolio page gallery-entry affordance
- top navigation behavior
- virtual gallery open behavior

## Copy policy note

This change removes a visible working-copy block. It does not replace it with generated final prose.

The user wants to write the final website copy personally. Future homepage copy changes should either preserve existing text, use clearly marked placeholders, or use text supplied by the user.

## What did not change

- No About page copy changed.
- No new public prose was generated.
- No editor files changed.
- No image data changed.
- No gallery curation data changed.
- No gallery room data changed.
- No 3D gallery behavior changed.
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

After applying this follow-up:

1. Open the homepage.
2. Confirm the hero slideshow remains unchanged.
3. Confirm the large intro/copy block below the hero is gone.
4. Confirm the three archive/status boxes are the only section immediately below the hero slideshow.
5. Confirm the boxes remain balanced and simple.
6. Confirm the hero CTA buttons still work.
7. Confirm the portfolio page `Open gallery room` action still works.

## Next recommended phase

Continue with Phase 2E: public navigation/global UI polish.

Do not re-add another below-hero CTA/content block unless the homepage is intentionally redesigned around a different structure.
