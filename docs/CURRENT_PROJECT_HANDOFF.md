# Taylor Pike Photography Portfolio - Current Project Guide

Last updated: 2026-08-03 EDT (UTC-04:00)

This is the authoritative operational and handoff document for the repository. Historical documents, phase records, pack notes, manifests, earlier policies, and superseded handoffs are preserved verbatim in `PROJECT_HISTORY_ARCHIVE.md`. The staged portfolio alt-text dataset remains at `alt-text/portfolio-image-alt-text-20260515.json` because repository tooling consumes that path directly.

## Active completion roadmap - editor, then 3D gallery

User direction on 2026-07-28 establishes the following order:

1. Finish and harden the local portfolio editor.
2. Complete editor validation, responsive behavior, accessibility, and technical cleanup.
3. Commit the accepted editor checkpoint.
4. Finish polishing the 3D gallery environment without disturbing the accepted Phase 8AM lighting baseline.

### Editor E1 - About visual collage completion (active)

The fullscreen Macintosh-style About collage editor currently supports:

- A scaled desktop About-page composition with real copy and assigned imagery.
- Foreground editing for both upper-collage photos and all six lower-collage photos.
- A separate Background Only mode; background photos cannot be selected outside that mode.
- Persistent selection, click-off deselection, and double-click selection cycling through overlaps.
- Drag positioning and four-corner, aspect-locked wireframe resizing.
- Orientation-aware upper base imagery: portrait, landscape, or square follows the assigned source.
- Undo for movement, resize, layer, and rotation changes.
- Bring Forward / Send Backward layer controls.
- One-degree left/right rotation with a bounded range.
- A numeric 0-100 opacity field with Undo and live-page persistence.
- Reset Selected restores the current slot's default position, size, layer, rotation, and opacity.
- The selected-photo inspector reports placement group, position, size, rotation, opacity, and layer.
- Checkmark save and X/Escape discard behavior.
- Data-backed live rendering for custom position, size, layer, rotation, crop position, and crop scale.

Remaining E1 work:

- E1 implementation is complete pending user visual acceptance.

E1 parity validation on 2026-07-29:

- Measured the live About page and editor mockup at the same 1440x900 desktop viewport.
- Matched the editor upper coordinate-root aspect to the live upper collage.
- Matched the editor lower coordinate-root aspect to the live lower collage.
- Matched the editor background canvas aspect to the measured live About-page height.
- Replaced simplified background defaults with the live eight-slot position, width, opacity, and rotation contract.
- Matched the editor's default upper/lower layers to the live stacking contract.
- Verified normalized upper/lower position, width, rendered aspect, opacity, and layer values align between the editor and live page; remaining sub-percent differences come from the intentional rotation bounds and shallow public-page motion.
- Confirmed crop-frame aspects use the same upper, lower, background, and orientation-aware base-image ratios as the visual editor and public containers.

E1 acceptance criteria:

- Saving and reopening reproduces the accepted editor composition.
- The live About page follows the preview within normal rounding and responsive scaling.
- Background layers remain unselectable unless Background Only is active.
- Undo reverses every supported visual action without changing JSON until the checkmark is used.
- X and Escape discard the entire open editing session.

### Editor E2 - save and recovery hardening

- Track dirty state precisely enough to identify the affected editor area.
- Warn before closing a visual editor with unapplied changes.
- Avoid saving unrelated sections when a local visual-editor action is accepted.
- Preserve recoverable in-memory state after a failed save.
- Report exactly what the checkmark or Save Changes action persisted.
- Reconfirm backup creation and restoration for image, About, gallery, SEO, and architecture data.

Implementation started:

- Dirty state now names each affected editor workspace instead of reporting only a generic unsaved state.
- Closing the visual About composition with unapplied layout changes now requires explicit discard confirmation.
- The visual About checkmark uses a dedicated About-photo endpoint and no longer rewrites unrelated image, category, hero, or copy JSON.
- About crop saves use the same focused About-photo endpoint instead of invoking a full editor save.
- A failed About composition save leaves the accepted in-memory arrangement dirty and recoverable for another save attempt.
- Save operations use a shared in-flight lock to prevent overlapping writes; the global Save control remains disabled until the active request finishes.
- Failed primary saves explicitly identify the affected workspace and confirm that its in-memory changes remain available.
- JSON writes now use a flushed temporary sibling file followed by an atomic replacement, reducing the chance of a partially written source file.
- New backup restore points are considered complete only when they contain image, hero, category, gallery curation, gallery architecture, About photos, About copy, and SEO data.

### Future cloud transition constraints

Cloud migration is anticipated but is not current implementation scope. New editor work should preserve a clean browser/API/storage boundary so the local Flask backend can be replaced without redesigning the editor UI.

