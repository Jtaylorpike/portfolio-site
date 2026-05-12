# TaylorPikePortfolio-ImageDataValidationPack-20260512

## Included files
- `scripts/Validate-PortfolioImageData.ps1`
- `scripts/validate-portfolio-image-data.mjs`
- `docs/IMAGE_DATA_VALIDATION.md`
- `PROJECT_CHANGELOG_APPEND_20260512_IMAGE_DATA_VALIDATION.md`
- `REPLACEMENT_PACK_NOTES.md`

## Purpose
Add a validation layer around the cleaned image data model.

## Run
```powershell
.\scripts\Validate-PortfolioImageData.ps1
```

Optional strict mode:
```powershell
.\scripts\Validate-PortfolioImageData.ps1 -WarningsAsErrors
```

## Reports
```text
asset-reports\portfolio-image-data-validation-summary.txt
asset-reports\portfolio-image-data-issues.txt
asset-reports\portfolio-image-data-paths.csv
asset-reports\portfolio-hero-slide-audit.csv
```

## Checks
- Required gallery image fields
- Unique image IDs
- Category references
- Correct rendition path prefixes
- Local runtime file existence
- WebP runtime output
- Width/height/aspect/orientation consistency
- Hero slide image IDs
- Hero slide landscape-only rule
