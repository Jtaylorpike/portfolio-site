# Dev branch release checklist

Use this before merging `dev` into `main`.

## Run validation

```powershell
.\scripts\Validate-PortfolioDevBranch.ps1
```

Expected result:

```text
VALIDATION PASSED
```

Strict image-data mode:

```powershell
.\scripts\Validate-PortfolioDevBranch.ps1 -ImageDataWarningsAsErrors
```

## What the validation checks

```text
Current branch is dev
asset-archive is not tracked
asset-reports is not tracked
No missing public image references
No missing optimized portfolio renditions
No optimized image prefix violations
Portfolio image data has zero errors
Public image structure summary is generated
npm run build passes
```

When `-ImageDataWarningsAsErrors` is used, portfolio image data warnings also fail the validation.

## Reports

```text
asset-reports/dev-branch-validation-latest.txt
asset-reports/public-image-reference-summary.txt
asset-reports/optimized-image-audit-summary.txt
asset-reports/portfolio-image-data-validation-summary.txt
asset-reports/public-image-structure-summary.txt
```

## Commit rules

Do not commit:

```text
asset-archive/
asset-reports/
source-images/
```

Check:

```powershell
git ls-files asset-archive
git ls-files asset-reports
git ls-files source-images
```

Each command should print nothing.

## Merge later

Only merge after validation passes and the site is checked locally.

```powershell
git checkout main
git pull origin main
git merge dev
npm run build
git push origin main
```

GitHub Pages deploys from `main`.
