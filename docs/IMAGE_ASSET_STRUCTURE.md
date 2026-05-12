# Portfolio image asset structure

## Current goal

Keep `public/images` limited to runtime files that the website actually references.

Do not use `public/images` as a general working dump for imports, experiments, source files, or rejected exports. Anything inside `public/` is eligible to be deployed.

## Current referenced runtime folders

The active app currently references these image folders:

```text
public/images/card-optimized/
public/images/gallery-optimized/
public/images/imported/climbing/optimized/
public/images/imported/climbing/full/
public/images/imported/landscape/optimized/
public/images/imported/landscape/full/
public/images/imported/landscape/thumb/
public/images/imported/landscape/texture/
public/images/climbing/
public/images/landscape/
public/images/personal/
public/images/logo/
```

The folders below may exist locally but should be audited before publishing:

```text
public/images/commercial/
public/images/portraits/
public/images/product-brand/
public/images/thumbnails/
```

They may be old category/source folders or unused legacy exports unless the audit script reports that something in them is referenced.

## Recommended workflow

Before pushing image assets:

```powershell
.\scripts\Audit-PortfolioImages.ps1
```

Review:

```text
asset-reports/referenced-images.txt
asset-reports/missing-images.txt
asset-reports/unreferenced-images.txt
```

Then run a dry cleanup:

```powershell
.\scripts\Clean-PublicImages.ps1
```

If the dry run looks correct:

```powershell
.\scripts\Clean-PublicImages.ps1 -Apply
```

This does not delete files. It moves unreferenced files to:

```text
asset-archive/unreferenced-public-images-YYYYMMDD-HHMMSS/
```

Then stage the deployable image assets:

```powershell
.\scripts\Stage-PortfolioRuntimeAssets.ps1
git commit -m "Add portfolio runtime image assets"
git push origin main
```

## Important rule

Only delete files from `asset-archive/` after the site builds and GitHub Pages displays correctly.
