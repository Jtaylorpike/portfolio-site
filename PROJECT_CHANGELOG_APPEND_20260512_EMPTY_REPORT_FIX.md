## 2026-05-12 — Validation empty report fix

### Changed
- Fixed `Audit-PublicImageReferences.ps1` so empty report files are explicitly cleared and recreated.
- Fixed `Validate-PortfolioDevBranch.ps1` so the public image audit check reads the missing count from the audit summary instead of stale text file contents.

### Files changed
- `scripts/Audit-PublicImageReferences.ps1`
- `scripts/Validate-PortfolioDevBranch.ps1`
- `PROJECT_CHANGELOG_APPEND_20260512_EMPTY_REPORT_FIX.md`

### Notes
- The prior validation output showed `Missing referenced files: 0` in the summary but still failed with 4 missing files because stale rows remained in `public-image-missing.txt`.
