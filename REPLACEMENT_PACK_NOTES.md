# TaylorPikePortfolio-GitHubPagesDeployPack-20260511

## Included files
- `.github/workflows/deploy-pages.yml`
- `vite.config.ts`
- `PROJECT_CHANGELOG.md`
- `REPLACEMENT_PACK_NOTES.md`

## Purpose
Add a GitHub Pages deployment workflow for the Vite portfolio site.

## What changed
- Added a GitHub Actions workflow that builds and deploys the site to GitHub Pages.
- Configured the workflow to run on pushes to `main`.
- Added manual workflow dispatch support.
- Updated `vite.config.ts` to use `/portfolio-site/` as the base path only when `GITHUB_PAGES=true`.
- Local development still uses `/`.

## Required GitHub setting
After pushing this pack:
1. Open the GitHub repository.
2. Go to Settings → Pages.
3. Under Build and deployment, set Source to GitHub Actions.

## Expected published URL
`https://Jtaylorpike.github.io/portfolio-site/`

## Important future note
If the site is later moved to a custom domain, the production base path should be `/`, not `/portfolio-site/`.
