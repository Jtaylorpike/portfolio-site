# Taylor Pike Portfolio Project Changelog

This file records meaningful design, architecture, data, editor, and gallery changes made during development.

Current source files remain the source of truth. This changelog is a historical record and should be updated with every replacement pack going forward.

---

## 2026-05-12 — Image migration report output fix

### Changed
- Rewrote the image rendition migration report generation to use explicit PowerShell lists instead of fragile pipeline output.
- Added readable `.txt` review reports alongside CSV files.
- Added image-record scan counts to the migration output.
- Updated the rendition structure audit to write both CSV and readable text reports.

### Files changed
- `scripts/Migrate-PublicImagesToRenditions.ps1`
- `scripts/Audit-PortfolioRenditionStructure.ps1`
- `PROJECT_CHANGELOG.md`

### Notes
- The previous migration pack could produce summaries without useful row data in the CSV review documents. This fix makes the report output explicit and easier to inspect.

---
