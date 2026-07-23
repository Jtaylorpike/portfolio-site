# Taylor Pike Photography Portfolio - Current Project Guide

Last updated: 2026-07-23 16:25 EDT (UTC-04:00)

This is the authoritative operational and handoff document for the repository. Historical documents, phase records, pack notes, manifests, earlier policies, and superseded handoffs are preserved verbatim in `PROJECT_HISTORY_ARCHIVE.md`. The staged portfolio alt-text dataset remains at `alt-text/portfolio-image-alt-text-20260515.json` because repository tooling consumes that path directly.

## Current status

Phase 8AN surface hierarchy and Phase 8AO adaptive quality are implemented and audited. Phase 8AP is now active as the performance-safe gallery completion and editor operational-recovery stage. Its first slice repairs deferred artwork preview delivery, smooths automatic demotion, adds direct quality selection, strengthens the continuously moving loading indicator, fixes the local-editor launch port contract, and adds editor coverage for active SEO metadata.

Phase 9A launch-readiness QA is active locally. Home, Portfolio, and About passed desktop/mobile production rendering, metadata, asset-response, skip-link, image-alt, runtime-error, and overflow checks. The homepage semantic heading and sitemap date were corrected without visible redesign. Final user-authored About copy remains the primary content blocker.

Final launch closure is deferred by user direction while gallery development continues. The next planned gallery sequence is material/fixture refinement, followed by a modular room-and-hallway runtime/editor foundation and later locally time-aware window environments.

Auto quality now reassesses sustained performance using both refresh cadence and measured gallery work. Stable 60 Hz rendering can promote, conservative device hints may be overridden by repeated real performance, and Save-Data/slow-network hints remain hard limits. Artwork textures present before scene subscription are now included in GPU-readiness accounting so cached initial textures cannot leave Auto permanently blocked at Low.

A temporary diagnostics panel is enabled automatically on `localhost` and `127.0.0.1`, or explicitly on a deployed build with `?galleryDiagnostics=1`. It displays quality, Auto ceiling, cache/GPU readiness, frame cadence, measured gallery work, render/device DPR, WebGL renderer, scene counts, and local browser hardware/network hints. It sends no telemetry.

Phase 8AQ visual direction is now defined as museum-painted walls, a lightly worn unfinished-concrete floor, matching dark-wood trim and artwork frames, High-tier restrained wood mottling, track-mounted gallery lights, a rough unfinished ceiling, and a dramatic modern/traditional atmosphere. The earlier herringbone floor and luminous skylight direction are superseded by the concrete-floor/rough-ceiling selection.

The Phase 8AQ entry-bay material prototype was promoted across the existing gallery room on 2026-07-23, then refined after review. The current room now uses a continuous matte procedural unfinished-concrete floor, clean museum-painted gallery walls, a rough irregular ceiling finish, and a shared cached dark figured-wood material for existing trim and artwork frames. Instanced dark track rails and paired adjustable heads replace the old visible panel models and align with the existing gallery-wall source zones. They are visual fixtures only and add no new Three.js lights. Phase 8AR subsequently removed the superseded panel-origin light loop by explicit user direction; artwork lighting, exposure, and quality behavior remain unchanged.

Phase 8AR establishes the modular L-layout foundation. Active `galleryRoom.json` now defines a 32×32 m square main room, a 30×26 m rectangular east room, a 28×28 m square north room, a 10 m short hallway, and a 16 m long hallway through normalized room/hallway module records. Runtime floors, ceilings, outer shell boundaries, trim, and movement use the union of those modules; shared connections remain open and the empty exterior corners of the L are not walkable. Gallery wall records now carry a `roomId` and use coordinates local to that room; existing records safely default to `room-main`. The Gallery editor includes a square pannable/zoomable grid, draggable room and hallway modules, editable module cards, add/remove controls, short/long hallway presets, connection-style selection, architecture save-with-backup, and integration with the existing Gallery Undo control. The wall map includes a room selector, isolates collisions and its drag sidebar per room, and assigns newly created or dropped walls to the selected room.

The obsolete omnidirectional ceiling-panel lighting loop was removed after the panel models were replaced by track fixtures. Existing artwork spotlights and wall washes remain, so the visible track heads now correspond to the directional artwork illumination without an unrelated ceiling glow behind them.

As of 2026-07-23 15:44 EDT, the architecture editor positions modules directly instead of transforming the entire grid plane, preventing pan/zoom compositor trails. Room and hallway placement magnetizes to neighboring borders and resolves overlaps. Hallways expose separate start- and end-connection alignment controls. The room selector now scopes both the wall map and wall-card list; legacy curation records correctly default to `room-main`, and Save All merges visible-room edits into the full record set so other rooms are preserved.

The future modular layout target begins with three current-room-scale rooms connected in an L. Ceiling height may increase modestly. Hallways use half-room-length and full-room-length presets, are slightly wider than the current hero wall, contain no artwork, and connect centered, left/right of center, or at corners. Hallway branching is deferred until the base room/connection model is stable. Later near-floor-to-ceiling windows should use a local-time forest/mountain exterior with quality-tiered clear reflections and interior daylight response; do not infer location from IP or add a location/network request without explicit approval.

Portfolio thumbnails now reserve their intrinsic aspect ratio and start loading in visual row order: the top image from each rendered column is requested first, followed by a very short downward cascade. Loaded thumbnails use a restrained opacity/blur reveal, with motion removed for `prefers-reduced-motion`.

