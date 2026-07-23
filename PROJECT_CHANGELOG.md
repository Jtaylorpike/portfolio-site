# Taylor Pike Portfolio Project Changelog

This file records current and future release-level changes. The complete pre-consolidation changelog and all historical phase documents are preserved verbatim in `docs/PROJECT_HISTORY_ARCHIVE.md`.

## 2026-07-23 - Phase 9A launch-readiness audit

- Audited Home, Portfolio, and About routes at desktop and mobile sizes against the production build.
- Verified route metadata, image alternative-text attributes, skip-link targets, asset responses, runtime errors, and horizontal overflow.
- Added the missing semantic homepage heading without altering its accepted visual presentation.
- Refreshed the sitemap modification date for the current release cycle.
- Changed portfolio thumbnail startup to prioritize the top card in every rendered column, then begin lower rows in a sub-300ms cascade with a brief low-opacity/blur reveal and reduced-motion fallback.
- Removed the magnification cursor from portfolio thumbnails and made fullscreen controls overlap-aware: landscape images receive an outer control rail, Close collapses in place into its right border after two idle seconds when it is not fully inside the image, and intersecting Prev/Next controls fade until pointer activity returns within the frame.
- Stabilized fullscreen slide changes by preloading and decoding the incoming image before applying its source, orientation layout, and caption as one update, preventing the outgoing image from resizing while the next file loads.
- Recorded final user-authored About copy as the remaining content blocker; placeholder copy was not replaced automatically.
- Confirmed the GitHub Pages project URL returns HTTP 200 and identified the intended `taylorpike.com` canonical domain returning HTTP 404 as an external launch blocker.

## 2026-07-22 - Phase 8AP gallery recovery and editor completion start

- Repaired deferred preview delivery so artwork frames cannot remain blank while waiting for GPU idle preparation.
- Removed a duplicate renderer drawing-buffer resize during quality changes and staged automatic demotion work.
- Replaced cyclic gallery-quality selection with a direct Auto/Low/Medium/High menu.
- Reduced Low-tier lighting cost while preserving the accepted High presentation.
- Changed the gallery loading bar to a gapless, continuously moving compositor animation.
- Fixed the local-editor launcher/server port mismatch.
- Added a native Site Settings editor for active `siteSeo.json`, including validation, backups, route metadata, keywords, and profile URLs.
- Passed fresh-cache desktop/mobile gallery regression tests, editor route tests, and an isolated SEO save/backup test.

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
# 2026-07-22 — Phase 8AP local-editor UX refinement

- Added a bounded 30-step Undo history to Gallery Curation, including field edits, artwork assignment, ordering, placement, rotation, flipping, and wall creation/removal.
- Added Ctrl/Cmd+Z support and visible descriptions of the next undo action.
- Corrected gallery placement-state updates so the map, card state, filters, and collision state remain synchronized.
- Consolidated the editor chrome into a denser classic-Mac-inspired interface while preserving the existing light/dark themes and editor workflows.
- Improved mobile route navigation, control sizing, focus visibility, panel density, and responsive gallery actions.
