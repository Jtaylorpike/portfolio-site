# TaylorPikePortfolio-GitHubPagesAssetPathRenditionStructurePack-20260511

## Included files
- `src/data/images.ts`
- `scripts/Migrate-PublicImagesToRenditions.ps1`
- `scripts/Audit-PublicAssetUrls.ps1`
- `docs/PUBLIC_IMAGE_RENDITION_STRUCTURE.md`
- `PROJECT_CHANGELOG.md`
- `REPLACEMENT_PACK_NOTES.md`

## Purpose
Fix image loading on GitHub Pages and establish a better long-term `public/images` structure.

## What changed
- Image paths from `galleryImages.json` are now resolved with `import.meta.env.BASE_URL`.
- Card image paths are also resolved with `import.meta.env.BASE_URL`.
- Added a migration script for moving images to rendition-based folders.
- Added documentation recommending folders by optimization/size/purpose rather than category.

## Why this matters
On GitHub Pages, the site is served from `/portfolio-site/`. A runtime path like `/images/example.webp` points to `https://jtaylorpike.github.io/images/example.webp`, which is wrong. It needs to become `https://jtaylorpike.github.io/portfolio-site/images/example.webp`.

## Recommended folder model
- `public/images/portfolio/display/`
- `public/images/portfolio/thumb/`
- `public/images/portfolio/texture/`
- `public/images/portfolio/full/`
- `public/images/ui/`
- `public/images/logo/`

## Use
Apply this pack, then run:

```powershell
npm run build
git add src/data/images.ts scripts/Migrate-PublicImagesToRenditions.ps1 scripts/Audit-PublicAssetUrls.ps1 docs/PUBLIC_IMAGE_RENDITION_STRUCTURE.md PROJECT_CHANGELOG.md REPLACEMENT_PACK_NOTES.md
git commit -m "Fix GitHub Pages image paths and document image structure"
git push origin main
```

Do not run the migration script with `-Apply -UpdateJson` until the live Pages path fix is confirmed.