- The browser API client accepts an optional `EDITOR_API_BASE`; local same-origin behavior remains the default.
- Keep endpoint request and response contracts independent from Flask-specific behavior.
- Keep file persistence and backup logic behind backend functions rather than browser code.
- Do not begin authentication, Cloudflare storage, deployment, or infrastructure work until the migration phase is explicitly started.
- Keep the current GitHub Pages hash routes for now. Converting Home, Portfolio, About, and category views into separately crawlable canonical routes and sitemap entries is intentionally deferred to the Cloudflare migration period.
- When that phase begins, durable JSON revisions, uploaded assets, authentication, CSRF protection, authorization, and audit history must replace assumptions about a trusted local filesystem.

### Deferred post-portfolio editor direction

After the portfolio website is fully complete, evaluate turning the editor into a standalone, schema-driven editor for different kinds of websites. Use the About visual composition editor as the interaction reference and retain the 3D Gallery editor as an example of a specialized workspace. Do not begin this platform work until the user explicitly resumes it.

### Editor E3 - responsive editing

- Add tablet and mobile public-page previews.
- Add a separate mobile About collage composition when desktop coordinates do not translate cleanly.
- Improve narrow-screen editor navigation and fullscreen workspace controls.
- Verify crop frames and image placement at all supported preview sizes.

Implementation started:

- The fullscreen About composition editor now exposes Desktop, Tablet, and Mobile preview modes.
- Desktop remains the authoritative editable composition during the first E3 slice.
- Tablet and Mobile use responsive preview shells and are intentionally preview-only until separate responsive placement data is introduced, preventing accidental mutation of accepted desktop coordinates.
- Antigravity's responsive-preview audit passed all twelve functional, state-safety, accessibility, layout-analysis, build, gallery-layout, and portfolio-data checks. Its Playwright browser driver was unavailable because of an external CDN 404, so pixel-level automated screenshots remain unverified; no implementation defect was reported.
- Mobile now has an independent editable About-photo arrangement (`mobileX`, `mobileY`, `mobileWidth`, `mobileLayer`, `mobileRotation`, and `mobileOpacity`) that round-trips through the editor API and is applied by the public About page at the compact breakpoint. Existing records fall back to their desktop arrangement until Mobile is deliberately edited; Tablet remains preview-only.
- A real local Chromium pass found and fixed a mode-switch click-delegation bug: the selector previously matched the workspace's preview-mode attribute and intercepted other toolbar controls. The selector is now limited to device buttons. Desktop/Mobile isolation, drag, corner resize, rotation, opacity, layering, undo, Background Only, Tablet lockout, discard, focused API round-trip, 390px/760px public rendering, overflow, and console checks all passed. Temporary About data was restored after the persistence check.
- Narrow editor windows retain the active Macintosh File/Edit menu architecture with 44px menu triggers and items plus viewport-bounded dropdowns. The fullscreen About workspace uses the full dynamic viewport, separates its device/action controls into a compact toolbar, provides 44px compact targets, and collapses explanatory chrome before reducing the composition canvas.
- Local Chromium validation passed at 1024x768, 760x900, 390x844, and 844x390. The pass caught and fixed a 390px device-switcher overlap caused by a generic titlebar-span constraint and a stylesheet-order override that reduced compact File/Edit targets below 44px. Sticky menus, bounded dropdowns, workspace fit, independent canvas scrolling, selected modes, Mobile editing, rotation/Undo, Background Only, Tablet lockout, keyboard traversal, X-without-save, overflow, and console checks now pass across the matrix.
- Responsive crop-window validation passed across the same four viewport sizes. The modal now keeps its title and actions outside the scrolling body, uses a three-column phone action bar, provides 44px compact and short-landscape controls, and sizes short-landscape crop frames from available height without distorting their authored aspect. Local Chromium confirmed zoom, Cancel, containment, no overflow/errors, and exact frame parity for both upper slots, a lower slot, and a background-float slot.

### Editor E4 - copy and global content coverage

- Keep About copy user-authored and data-backed.
- Add editor coverage for homepage introduction and calls to action.
- Add entry-screen, gallery experimental/loading notice, portfolio label, navigation, and footer copy where still source-authored.
- Do not generate or replace final user copy without explicit direction.

Implementation started:

