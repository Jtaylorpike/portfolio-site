# Taylor Pike Portfolio Project Changelog

This file records current and future release-level changes. The complete pre-consolidation changelog and all historical phase documents are preserved verbatim in `docs/PROJECT_HISTORY_ARCHIVE.md`.

## 2026-07-22 - Phase 8AN/AO, transition polish, and repository consolidation

### Gallery

- Added separate cached procedural material families for ceiling, room shell, gallery walls, and floor.
- Added local Auto, Low, Medium, and High gallery quality modes.
- Added conservative local device/network hints, sustained frame timing, cache-readiness gating, manual preference persistence, tiered lighting/shadows, and tiered artwork texture loading.
- Added post-load/intent-driven browser cache warming without Three.js GPU texture creation.
- Added delayed artwork GPU texture release after gallery exit while retaining browser-cached downloads.
- Fixed failed prewarm retry behavior and required both preview and artwork cache readiness for High promotion.
- Smoothed Auto promotion by staging resolution and High shadows across frame/idle boundaries.
- Serialized High artwork texture uploads and converted the loading overlay/bar to compositor-friendly transitions.
- Hardened gallery-entry intent delegation so non-element event targets cannot throw during pointer, focus, touch, or click handling.

### Documentation and repository hygiene

- Parsed 367 historical files formerly under `docs` and preserved each verbatim with path, timestamp, byte count, category, and SHA-256 in `docs/PROJECT_HISTORY_ARCHIVE.md`.
- Reduced active documentation to the current guide, complete historical archive, and operational alt-text JSON.
- Preserved the former 223 KB root changelog, obsolete transfer manifest/uploader, and 12 source/editor backup snapshots as supplemental archive records.
- Removed the redundant `thumb.zip` after verifying all 74 entries were byte-identical to active thumbnails.
- Redirected editor and handoff tooling to the consolidated documentation model.
- Audited all 55 scripts, retained 15 current operational scripts, and preserved then removed 40 one-time migration, repair, release, handoff, archive, and workspace-cleanup scripts.
- Fixed the retained image-data PowerShell wrapper to propagate Node validation failures and cleared the stale wall assignment to removed image ID `landscape-201019-jtp6059`.

### Validation

- `npm ci`: passed; two high-severity npm advisories remain and no forced upgrade was applied.
- `npm run build`: passed.
- `git diff --check`: passed.
- All 132 active `textureSrc` and `fullSrc` paths exist.
- Playwright Chromium desktop and mobile/touch gallery smoke tests passed.
- Documentation archive integrity: 422 source records with paired provenance/verbatim markers.

## Historical record

For phases 0-8AM, editor evolution, image-pipeline work, public polish, mobile controls, SEO/Lighthouse work, pack notes, manifests, rollbacks, and detailed validation history, search the original filename or phase name in `docs/PROJECT_HISTORY_ARCHIVE.md`.
