# Legacy image archive cleanup

## Purpose

After the portfolio image records have been migrated to:

```text
public/images/portfolio/full/
public/images/portfolio/display/
public/images/portfolio/texture/
public/images/portfolio/thumb/
```

the old files under `public/images` become deployable clutter.

They should not be deleted immediately. They should be moved to `asset-archive/` so unique unimported images are preserved locally.

## Workflow

Run this on `dev`.

First audit every public image reference in source:

```powershell
.\scripts\Audit-PublicImageReferences.ps1
```

Review:

```text
asset-reports\public-image-reference-summary.txt
asset-reports\public-image-missing.txt
asset-reports\public-image-unreferenced.txt
asset-reports\public-image-reference-locations.csv
```

If missing referenced files are found, stop and fix those first.

Then dry-run the archive move:

```powershell
.\scripts\Archive-UnreferencedPublicImages.ps1
```

Review:

```text
asset-reports\archive-unreferenced-public-images-plan.txt
```

Apply only after the plan looks correct:

```powershell
.\scripts\Archive-UnreferencedPublicImages.ps1 -Apply
```

This moves unreferenced files to:

```text
asset-archive/public-images-unreferenced-YYYYMMDD-HHMMSS/
```

It does not delete them.

## After applying

Run:

```powershell
.\scripts\Audit-PublicImageReferences.ps1
.\scripts\Audit-OptimizedPortfolioImages.ps1
npm run build
```

Then inspect the site locally.

## Git rules

Commit only the public runtime cleanup and scripts/docs.

Do not commit:

```text
asset-archive/
asset-reports/
```

Use:

```powershell
git status --short
git ls-files asset-archive
```

`git ls-files asset-archive` should print nothing.

## Important

`asset-archive/` may contain your only local copy of images that have not been imported yet. Keep it locally and back it up outside the repo.