- Added typed `src/data/siteCopy.json` ownership for the existing entry-screen and homepage eyebrow, headline/statement, body, and action labels. The public renderers now consume that source with normalized fallbacks; wording was moved unchanged. Any editor integration in this phase must remain portfolio-specific and must not begin the deferred standalone-editor platform work.
- Added focused Site Settings controls and a portfolio-specific save contract for entry-screen and homepage copy. `siteCopy.json` now loads, validates, saves, backs up, and restores alongside the existing portfolio data without introducing the deferred general-purpose document registry.
- Extended the same contract to shared navigation labels, the portfolio archive label/headline/all-work filter, and footer ownership/rights copy while keeping the current year generated automatically.
- Moved the gallery release badge, persistent experimental notice, loading copy, and unsupported-WebGL fallback copy into the focused `siteCopy` contract and Site Settings editor without changing their accepted wording.

### Editor E5 - final QA, accessibility, and cleanup

- Add automated coverage for JSON load/save, imports, hero/About assignments, crops, collage layout, gallery walls, and backups.
- Add keyboard movement/resizing, focus trapping, change announcements, and reduced-motion verification.
- Audit empty, error, disabled, confirmation, tooltip, and keyboard-focus states.
- Consolidate historical editor CSS passes and remove superseded rules only after visual regression checks.
- Run production build, editor route smoke tests, desktop/mobile public smoke tests, and `git diff --check`.

Implementation started:

- Added a repository-owned `test:editor-contracts` suite covering complete `siteCopy` normalization, fallback preservation, combined site-settings persistence, backup contents, API payload rejection, and successful API response shape without mutating user data.
- Extended the suite with an isolated full-editor save regression that exercises categories, image metadata, hero assignments, About photos, About copy, and complete pre-save backups in a temporary data directory.
- Added a complete restore regression proving that portfolio, gallery, About, SEO, and site-copy documents recover together while the automatic pre-restore safety backup retains the state being replaced.
- Added focused image-update regressions proving crop/framing fields save only to the selected record, unrelated metadata and hero assignments remain stable, disallowed fields are ignored, the previous image state is backed up, and unknown image IDs fail safely.
- Added About-photo regressions covering placement roles, active/unused assignments, crop position and scale, desktop/background collage geometry, independent mobile geometry, layer/rotation/opacity preservation, safe clamping, persistence, and pre-save backups.
- Added focused gallery-wall regressions proving one-card saves preserve unrelated walls and back up the previous curation, while colliding placement changes are rejected before any backup or write occurs.
- Added portfolio/About import preflight regressions covering stable reviewed IDs, safe filenames, duplicate and existing IDs, unsafe IDs, unsupported formats, rendition overwrite prevention, About placement defaults, unused/inactive imports, and invalid placement rejection without processing real images.
- Added hero-assignment regressions and normalization safeguards so only unique landscape images survive in reviewed order; portrait, square, missing, and duplicate assignments are removed at save boundaries, invalid categories fall back safely, and direct validation rejects duplicate hero records.
- Added keyboard movement and aspect-locked resizing to the About visual editor, with larger Shift-modified steps, shared Undo support, focus-driven selection, and concise live position/size announcements.
- The fullscreen About visual editor now isolates the editor behind its modal, traps forward and reverse Tab navigation, and restores focus to its launcher after Apply, Cancel, or Escape.
- Reduced-motion handling is now enforced by a final editor-wide CSS contract after all component/style passes: smooth scrolling, transitions, crop snapping, and decorative animation resolve immediately when `prefers-reduced-motion: reduce` is active.
- The cross-route editor-state audit found no unnamed visible controls. About Photos now explains disabled crop editing directly on unused thumbnails, and the About visual editor's disabled arrangement controls are explicitly associated with its selection instructions.
- Added `npm run test:editor-browser` as a repeatable, non-mutating Chromium audit for all editor routes, visible control names, reduced-motion enforcement, disabled About crop explanations, About modal isolation, focus wrapping, Escape close, and focus restoration. It owns temporary port 5055 so the normal port-5000 editor can remain open and untouched.
- Began conservative editor CSS consolidation by removing 130 lines of exact duplicate Macintosh control declarations and the superseded early reduced-motion block. All eight routes retained matching computed layout/control styles; the final reduced-motion contract now physically follows every component pass.
- Completed the exact-duplicate portion of editor CSS consolidation by removing the remaining 13 repeated rule blocks (63 lines) across gallery maps, filters, import state, menus, and application-window surfaces. The stylesheet now reports zero byte-equivalent rule duplicates; broader cascade refactoring remains deferred unless visual regression coverage justifies it.
- Editor E5 implementation-level closeout passed on 2026-08-05: every editor JavaScript module parsed, Flask/Python sources compiled, all 22 isolated editor contract tests passed, all 66 portfolio records validated with zero errors or warnings, production and three-room/two-hallway layouts validated, and both fixture and production Vite builds completed. E5 is implementation-complete pending the separately owned browser/viewport runtime acceptance pass.

### 3D gallery polish - follows editor completion

After E1-E5 are accepted, resume gallery environment work in this order:

