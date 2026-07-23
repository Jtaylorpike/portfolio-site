# Taylor Pike Photography Portfolio - Current Project Guide

Last updated: 2026-07-22 19:13 EDT (UTC-04:00)

This is the authoritative operational and handoff document for the repository. Historical documents, phase records, pack notes, manifests, earlier policies, and superseded handoffs are preserved verbatim in `PROJECT_HISTORY_ARCHIVE.md`. The staged portfolio alt-text dataset remains at `alt-text/portfolio-image-alt-text-20260515.json` because repository tooling consumes that path directly.

## Current status

Phase 8AN surface hierarchy and Phase 8AO adaptive quality are implemented and audited. Phase 8AP is now active as the performance-safe gallery completion and editor operational-recovery stage. Its first slice repairs deferred artwork preview delivery, smooths automatic demotion, adds direct quality selection, strengthens the continuously moving loading indicator, fixes the local-editor launch port contract, and adds editor coverage for active SEO metadata.

The implementation is ready for final release review. It has not been committed, pushed, or merged in the current work session.

## Source of truth

- Current repository files are authoritative over historical notes.
- Active data is under `src/data`.
- Runtime portfolio images are under `public/images/portfolio`.
- `public/data` is stale/archive-only and must not become active data.
- The local Flask editor is under `local-editor`.
- The public application is Vite + TypeScript with vanilla Three.js modules; it is not React.
- The intended public URL is `https://taylorpike.com/`.

## Protected visual and behavioral baseline

- Phase 8AM lighting is the accepted canonical High-quality presentation.
- Do not perform another general lighting pass without explicit approval.
- Preserve accepted light colors, intensities, positions, renderer exposure, room footprint, wall placement, collision, curation, and editor behavior.
- Do not reintroduce rejected Phase 8AJ black ceiling fields, end caps, reveals, recessed wells, or other game-like geometry.
- Do not add benches, plinths, loose objects, fog, post-processing, or dependencies without approval.
- Existing trim may be refinished, but not repositioned or enlarged.
- Final site copy belongs to the user; generated prose remains placeholder-only unless explicitly requested.

## Current gallery implementation

### Phase 8AN materials

- Ceiling, room shell, gallery walls, and floor use separate cached procedural material families.
- Ceiling is dark and readable with restrained irregular variation.
- Room shell is darker and richer than the cleaner artwork-supportive gallery walls.
- Floor is matte and visually secondary.
- Procedural textures are lightweight and persistent across gallery teardown.
- No new architectural geometry was added by Phase 8AN.

### Phase 8AO quality and loading

- Modes: Auto, Low, Medium, and High.
- Manual selection persists in browser local storage.
- Auto uses local device, connection, viewport, cache-readiness, and sustained frame-time observations. No telemetry is sent.
- Auto cannot promote from cache readiness alone; stable rendering performance is also required.
- High retains the complete Phase 8AM lighting architecture.
- Lower tiers reduce device-pixel ratio, optional artwork lighting layers, shadows, and texture-loading aggressiveness.
- Browser-cache warming starts after page load and an idle opportunity, or immediately after gallery-entry intent.
- Browser warming uses HTTP fetches and does not create Three.js GPU textures.
- Artwork source textures are released from GPU memory shortly after gallery exit while browser-cached downloads remain.
- Persistent shared environment textures are not disposed during gallery teardown.
- Failed browser prewarming clears its attempt marker and can be retried later.
- Auto promotion stages light visibility, renderer resolution, and High shadow activation across frame/idle boundaries.
- High artwork texture uploads are serialized to reduce decode/upload spikes.
- The loading overlay fades instead of toggling layout display, and its bar uses continuous linear compositor animation.
- Deferred preview artwork textures bypass optional GPU-idle preparation so frames cannot remain blank while waiting for a large idle deadline.
- Automatic demotion avoids a duplicate drawing-buffer resize and stages shadows, optional lighting, and resolution across separate frames.
- Quality is selected directly from an Auto/Low/Medium/High menu rather than requiring cyclic traversal.

## Validation baseline - 2026-07-22

- `npm ci`: passed; npm reported two high-severity dependency advisories. No forced dependency upgrade was applied.
- `npm run build`: passed after the adaptive-quality audit and again after seamless-transition work.
- TypeScript and Vite import resolution: passed.
- `git diff --check`: passed.
- Active asset audit: all 132 `textureSrc` and `fullSrc` references exist in the repository.
- Playwright Chromium: desktop 1440x900 and mobile/touch emulation 390x844 rendered successfully.
- Tested: gallery open, quality cycling, artwork focus, close/reopen, desktop movement input, and touch input.
- Remaining: physical iPhone/Android and lower-powered GPU testing; deployed-domain smoke test after merge.

