## 2026-05-12 — Image data validation

### Changed
- Added a portfolio image data validation script.
- Added validation for image record fields, unique IDs, category references, rendition path prefixes, existing files, WebP output, metadata consistency, and hero slide eligibility.
- Added documentation for image data validation reports.

### Files changed
- `scripts/Validate-PortfolioImageData.ps1`
- `scripts/validate-portfolio-image-data.mjs`
- `docs/IMAGE_DATA_VALIDATION.md`
- `PROJECT_CHANGELOG_APPEND_20260512_IMAGE_DATA_VALIDATION.md`

### Notes
- This creates a guardrail for future imports and local editor changes.
- The validator can run in normal mode or with warnings treated as errors.