1. Audit the current modular rooms and hallways in Low, Medium, and High.
2. Increase Low- and Medium-quality gallery brightness so architecture, artwork, and wayfinding remain legible without adding expensive per-artwork lights, flattening image contrast, or changing the accepted High-quality lighting treatment.
3. Refine material scale, seams, trim junctions, track-fixture alignment, and architectural transitions.
4. Improve empty-room composition and wayfinding without adding game-like props.
5. Tune artwork presentation and plaque readability while preserving accepted curation.
6. Validate collision, traversal, loading, Auto quality, diagnostics, touch controls, and close/reopen behavior.
7. Complete the gallery's final feature phase with the deferred Living Environment pass described below. It begins only after the current visual, interaction, and lifecycle checks are accepted.
8. Run the required post-environment performance validation across Low, Medium, High, and Auto before the gallery is considered complete.

Gallery polish audit started:

- Confirmed Low, Medium, and High share the same architectural geometry; their differences remain renderer resolution, texture loading, optional lighting, and High-only shadows.
- Increased the existing architectural-fill intensities by 20% on Low and 10% on Medium. The adjustment adds no lights or geometry, leaves artwork-light budgets unchanged, and preserves every High-quality light intensity exactly.
- Corrected modular perimeter trim placement so base trim sits on each room wall's visible interior face instead of being centered and mostly buried inside the wall geometry.
- Preserved the accepted Phase 8AM High-quality intensities, colors, fixtures, and shadow policy.
- Reviewed the supplied `three-best-practices` package and Utsubo's 100-tip performance guide against the current implementation.
- Removed recurring movement-loop `Vector3`/`Euler` allocations and reused a stable artwork-focus raycast target list instead of rebuilding it every frame.
- Merged each artwork frame's four base rails, four inner highlights, and three lacquer catchlights into three static meshes. This preserves the existing frame profile while removing eight draw calls per displayed artwork (120 calls for the current 15-wall collection).
- Removed the unused frame shadow-edge material allocation that was not attached to scene geometry or reached by scene disposal.
- Normalized procedural surface UV density from real gallery dimensions. Floors, ceilings, modular perimeter walls, display walls, and their base trim now retain a consistent material scale instead of stretching one texture span across every object size.
- Added quality-aware anisotropic filtering for cached procedural environment textures: Low uses 1×, Medium requests up to 4×, and High requests up to 8× within the GPU's supported maximum. This improves floor and ceiling clarity at grazing angles without changing artwork textures or lighting.
- Removed coplanar overlap between modular floor planes and aligned their UV coordinates in world space. Connected rooms and hallways now meet at exact boundaries without z-fighting or restarting the procedural floor pattern at every module.
- Extended world-aligned UV projection to modular ceilings, split perimeter-wall segments, and rotated display walls. Texture coordinates now follow the gallery's shared world axes across module junctions instead of resetting per mesh.
- Shortened base-trim segments only at true perimeter endpoints so perpendicular pieces terminate at shared corner centerlines instead of extending through one another. Opening and hallway-cut edges retain their full authored spans, and suppressed sub-minimum trim geometry is disposed immediately.
- Rebased instanced track-light fixtures on displayed artwork records rather than generic wall blocks. Blank architectural walls no longer receive fixtures, track lengths follow frame width, and both heads aim at the actual artwork center while preserving the accepted lighting setup.
- Audited quality-tier artwork lighting and removed an unintended eight-artwork cap from the High-quality wall-wash pass. Medium retains its restrained first-eight accent spotlights, while High now adds one broad wall wash for every displayed artwork. Runtime diagnostics report lit/displayed artwork coverage and the active artwork-light count; the current 15-piece gallery should report `15/15 artworks lit (23 lights)` on High.
- Began the empty-room composition and wayfinding pass by converting the two existing blank entry guide walls into restrained, surface-applied collection markers. The central approach now directs visitors toward the Climbing left wing and Landscape right wing without adding freestanding props, changing collision geometry, or altering gallery lighting.
- Confirmed resolved portrait, landscape, and square dimensions already drive frame rails, mat geometry, image planes, and plaque clearance checks.
- Audited plaque readability and corrected a mismatch that stretched the canvas label across a differently proportioned physical plaque. Plaques now use a matched texture/mesh aspect, a modestly larger label surface, clearer title hierarchy, and up to 8x anisotropic filtering where supported. Existing plaque content, side preferences, and below-frame fallback placement remain intact.
- Rebuilt plaques as one shared body material plus one textured label plane instead of six independently materialed box faces. With all 15 current plaques enabled, this removes approximately 60 draw calls and reduces plaque material instances from 90 to 16 without changing visible plaque dimensions or placement.
- Added explicit WebGL context-loss handling. A lost graphics context pauses movement, focus raycasts, rendering, performance sampling, and diagnostics while the existing gallery loading surface reports the interruption. On browser context restoration, the active quality, optional lighting, resolution, and High shadow state are reapplied before the loading surface clears and diagnostics resume. Closing the gallery invalidates any pending recovery UI callback.

