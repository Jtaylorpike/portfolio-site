# Phase 2 Public Polish Start

Generated: 2026-05-13

## Purpose

This phase begins the public-facing polish work after the editor map whitespace issue was closed in Phase 0 and the public site was audited in Phase 1.

This first Phase 2 pass is intentionally narrow. It restores the pixel/VCR interface typography and cleans up a small amount of public CSS without changing the public site copy or altering the editor/gallery systems.

## Scope of this pack

- Restore the VCR/pixel font as the active interface font for navigation, labels, counters, metadata, buttons, lightbox controls, gallery controls, and portfolio index controls.
- Keep longer paragraph/body copy on the body font for readability.
- Restore the pixel face to the public text brand treatment without adding a logo back.
- Remove the late CSS override that forced the gallery close button back to Arial.
- Add a small text-selection treatment to match the existing accent system.
- Preserve homepage, portfolio, About, contact, 3D gallery, image data, and editor behavior.

## Copy authorship rule

This pack does not change website copy. Final public copy is user-authored. Future code work should avoid rewriting homepage, portfolio, About, contact, CTA, or metadata text unless the user explicitly provides replacement text or asks for draft-only placeholders.

## Visual intent

The design direction remains the dark editorial/gallery-index system:

- charcoal/black background
- central hero image
- left visual index
- contact-sheet thumbnails
- thin technical/gallery guide lines
- metadata panels
- refined avant-garde photography portfolio feel

The pixel/VCR font should act as an interface layer, not as the main reading font.

## Files changed

- `src/styles/global.css`

## Files intentionally not changed

- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `src/data/*`
- `src/gallery/*`
- `local-editor/*`
- public image assets

## Validation run

From the extracted source:

```powershell
npm ci
npm run build
```

Result: build passed.

## Manual review checklist

After applying:

1. Open the public homepage.
2. Confirm the nav, brand text, hero index, metadata, CTAs, and thumbnails use the pixel/VCR interface font.
3. Confirm paragraph copy remains readable and does not switch to the pixel font.
4. Open the portfolio page and confirm category filters, card counters, and the archive meta strip use the pixel/VCR interface font.
5. Open the image lightbox and confirm close/previous/next/counter/category controls match the interface style.
6. Open the virtual gallery and confirm the close button no longer visually falls back to Arial.
7. Confirm no public copy has changed.

## Next Phase 2 candidates

The next Phase 2 pass should continue public-facing polish in small controlled chunks. Good candidates:

- homepage spacing/rhythm review
- hero metadata and thumbnail alignment pass
- portfolio grid density and hover-state refinement
- gallery entry CTA refinement without copy rewrites
- mobile public-site pass before mobile gallery controls
- restoring or refining any lost design-system details from earlier versions
