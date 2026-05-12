# Taylor Pike Portfolio Project Changelog

This file records meaningful design, architecture, data, editor, and gallery changes made during development.

Current source files remain the source of truth. This changelog is a historical record and should be updated with every replacement pack going forward.

---

## 2026-05-12 — Stale public data archive cleanup

### Changed
- Added a dry-run-first script to move stale `public/data` files into `asset-archive/`.
- Updated the public image reference audit message to point stale public data users to the archive script.
- Added documentation explaining why active editable data should live in `src/data`, not stale deployed `public/data` snapshots.

### Files changed
- `scripts/Archive-StalePublicData.ps1`
- `scripts/Audit-PublicImageReferences.ps1`
- `docs/STALE_PUBLIC_DATA_CLEANUP.md`
- `PROJECT_CHANGELOG.md`

### Notes
- This resolves missing image references caused by old `public/data/projects.json` entries.
- The script does not delete stale data. It moves it to local `asset-archive/`.

---