## Active data and asset contract

Primary active records:

- `src/data/galleryImages.json`
- `src/data/categories.json`
- `src/data/heroSlides.json`
- `src/data/galleryCuration.json`
- `src/data/galleryRoom.json`
- `src/data/aboutPhotos.json`
- `src/data/aboutCopy.json`
- `src/data/siteSeo.json`

Runtime image structure:

- `public/images/portfolio/display`
- `public/images/portfolio/thumb`
- `public/images/portfolio/texture`
- `public/images/portfolio/full`
- `public/images/ui/cards`
- `public/images/about/display`
- `public/images/about/thumb`
- `public/images/about/full`

There is no active `public/images/logo` directory. Public paths must continue resolving through `import.meta.env.BASE_URL` for project-path deployment compatibility.

## Local editor and curation contract

- Editor-backed changes must preserve the public `isPublic` visibility model.
- Gallery room settings and curation remain data-backed through `galleryRoom.json` and `galleryCuration.json`.
- Preserve wall placement, collision, plaque fallback, map behavior, editor category ordering, and the accepted Phase 4H-I-J v9 drag threshold behavior.
- Preserve the Adobe-inspired editor direction: compact, professional, image-first, visually quiet, and free of the public-site pixel font.
- Image IDs and rendition names must remain synchronized across active JSON and `display`, `thumb`, `texture`, and `full` assets.
- The alt-text application script intentionally reads `docs/alt-text/portfolio-image-alt-text-20260515.json` by default.
- The local editor launcher and Flask server share the requested `FLASK_RUN_PORT`; the default advertised URL is `http://127.0.0.1:5000`.
- The Site Settings editor page reads, validates, backs up, and saves active `src/data/siteSeo.json` metadata.

## Phase 8AP validation - 2026-07-22

- Fresh-cache Playwright desktop and mobile runs passed gallery open, Low-to-Medium selection, close, reopen, and artwork rendering with no browser errors.
- Loading animation cold-cache tests passed at two desktop sizes and one mobile/touch size with eight unique transform samples per run.
- All eight local-editor routes rendered without browser errors.
- Flask `/`, `/api/data`, and `/api/backups` returned HTTP 200; `/api/data` now includes `siteSeo`.
- The SEO save/backup path passed against an isolated temporary data copy without modifying active project JSON.

## Release workflow

Before release:

1. Inspect `git status`, staged changes, and the complete diff.
2. Confirm no unintended active data, local-editor, image, room, or curation changes.
3. Run `npm ci` when dependency reproducibility needs confirmation.
4. Run `npm run build`.
5. Run desktop and mobile gallery smoke tests.
6. Commit the reviewed working tree on the current development branch.
7. Push the development branch.
8. Merge into the live branch through the repository's established pull-request or merge workflow.
9. Verify the deployed site, especially loading, Auto promotion, gallery close/reopen, and touch controls.

Never switch branches, commit, push, or merge unless the user explicitly authorizes those actions.

## Phase history

- Phase 0: gallery map whitespace issue closed.
- Phase 1: public-site audit and documentation completed.
- Phase 2: public polish completed; hero-only homepage and responsive baseline accepted.
- Phase 3: content/metadata curation closed by user decision on 2026-05-15; final curation remains pre-launch work.
- Phase 4: non-gallery editor improvements closed at Phase 4K; v9 category drag behavior accepted.
- Phase 5: About/contact and its editor pipeline closed at Phase 5K.
- Phase 6: mobile 3D gallery controls closed at Phase 6J.
- Phase 7: SEO/discoverability closed at Phase 7E with Lighthouse baseline Performance 98, Accessibility 100, Best Practices 93, SEO 100.
- Phase 8: gallery realism and adaptive performance active; Phase 8AM lighting is accepted, Phase 8AJ geometry is rejected, and Phase 8AN/AO is the current implementation baseline.

## Visible documentation changelog

### 2026-07-22 18:25 EDT - repository-wide consolidation follow-up

