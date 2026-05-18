# Pack Notes — Phase 5A About/contact separate image pipeline

## Purpose

Start Phase 5 with a public About/contact structure and a separate About image data/import pipeline.

## Key behavior

- Public About page renders temporary images from `src/data/aboutPhotos.json`.
- Native About imports write to `public/images/about/`.
- About records are edited separately from portfolio images.
- Final copy remains placeholder-only.

## Apply/test

1. Apply the replacement files.
2. Run `npm run build`.
3. Start the local editor and open `#/about`.
4. Confirm the temporary About photo list appears.
5. Import one small test About image and confirm files write under `public/images/about/`.
6. Save, reload, and confirm `aboutPhotos.json` persists.
