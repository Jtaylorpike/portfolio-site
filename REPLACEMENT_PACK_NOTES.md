# TaylorPikePortfolio-ImageOptimizerPipelinePack-20260512

## Included files
- `scripts/Optimize-PortfolioImageRenditions.ps1`
- `scripts/optimize-portfolio-image-renditions.mjs`
- `scripts/Audit-OptimizedPortfolioImages.ps1`
- `docs/IMAGE_OPTIMIZER_PIPELINE.md`
- `PROJECT_CHANGELOG.md`
- `REPLACEMENT_PACK_NOTES.md`

## Purpose
Add a real local image optimization pipeline that generates multiple runtime sizes per portfolio image.

## Output structure
- `public/images/portfolio/full/`
- `public/images/portfolio/display/`
- `public/images/portfolio/texture/`
- `public/images/portfolio/thumb/`

## Dependency
Install sharp once:

```powershell
npm install -D sharp
```

or:

```powershell
.\scripts\Optimize-PortfolioImageRenditions.ps1 -InstallSharp
```

## Workflow
Dry run:

```powershell
.\scripts\Optimize-PortfolioImageRenditions.ps1
```

Apply:

```powershell
.\scripts\Optimize-PortfolioImageRenditions.ps1 -Apply -UpdateJson
```

Audit:

```powershell
.\scripts\Audit-OptimizedPortfolioImages.ps1
npm run build
```

Commit to dev:

```powershell
git add src/data/galleryImages.json public/images/portfolio scripts docs PROJECT_CHANGELOG.md REPLACEMENT_PACK_NOTES.md package.json package-lock.json
git commit -m "Add image optimizer pipeline and portfolio renditions"
git push -u origin dev
```

## Safety
- No old folders are deleted.
- Existing output files are skipped unless `-Force` is used.
- JSON is backed up under `asset-archive/json-backups/` when `-UpdateJson` is used.