- Parsed all tracked and pending files outside `docs` for backup, replacement-pack, report, snapshot, archive, duplicate, and generated-artifact patterns.
- Preserved the former root changelog, replacement-pack manifest, obsolete root chat-upload script, and 12 unreferenced source/editor backup snapshots as supplemental records 368-382 in `PROJECT_HISTORY_ARCHIVE.md`.
- Replaced the 223 KB root changelog with a concise current release changelog while retaining its complete former contents in the archive.
- Removed the obsolete root uploader in favor of `scripts/New-TaylorPikePortfolioChatUpload.cmd` and its maintained PowerShell implementation.
- Removed `public/images/portfolio/thumb.zip` after verifying all 74 archive entries were byte-identical to active thumbnail files; no unique image data was removed.
- Updated `README.md` to reflect touch gallery support and the consolidated documentation paths.
- Audited public image references: 270 files are referenced, none are missing, and 31 unique WebP files (10,823,198 bytes) are currently unreferenced. These unique images were deliberately retained pending a curation decision rather than treated as disposable duplicates; three additional audit entries are required `.gitkeep` placeholders.

### 2026-07-22 18:35 EDT - scripts consolidation

- Parsed all 55 files under `scripts` for purpose, callers, current paths, and obsolete assumptions.
- Retained 15 operational scripts covering editor launch, image import/optimization/removal/validation, alt-text application, public-image reference/archive review, Lighthouse, and chat packaging.
- Preserved 40 retired scripts verbatim as archive records 383-422 before removing them from the active tree.
- Removed the local-editor launcher's optional dependency on the retired compatibility audit.
- Corrected `Validate-PortfolioImageData.ps1` so Node validation failures propagate as a nonzero PowerShell exit code.
- Final release validation found and cleared one stale gallery wall assignment to removed image ID `landscape-201019-jtp6059`; the wall remains placed and unassigned, matching existing empty-wall behavior.
- Final Playwright release testing hardened gallery-entry intent delegation against non-element event targets across pointer, focus, touch, and click events.

### 2026-07-22 18:04 EDT - documentation consolidation

- Parsed and inventoried all 367 existing files under `docs` (841,003 source bytes).
- Classified 106 phase records, 91 pack notes, 86 manifests, 23 operational documents, 11 handoffs, and 50 references.
- Identified nine byte-identical duplicate groups.
- Preserved every original source verbatim in `PROJECT_HISTORY_ARCHIVE.md` with original path, observed modification timestamp, byte count, category, and SHA-256.
- Replaced overlapping current handoffs, roadmaps, policies, phase files, pack notes, and manifests with this authoritative guide plus the complete history archive.
- Retained the staged alt-text JSON separately for script compatibility.

### 2026-07-22 - seamless quality/loading follow-up

- Staged Auto tier promotion across animation and idle boundaries.
- Deferred High shadow activation to an idle opportunity.
- Reduced High texture upload batches to one.
- Converted the loading overlay to opacity/visibility transitions.
- Converted the loading indicator to continuous linear compositor motion.

### 2026-07-22 - Phase 8AN/AO audit

- Completed install, build, import, asset, teardown, quality-policy, desktop, and mobile-emulation checks.
- Fixed failed background-prewarm retry behavior.
- Required both preview and artwork source readiness before marking the High cache tier ready.

### 2026-05-20 - Phase 8 visual development

- Recorded the Phase 8A-AM gallery material, lighting, recovery, rollback, and calibration sequence.
- Accepted Phase 8AM ceiling readability and fixture restraint as the High-quality lighting baseline.
- Rejected Phase 8AJ architectural ceiling/reveal geometry and restored the prior room geometry.

### 2026-05-18 - Phases 4-7

- Closed editor, About/contact, mobile gallery control, and SEO/Lighthouse work through Phases 4K, 5K, 6J, and 7E.

### 2026-05-12 through 2026-05-15 - foundation through Phase 3

- Established workspace, image-pipeline, data-validation, release, curation, public-polish, accessibility, and documentation workflows.
- Closed initial gallery/editor stabilization and public polish.
- Began and then closed Phase 3 content metadata work by user decision.

## Historical recovery

Use `PROJECT_HISTORY_ARCHIVE.md` when an exact superseded instruction, phase report, pack manifest, pack note, prior handoff, or historical decision is needed. Search by original filename; the archive index and every source record retain that filename. Use the recorded SHA-256 to compare against an external copy.
# Editor UX update — 2026-07-22

Phase 8AP adds bounded Gallery Curation undo (button and Ctrl/Cmd+Z), fixes placement-state synchronization, and refines the complete Flask editor with denser classic-Mac-inspired chrome. The update changes editor presentation and in-browser edit history only; active portfolio data, gallery room settings, image assets, and public-site curation are not modified by this pass.