Pre–Living Environment production smoke results on 2026-07-29:

- A 1440x900 headless production render successfully opened the gallery and promoted from Low to High without runtime or console errors.
- High diagnostics confirmed `15/15 artworks lit (23 lights)`.
- The same High snapshot reported 148 draw calls, 6,596 triangles, 148 geometries, and 30 textures. Geometry complexity is modest, but draw calls remain above the documented near-100 target; compatible static architectural consolidation is therefore the next measured optimization candidate.
- Consolidated the active static display-wall faces into one material batch and their base trim into a second batch. Collision and editor placement continue to use the individual data records, the merged meshes retain their source wall-ID lists, and the combined wall mesh remains in the artwork-focus occlusion targets.
- A follow-up 1440x900 High production snapshot reported 120 draw calls, 6,596 triangles, 120 geometries, 29 textures, and `15/15 artworks lit (23 lights)`: 28 fewer calls/geometries with unchanged triangle and lighting counts.
- Batched the 15 active outer artwork-frame bodies into one instanced mesh while retaining per-artwork transform anchors for responsive dimensions, rails, mats, images, and plaque placement. High subsequently measured 108 draw calls, 6,620 triangles, 108 geometries, 30 textures, and `15/15 artworks lit (23 lights)` with no captured runtime or console errors.
- Batched the 15 artwork mats into one instanced plane while retaining per-artwork mat anchors and responsive dimension updates. The next High production snapshot measured 96 draw calls, 6,624 triangles, 96 geometries, 30 textures, and `15/15 artworks lit (23 lights)` with no captured runtime or console errors. This satisfies the current under-100 draw-call goal; stop consolidating unless later profiling identifies a regression.
- Removed the obsolete center-ceiling `ceilingAtmosphereLift` point light after visual review exposed its isolated warm hotspot in the middle of the room. Directional room fill, track fixtures, Medium artwork accents, and High all-artwork wall washes remain unchanged.
- Removed the unused legacy panel spotlight, panel target, panel shadow, and rectangular panel-wash builders plus their unreachable adaptive-shadow branch. The active lighting file now contains only the room baseline and artwork-lighting systems that the current gallery actually creates.
- Stabilized desktop pointer-lock camera movement after review found fast mouse input felt like sudden acceleration. Desktop sensitivity was reduced from `0.002` to `0.0012` radians per reported pixel, and each mouse event is capped at 64 pixels per axis to reject large browser/device spikes. Touch sensitivity and touch delta handling remain unchanged.
- Follow-up review found visible stepping while rotating in place on Low. All 15 artwork records already had complete dimensions, ruling out focus-loaded frame reflow. Desktop mouse events now update a target yaw/pitch and the render loop approaches that target with frame-rate-independent exponential response (`24 s^-1`), smoothing irregular pointer-event timing without adding continued inertial drift. Touch look remains direct.
- Increased desktop vertical mouse response by 3% after the smoothed motion felt slightly sluggish on the pitch axis. Horizontal response, smoothing strength, delta cap, and touch controls remain unchanged.
- Post-input production regression at 960x600 confirmed Low at 96 calls with `0/15 artworks lit (0 lights)`, Medium at 96 calls with `8/15 artworks lit (8 lights)`, and Auto remaining locked to Low for all six one-second samples in the constrained headless environment. Close cleanup returned the canvas count to zero with no captured runtime or console errors. The previously recorded High baseline remains 96 calls with `15/15 artworks lit (23 lights)`.
- A 390x844 touch production render opened with one canvas, exposed the touch control surface, produced no runtime or console errors, and removed the canvas while restoring the hidden overlay state on close.
- Headless smoke testing does not replace a visual walkthrough or physical collision/traversal check on representative hardware.
- The active production layout currently contains one room and no hallways. A separate fixture at `tests/fixtures/gallery-room-multi-module.json` now covers three connected rooms and two hallways without changing production data.
- `npm run validate:gallery-layout` validates both production and fixture layouts for module dimensions, unique IDs, movement-bound containment, valid start placement, hallway connection count, and full graph reachability from the starting room.
- The fixture currently validates the shared data/topology contract. A future browser-render fixture pass should supplement it before shipping a real multi-room production layout.
- Added a fixture-only Vite build that substitutes the three-room/two-hallway JSON without modifying production data. A static 1440x900 browser smoke pass confirmed the runtime rendered `3 rooms + 2 halls`, created one canvas, closed back to zero canvases, and produced no captured runtime or console errors.

