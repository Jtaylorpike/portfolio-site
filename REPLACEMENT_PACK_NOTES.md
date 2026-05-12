# TaylorPikePortfolio-GalleryLayoutTypeScriptBuildFixPack-20260511

## Included files
- `src/gallery/artwork/galleryLayout.ts`
- `PROJECT_CHANGELOG.md`
- `REPLACEMENT_PACK_NOTES.md`

## Purpose
Fix the GitHub Actions build failure caused by TypeScript narrowing in `galleryLayout.ts`.

## Error fixed
`src/gallery/artwork/galleryLayout.ts#L234`
`This comparison appears to be unintentional because the types 'true | undefined' and 'false' have no overlap.`

## What changed
- Added `isWallVisibleInGallery(wall)`.
- Added `isWallPlaqueEnabled(wall)`.
- Replaced direct optional literal comparisons with helper functions.
- Preserved the same runtime behavior.

## After applying
Run:
`npm run build`

Then:
`git add .`
`git commit -m "Fix gallery layout TypeScript build"`
`git push origin main`
