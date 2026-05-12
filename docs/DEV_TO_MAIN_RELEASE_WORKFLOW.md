# Dev to main release workflow

## Purpose

Use this when `dev` is ready to become the public GitHub Pages branch.

`main` should stay stable and public-facing. `dev` should hold active work until validation passes.

## Release readiness audit

Run from `dev`:

```powershell
.\scripts\Audit-DevToMainReleaseReadiness.ps1
```

Full audit with validation/build checks:

```powershell
.\scripts\Audit-DevToMainReleaseReadiness.ps1 -RunChecks
```

The desired result is:

```text
RELEASE READINESS PASSED
```

## Generate checklist

```powershell
.\scripts\Write-ReleaseMergeChecklist.ps1
```

This writes:

```text
docs/DEV_TO_MAIN_RELEASE_CHECKLIST.md
asset-reports/dev-to-main-release-checklist.md
```

## Merge to main

Only after validation passes:

```powershell
git checkout main
git pull origin main
git merge dev
npm run build
git push origin main
```

## Post-deploy smoke test

Check the live GitHub Pages site for:

```text
homepage hero
hero thumbnails
portfolio cards
portfolio lightbox
3D gallery route
gallery textures
image paths under /portfolio-site/
```

## Rollback pattern

If main breaks after merge:

```powershell
git checkout main
git log --oneline
git revert <bad-merge-or-commit-sha>
git push origin main
```

Then fix on `dev`.