### Final gallery phase - Living Environment

The previously deferred “time-aware window environment” is now defined more broadly as the final Living Environment pass. Its purpose is to make the gallery feel inhabited by a changing world without filling it with props, game-like effects, or movement that competes with the photographs.

Planned scope:

- Use the visitor's local browser time to select restrained dawn, day, dusk, and night environment states. This remains local-only: no location, weather service, account, telemetry, or network lookup is required.
- The shallow pyramidal/hipped glass-roof prototype was reviewed and rejected. Rooms retain their original flat ceilings, and this direction should not be revisited unless explicitly requested.
- A future exterior treatment, if any, should preserve the accepted room silhouette and flat-ceiling architecture.
- Let the room respond subtly through ambient color, exterior spill, and measured changes in architectural shadow while keeping dedicated artwork illumination stable enough to preserve photographic color and readability.
- Use very slow exterior light or sky movement to keep the environment from feeling frozen. Do not add interior dust particles, fog, people, decorative clutter, or constant animation.
- Provide a manual time preview/override for development and visual testing so every state can be reviewed without changing the computer clock.
- Respect reduced-motion preferences and pause nonessential environment animation when the page is hidden.
- Scale the effect by quality tier: Low receives a static time-appropriate state, Medium receives restrained transitions, and High may include the full exterior-light treatment only if diagnostics remain healthy.
- Preserve a deterministic fallback state when local time cannot be read or when automatic quality reduces the effect.

Foundation implemented:

- A local-only dawn/day/dusk/night resolver now derives the environment state from the visitor's browser clock, with deterministic hour bands and a noon fallback.
- Diagnostics now includes a persistent Local time/Dawn/Day/Dusk/Night preview selector and reports whether the resolved state is automatic or manually overridden.
- The resolver was introduced independently before the first visual environment treatment so its state could be validated without conflating it with geometry or lighting changes.

Reviewed visual prototype:

- The shallow four-plane glass-roof experiment was removed after review. Every room and hallway again uses the accepted flat ceiling.
- The architecture map's floating toolkit can hide or show its directional spawn marker without changing saved architecture data.

Acceptance boundaries:

- Artwork remains the visual priority in every time state.
- Night must remain navigable and must not obscure plaques, controls, exits, or collision boundaries.
- The feature must not cause Auto quality oscillation or introduce an ongoing network dependency.
- Existing accepted gallery lighting is the reference baseline; the Living Environment pass supplements architectural ambience rather than replacing the artwork-lighting system.
- Avoid real-time refraction, dynamic cubemaps, and mirror-like roof reflections. Low should use a static sky-colored treatment; Medium may add restrained time-state color; High may add directional exterior light or extremely slow sky motion only if the diagnostics baseline holds.
- This is the last feature phase. It starts after the current room walkthrough and Low/Medium/High regression checks, and it is followed by the required post-environment performance validation.

### Required post-environment performance validation

The Living Environment pass is not the end of technical validation. After it is visually accepted:

- Recheck Low, Medium, High, and Auto on representative desktop and touch hardware.
- Confirm the time-aware environment does not reintroduce Auto-quality oscillation.
- Compare frame cadence, renderer work time, draw calls, triangles, geometry count, texture count, and active light count against the pre-environment baseline.
- Validate every dawn/day/dusk/night state, including High-quality shadows and all-artwork lighting coverage.
- Confirm reduced-motion, hidden-tab pausing, context-loss recovery, gallery close/reopen, and texture-cache disposal still behave correctly.
- Reduce or tier optional environment effects if the new pass materially harms cadence or memory use.
- Record the accepted diagnostic ranges in this handoff before the final gallery checkpoint commit.

### Deferred optional concept - “64” quality tier

An optional future experiment may add a manually selected `64` tier that restyles the gallery with intentionally Nintendo 64-era texture treatment.

- Replace or transform environment, frame, plaque, fixture, and artwork-display textures with deliberately low-resolution, nearest-filtered, color-limited variants while preserving the existing room geometry and curation.
- Treat `64` as an artistic presentation mode, not as a claim that it is the lowest-performance fallback.
- Keep it out of Auto-quality promotion and demotion. Visitors must opt into it explicitly.
- Preserve readable controls, plaques, navigation, collision, and artwork metadata even when the visual treatment is deliberately coarse.
- Avoid downloading both normal and `64` texture sets unless the visitor selects the mode.
- Keep the mode isolated behind the existing texture/material boundary so it does not fork gallery movement, architecture, lighting logic, or editor data.
- Prototype it only after the Living Environment and required post-environment performance validation are complete, and retain it only if its memory and loading behavior remain acceptable.