The fullscreen image viewer now measures controls against the rendered image. Desktop landscapes use a wider top/side control rail so Close does not bleed into the photograph. After two seconds without frame activity, Close collapses in place into its right border when it is not fully inside the image, while any Prev/Next controls intersecting the image fade to a low opacity. Pointer/touch activity and keyboard focus reveal the controls again. Slide navigation preloads and decodes the incoming file before applying its source, orientation layout, and caption together, so the outgoing image retains its dimensions until the replacement is ready.

Deployment smoke testing on 2026-07-23 found the GitHub Pages project URL responding successfully at `https://jtaylorpike.github.io/portfolio-site/`, while the intended canonical custom domain `https://taylorpike.com/` returned HTTP 404. Do not silently change canonical metadata; resolve the Pages custom-domain/DNS configuration or explicitly approve the GitHub project URL as canonical before launch.

The last accepted editor and Phase 9A public-site work is pushed on `main`. The adaptive-quality reassessment correction described above is currently an uncommitted local follow-up.

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

### 2026-07-23 16:25 EDT - live-readiness static deployment pass

- Corrected the two critical homepage preload URLs to honor Vite's GitHub Pages base path; the Pages artifact now resolves them beneath `/portfolio-site/` while the future custom-domain build continues to use `/`.
- Added a lightweight, noindex static 404 page with a Home link that resolves correctly on both GitHub project Pages and a custom domain.
- Revalidated the GitHub Pages-mode production artifact: build passes, `robots.txt`, `sitemap.xml`, and `404.html` are present, and both preload paths are deployment-safe.
- The remaining external launch step is configuring the intended custom domain in GitHub Pages and DNS. About-page content remains intentionally deferred for user-authored copy.

### 2026-07-23 14:38 EDT - Phase 8AR multi-room editor usability

- Reworked the architecture preview into a square grid with zoom controls, unlimited panning, and direct module dragging with half-meter snapping.
- Added room ownership to gallery wall records; runtime wall positions translate room-local coordinates through the selected room center.
- Added a room dropdown to the gallery wall map, with per-room markers, sidebar contents, placement collisions, and new-wall assignment.
- Preserved all existing walls through the `room-main` fallback while allowing new walls and artwork curation in the other rooms.
- Replaced junction wall retraction with full solid wall joins, suppressed trim protrusion at internal endpoints, and overlapped procedural floor planes by four centimeters to close connection-corner voids.
- Browser-tested architecture drag, zoom, east-room wall creation, and room assignment without saving active curation data; no runtime errors occurred.

### 2026-07-23 13:55 EDT - Phase 8AR compact layout and junction correction

- Reduced the modular layout to 32×32 m and 28×28 m square rooms plus one 30×26 m rectangular room.
- Replaced the original 17 m/34 m hallway presets with shorter 10 m/16 m presets and updated the editor labels and normalization contract.
- Repositioned the modules so both shorter hallways continue to meet their adjoining room boundaries exactly.
- Retracted wall and base-trim endpoints by half the shell thickness only at module junctions, removing protruding dark notches and stepped connection corners without shortening exterior corners.
- Rebuilt successfully and browser-checked all five editor modules and both revised hallway preset labels with no runtime errors.

### 2026-07-23 13:51 EDT - Phase 8AR editor architecture builder

- Added a live top-down preview and editable module cards to the Gallery editor.
- Added room and hallway creation/removal, center and dimension fields, half/full hallway presets, and centered/left/right/corner connection metadata.
- Added a dedicated validated `/api/gallery-room` save path with repository backups and preservation of existing future-model notes.
- Integrated architecture additions, removals, and field edits with the existing Gallery Undo control.
- Browser-tested add hallway and undo without saving active data; five modules became six and returned to five with no runtime errors.

### 2026-07-23 13:42 EDT - Phase 8AR connection traversal correction

- Removed the independent player-radius inset from each modular movement zone; it had created an invisible 1.04-meter gap between otherwise connected rooms and hallways.
- Added a 4-centimeter overlap at shared module thresholds so normal frame-stepped movement crosses both L-layout connections continuously.
- Retained the union-based movement boundary so the empty exterior corners of the L remain inaccessible.

### 2026-07-23 13:12 EDT - Phase 8AR modular L-layout foundation

- Added normalized schema-version-2 records for three rooms in an L, one half-length hallway, one full-length hallway, and centered connection styles.
- Built runtime floor, ceiling, perimeter-wall, trim, and movement-zone generation from the shared module records.
- Preserved the current artwork/categorization installation in the main room; new rooms and hallways begin empty.
- Updated the local-editor data normalizer so room/hallway records survive editor loads, saves, backups, and restores.
- Removed the obsolete omnidirectional panel-origin light loop while retaining directional artwork spotlights and wall washes associated with the track fixtures.

### 2026-07-23 12:41 EDT - Phase 8AQ concrete and track-light direction

- Replaced the reviewed fishbone floor with a continuous lightly mottled unfinished-concrete material and removed the parquet texture from active prewarming.
- Selected the rough unfinished ceiling direction over the luminous skylight prototype.
- Replaced the old visible panel fixture models with instanced track rails and paired adjustable heads aligned to existing gallery-wall source zones.
- Preserved every accepted Phase 8AM lighting value; the new fixtures emit no Three.js lights and add no collision geometry.

### 2026-07-23 12:34 EDT - Phase 8AQ material rollout

- Accepted the single-bay museum material prototype and promoted it across the existing gallery without changing architecture, collision, curation, or lighting.
- Enlarged the procedural fishbone scale slightly and retained its lighter natural-oak palette.
- Applied the cached museum-paint material to gallery walls and the shared dark figured-wood material to existing room trim, wall trim, and artwork frames.
- Kept the accepted Phase 8AM ceiling presentation untouched; the next stage is the luminous-skylight versus rough-unfinished ceiling comparison.

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
