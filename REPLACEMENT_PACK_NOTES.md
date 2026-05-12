# TaylorPikePortfolio-DevValidationImageDataIntegrationPack-20260512

## Included files
- `scripts/Validate-PortfolioDevBranch.ps1`
- `docs/DEV_BRANCH_RELEASE_CHECKLIST.md`
- `PROJECT_CHANGELOG_APPEND_20260512_DEV_VALIDATION_IMAGE_DATA.md`
- `REPLACEMENT_PACK_NOTES.md`

## Purpose
Integrate the new image data validator into the full dev branch validation script.

## Run

```powershell
.\scripts\Validate-PortfolioDevBranch.ps1
```

Strict mode:

```powershell
.\scripts\Validate-PortfolioDevBranch.ps1 -ImageDataWarningsAsErrors
```

## What changed
The validation script now runs:

```powershell
.\scripts\Validate-PortfolioImageData.ps1
```

and fails if the data validator reports errors.

## Reports
```text
asset-reports\dev-branch-validation-latest.txt
asset-reports\portfolio-image-data-validation-summary.txt
```