Three.js practices audit priorities:

1. Keep now: progressive image loading, cached textures, delta-time movement, capped pixel ratio, High-only static shadows, track-light instancing, bounded focus raycasting, renderer diagnostics, and explicit scene/resource disposal.
2. Verify during visual polish: `renderer.info.render.calls` stays near the under-100 target on each tier; material scale remains consistent across differently sized walls; floor/ceiling texture filtering is acceptable at grazing angles.
3. Safe next optimization: consolidate compatible static architectural pieces only if diagnostics show draw-call pressure. Preserve editable wall identity and collision records.
4. Recovery behavior implemented: retain explicit WebGL context-loss feedback and restoration handling during regression testing.
5. Deferred unless profiling proves a need: KTX2 artwork delivery, baked lighting, BVH raycasting, WebGPU/TSL migration, antialiasing policy changes, and renderer replacement.

Reference used: `https://www.utsubo.com/blog/threejs-best-practices-100-tips` and the supplied `three-best-practices-1.0.0.tar.gz`.

Deferred UI/UX standardization:

- After gallery work, audit the public site and local editor using the supplied `make-interfaces-feel-better` guidance.
- Standardize optical alignment, text wrapping, dynamic-number typography, image-edge treatment, explicit transition properties, interaction states, and minimum control hit areas.
- Preserve the deliberate Macintosh editor language rather than replacing it with generic modern styling.

Protected gallery constraints remain in force:

- Phase 8AM High-quality lighting is canonical.
- Do not perform a general lighting redesign.
- Do not add benches, plinths, loose objects, fog, post-processing, or dependencies without approval.
- Do not reintroduce rejected black ceiling fields, end caps, reveals, recessed wells, or other game-like geometry.

### Current repository checkpoint

- `main` and `origin/main` include commit `f1419c5` (`Update Node runtime and fit landing viewport`).
- Node.js 24.x is the supported local and GitHub Pages build runtime; the workflow, package engine, and `.nvmrc` must remain aligned.
- The public audit fixes, third editable About copy block, favicon/brand assets, gallery frame constraints, and editor/public parity work are pushed.
- Root `AGENTS.md` is the shared operational guide for coding agents; active source remains authoritative when older phase prose conflicts.
- Preserve `analysis-reports/` and other untracked local audit output unless the user explicitly asks to review, archive, or delete it.

## Current status

Phase 8AN surface hierarchy and Phase 8AO adaptive quality are implemented and audited. Phase 8AP is now active as the performance-safe gallery completion and editor operational-recovery stage. Its first slice repairs deferred artwork preview delivery, smooths automatic demotion, adds direct quality selection, strengthens the continuously moving loading indicator, fixes the local-editor launch port contract, and adds editor coverage for active SEO metadata.

Phase 9A launch-readiness QA is active. Home, Portfolio, and About passed desktop/mobile production rendering, metadata, asset-response, skip-link, image-alt, runtime-error, and overflow checks. The About page now includes a third data-backed copy section; its temporary filler remains intentionally user-editable through the local editor.

Final launch closure is deferred by user direction while gallery development continues. The remaining gallery sequence ends with the Living Environment feature pass followed by a required performance-validation gate. The optional `64` texture tier remains a separate post-completion experiment.

Auto quality now reassesses sustained performance using both refresh cadence and measured gallery work. Stable 60 Hz rendering can promote, conservative device hints may be overridden by repeated real performance, and Save-Data/slow-network hints remain hard limits. Artwork textures present before scene subscription are now included in GPU-readiness accounting so cached initial textures cannot leave Auto permanently blocked at Low.

A temporary diagnostics panel is enabled automatically on `localhost` and `127.0.0.1`, or explicitly on a deployed build with `?galleryDiagnostics=1`. It displays quality, Auto ceiling, cache/GPU readiness, frame cadence, measured gallery work, render/device DPR, WebGL renderer, scene counts, and local browser hardware/network hints. It sends no telemetry.

Phase 8AQ visual direction is now defined as museum-painted walls, a lightly worn unfinished-concrete floor, matching dark-wood trim and artwork frames, High-tier restrained wood mottling, track-mounted gallery lights, a rough unfinished ceiling, and a dramatic modern/traditional atmosphere. The earlier herringbone floor and luminous skylight direction are superseded by the concrete-floor/rough-ceiling selection.

The Phase 8AQ entry-bay material prototype was promoted across the existing gallery room on 2026-07-23, then refined after review. The current room now uses a continuous matte procedural unfinished-concrete floor, clean museum-painted gallery walls, a rough irregular ceiling finish, and a shared cached dark figured-wood material for existing trim and artwork frames. Instanced dark track rails and paired adjustable heads replace the old visible panel models and align with the existing gallery-wall source zones. They are visual fixtures only and add no new Three.js lights. Phase 8AR subsequently removed the superseded panel-origin light loop by explicit user direction; artwork lighting, exposure, and quality behavior remain unchanged.

