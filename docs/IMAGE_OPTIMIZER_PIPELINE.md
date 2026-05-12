# Image optimizer pipeline

## Purpose

This pipeline generates a complete set of runtime image renditions for every record in `src/data/galleryImages.json`.

It is designed to support the cleaner image structure:

```text
public/images/portfolio/full/
public/images/portfolio/display/
public/images/portfolio/texture/
public/images/portfolio/thumb/
```

## Renditions

```text
full    = max 2400px, WebP quality 88
display = max 1600px, WebP quality 84
texture = max 1024px, WebP quality 78
thumb   = max 520px, WebP quality 74
```

All output files use:

```text
/images/portfolio/<rendition>/<image-id>.webp
```

## Why this is better

Categories belong in JSON, not in the folder structure.

The filesystem should describe purpose and size. This keeps the editor free to create, delete, or rename categories without needing filesystem changes.

## Dependency

The script uses `sharp`.

Install it once:

```powershell
npm install -D sharp
```

or run:

```powershell
.\scripts\Optimize-PortfolioImageRenditions.ps1 -InstallSharp
```

## Workflow

Run on the `dev` branch.

Dry run first:

```powershell
.\scripts\Optimize-PortfolioImageRenditions.ps1
```

Review:

```text
asset-reports/optimizer-plan.txt
asset-reports/optimizer-missing-sources.txt
asset-reports/optimizer-summary.txt
```

Apply and update JSON:

```powershell
.\scripts\Optimize-PortfolioImageRenditions.ps1 -Apply -UpdateJson
```

If files already exist and you want to regenerate them:

```powershell
.\scripts\Optimize-PortfolioImageRenditions.ps1 -Apply -UpdateJson -Force
```

Audit:

```powershell
.\scripts\Audit-OptimizedPortfolioImages.ps1
npm run build
```

## Safety

The optimizer does not delete old folders or source files.

When `-UpdateJson` is used, it backs up the previous JSON to:

```text
asset-archive/json-backups/
```

Do not delete `asset-archive/`. It may contain source images that do not exist elsewhere locally.
