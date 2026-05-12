# Taylor Pike Portfolio Project Changelog

This file records meaningful design, architecture, data, editor, and gallery changes made during development.

Current source files remain the source of truth. This changelog is a historical record and should be updated with every replacement pack going forward.

---

## 2026-05-12 — Image optimizer pipeline

### Changed
- Added a local image optimizer pipeline for generating `full`, `display`, `texture`, and `thumb` WebP renditions from gallery image records.
- Added a PowerShell wrapper for the optimizer.
- Added an audit script for optimized portfolio image paths and missing files.
- Added documentation for the optimizer workflow and rendition sizes.

### Files changed
- `scripts/Optimize-PortfolioImageRenditions.ps1`
- `scripts/optimize-portfolio-image-renditions.mjs`
- `scripts/Audit-OptimizedPortfolioImages.ps1`
- `docs/IMAGE_OPTIMIZER_PIPELINE.md`
- `PROJECT_CHANGELOG.md`

### Notes
- This pipeline should be run on `dev`, not directly on `main`.
- The optimizer does not delete old folders.
- JSON backups are written to `asset-archive/json-backups/` when `-UpdateJson` is used.

---
