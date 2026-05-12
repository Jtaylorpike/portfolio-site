## 2026-05-12 — Dev validation image data integration

### Changed
- Updated the dev branch validation script so it also runs the portfolio image data validator.
- Added `-ImageDataWarningsAsErrors` support for stricter validation.
- Updated the dev branch release checklist to include image data validation.

### Files changed
- `scripts/Validate-PortfolioDevBranch.ps1`
- `docs/DEV_BRANCH_RELEASE_CHECKLIST.md`
- `PROJECT_CHANGELOG_APPEND_20260512_DEV_VALIDATION_IMAGE_DATA.md`

### Notes
- This makes the full dev validation checkpoint include both file-level image checks and data-model checks.