Phase 8AR establishes the modular L-layout foundation. Active `galleryRoom.json` now defines a 32×32 m square main room, a 30×26 m rectangular east room, a 28×28 m square north room, a 10 m short hallway, and a 16 m long hallway through normalized room/hallway module records. Runtime floors, ceilings, outer shell boundaries, trim, and movement use the union of those modules; shared connections remain open and the empty exterior corners of the L are not walkable. Gallery wall records now carry a `roomId` and use coordinates local to that room; existing records safely default to `room-main`. The Gallery editor includes a square pannable/zoomable grid, draggable room and hallway modules, editable module cards, add/remove controls, short/long hallway presets, connection-style selection, architecture save-with-backup, and integration with the existing Gallery Undo control. The wall map includes a room selector, isolates collisions and its drag sidebar per room, and assigns newly created or dropped walls to the selected room.

The obsolete omnidirectional ceiling-panel lighting loop was removed after the panel models were replaced by track fixtures. Existing artwork spotlights and wall washes remain, so the visible track heads now correspond to the directional artwork illumination without an unrelated ceiling glow behind them.

As of 2026-07-23 15:44 EDT, the architecture editor positions modules directly instead of transforming the entire grid plane, preventing pan/zoom compositor trails. Room and hallway placement magnetizes to neighboring borders and resolves overlaps. Hallways expose separate start- and end-connection alignment controls. The room selector now scopes both the wall map and wall-card list; legacy curation records correctly default to `room-main`, and Save All merges visible-room edits into the full record set so other rooms are preserved.

The future modular layout target begins with three current-room-scale rooms connected in an L. Ceiling height may increase modestly. Hallways use half-room-length and full-room-length presets, are slightly wider than the current hero wall, contain no artwork, and connect centered, left/right of center, or at corners. Hallway branching is deferred until the base room/connection model is stable. Later near-floor-to-ceiling windows should use a local-time forest/mountain exterior with quality-tiered clear reflections and interior daylight response; do not infer location from IP or add a location/network request without explicit approval.

Portfolio thumbnails now reserve their intrinsic aspect ratio and start loading in visual row order: the top image from each rendered column is requested first, followed by a very short downward cascade. Loaded thumbnails use a restrained opacity/blur reveal, with motion removed for `prefers-reduced-motion`.

The fullscreen image viewer measures controls against the rendered image. Close remains persistently visible with a minimum 44 px target; Prev/Next controls that overlap the image may become quiet while idle and reveal on pointer, touch, or keyboard activity. The page behind the modal is inert, and slide navigation preloads and decodes the incoming file before applying its source, orientation layout, and caption together.

The custom domain `https://taylorpike.com/` is active and remains canonical. GitHub Pages is the current host; Cloudflare migration and crawlable non-hash routes remain deferred.

The last accepted editor, gallery, About, accessibility, metadata, and agent-guidance work is pushed on `main`. Always inspect the live working tree for newer user-authored data before beginning another change.

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

Branch roles:

- `dev` is the integration and validation branch for all normal project work.
- `main` is the live GitHub Pages deployment branch.
- New work goes to `dev` first. Do not bypass `dev` unless the user explicitly authorizes an exception.

Before release:

1. Inspect `git status`, staged changes, and the complete diff.
2. Confirm no unintended active data, local-editor, image, room, or curation changes.
3. Run `npm ci` when dependency reproducibility needs confirmation.
4. Run `npm run build`.
5. Run the change-specific validation and relevant desktop/mobile smoke tests.
6. Commit the reviewed working tree on `dev` and push `dev`.
7. Confirm the working tree is clean and local `dev` matches `origin/dev`.
8. Update local `main` from `origin/main`, then merge the accepted `dev` state into `main` through the established merge or pull-request workflow.
9. Push `main` to trigger the live deployment.
10. Verify the deployed site, especially loading, Auto promotion, gallery close/reopen, and touch controls.

Never switch branches, commit, push, or merge unless the user explicitly authorizes those actions.

### Implementation and validation ownership

- Codex is responsible for new feature implementation and updates to the existing public-site, editor, data, and gallery architecture.
- Google Antigravity is responsible for performance testing, browser smoke testing, and runtime debugging.
- Codex continues to run build, type, syntax, data-integrity, fixture, and diff checks appropriate to the files it changes.
- Runtime or performance findings should be supplied back to Codex when an architectural or implementation change is needed.

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
