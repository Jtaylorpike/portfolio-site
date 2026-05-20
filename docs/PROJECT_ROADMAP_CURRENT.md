# Taylor Pike Portfolio — Current Roadmap

Updated: 2026-05-19

## Current project state

The portfolio is currently in Phase 8AK, a corrective rollback that removes the rejected Phase 8AJ architectural geometry and restores the Phase 8AI gallery scene/material runtime files.

The portfolio has completed Phase 7: SEO/discoverability and launch-readiness infrastructure as of Phase 7E. Phase 7A added the SEO metadata infrastructure, Phase 7B set the canonical/search baseline to `https://taylorpike.com/` and added the repeatable Lighthouse runner, Phase 7C fixed the homepage CTA accessible-name/touch-target issue and added first-hero LCP preload hints, Phase 7D raised primary navigation font sizing to the 12px Lighthouse mobile legibility threshold, and Phase 7E records the accepted closeout state. The accepted post-Phase 7D Lighthouse baseline is Performance 98, Accessibility 100, Best Practices 93, and SEO 100. Hash routing remains accepted for now.

Phase 8AK is the current 3D gallery baseline. It restores the Phase 8AI runtime after Phase 8AJ was rejected in local visual review. The next visual pass should pursue the provided dramatic gallery reference more directly through smaller changes, preserving the liked Phase 8AI lighting balance and avoiding broad new architectural geometry unless approved first.

The public design baseline is stable. The user is happy with the current portfolio direction. Future work should avoid broad visual churn unless a specific problem is identified.

Phase 3 is considered complete by user decision even though the portfolio may still feel large. The site is far from public launch, so final image reduction and final metadata polish can happen later.

## Source of truth rules

```text
1. Fresh uploaded current source files are the source of truth.
2. docs/ contains human-readable continuity and should be kept current.
3. PROJECT_CHANGELOG.md records durable project history.
4. Memories and older handoffs are backup context only.
5. If source conflicts with older docs/memory, follow source.
```

Active data lives in `src/data/`. Do not restore `public/data/` as active data.

Active runtime images live under:

```text
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/portfolio/texture/
public/images/portfolio/full/
public/images/ui/cards/
```

There is no active `public/images/logo/` folder.

## Phase 0 — Editor map whitespace closure

Status: complete.

The gallery map whitespace issue was fixed and confirmed by the user. Treat this as closed unless new visual evidence appears.

## Phase 1 — Public-site audit

Status: complete.

The audit established that the overall public design direction works and should be refined rather than redesigned.

## Phase 2 — Public polish

Status: complete.

Phase 2 completed the current public presentation baseline:

- homepage hero-only simplification;
- desktop homepage viewport-fit cleanup;
- narrow VCR/pixel accent use;
- portfolio/index header cleanup;
- removal of unnecessary gallery CTA from portfolio meta strip;
- global nav and interaction polish;
- mobile public-page spacing cleanup;
- mobile hero performance fix;
- lightbox accessibility and mobile swipe polish.

Phase 2 should not continue unless the user reports a specific public UI issue.

## Phase 3 — Content, image, and metadata curation

Status: complete by user decision.

Phase 3 established the current larger real portfolio content set and enough metadata coverage to move forward.

Deferred content work that can happen later:

- reduce or hide weaker images;
- refine the public launch image count;
- finish optional metadata fields;
- review alt text from the thumbnail-based first pass;
- finalize launch hero and 3D gallery selections.

## Phase 4 — Editor curation controls

Status: complete / closed with Phase 4K.

Completed so far:

- corrected and retested the rename ID + rendition/title/suggestion state-refresh bug in Phase 4A v2;
- added public hide/show visibility and bulk editor curation controls in Phase 4B;
- added bulk selection, bulk show/hide, bulk category reassignment, and bulk hero add/remove for eligible public landscape images;
- polished the bulk editor UI/readability so visibility state, selected cards, and valid apply states are easier to read;
- improved the import review workflow with remove buttons, clearer `Import X photo(s)` wording, upload progress/log feedback, and category creation during import;
- visually rehauled the local editor with an archive-editor direction, compact import thumbnails, and a full-size import preview lightbox;
- cleaned up button bevel artifacts, removed import crop/framing tools, and corrected the gallery curation false missing-file empty state;
- professionalized the Gallery editor UX/readability with an archive-room control surface, cleaner wall cards, clearer status chips, grouped controls, and matching overlay polish;
- corrected the Gallery editor control treatment in Phase 4G v2 so boolean controls are compact and neutral, with no oversized green checkmarks and no VCR/pixel typography in the editor;
- applied a CSS-forward editor overhaul in Phase 4G v3 and corrected rough edges in Phase 4G v5, including Wall Finder layout, wall-preview trim, Select Image overlays, softer buttons, a local dark-mode toggle, higher-contrast dark-mode surfaces, and a one-shape bulk selector plus higher-contrast dark-mode surfaces.

Phase 4K closeout adds the final non-gallery editor safety pass:

- category usage summary and per-category visible/hidden/hero counts;
- safer category removal with explicit reassignment target;
- duplicate category preflight checks before saving;
- clearer backup restore safety messaging and unsaved-change protection;
- pack notes/manifests organized under `docs/pack-notes/` and `docs/pack-manifests/`.

Deferred, not blocking Phase 4 closeout:

- optional gallery-specific eligibility controls;
- true backend-streamed per-file import progress;
- any additional editor visual polish not tied to a concrete issue.

## Phase 5 — About/contact redesign

Status: complete / closed with Phase 5K.

The user wants to redesign this page with personal photos cascading in the background and text blocks about:

- themselves;
- the project;
- their career journey so far;
- photography.

The user wants to write the actual page copy. Do not generate final About copy unless asked.

## Phase 6 — Mobile 3D gallery controls

Status: complete / closed with Phase 6J.

The 3D gallery is now viewable on mobile using a restrained touch control layer: left thumb movement pad plus drag-to-look camera controls. Desktop pointer-lock/WASD behavior remains intact.

Completed baseline:

- Phase 6A established the functional mobile-control baseline and removed the touch-device desktop-only fallback.
- Phase 6B polished hint behavior, safe-area spacing, movement-pad presentation, analog shaping, and drag-look jump protection.
- Phase 6C removed internal wall type labels from viewer-facing plaques and bottom-right artwork info cards.
- Phase 6D fixed the local editor individual image-card lower Save JSON button.
- Phase 6E increased touch movement responsiveness and made analog movement feel more immediate.
- Phase 6F reduced camera sensitivity to a midpoint between Phase 6B and Phase 6E while preserving Phase 6E movement responsiveness.
- Phase 6G fixed the horizontal-phone homepage hero overlay/crop issue.
- Phase 6H broadened the landscape-phone homepage guard for Pixel-class wide CSS mobile viewports.
- Phase 6I extended short-landscape phone handling to Portfolio/About and added touch state cleanup on orientation/app-focus interruptions.
- Phase 6J closed the phase with documentation updates only.

Future mobile work should be limited to specific device/browser issues reported after deployment. It should not reopen Phase 6 broadly.

## Phase 7 — SEO/discoverability and launch pass

Status: complete / closed with Phase 7E.

Phase 7A infrastructure completed:

- added `src/data/siteSeo.json` as the editable metadata source;
- added `src/data/siteSeo.ts` for typed defaults and normalization;
- added `src/app/seoController.ts` for route-aware document titles, descriptions, canonical links, Open Graph/Twitter metadata, and JSON-LD structured data;
- wired the hash router to update metadata on route changes;
- updated `index.html` with stronger static baseline metadata for crawlers/social previews that do not execute the app;
- added `public/robots.txt` and `public/sitemap.xml`.

Phase 7B completed:

- changed the canonical public URL baseline to `https://taylorpike.com/`;
- updated `siteSeo.json`, `siteSeo.ts`, `index.html`, `robots.txt`, and `sitemap.xml` to use the intended domain;
- added `scripts/Run-LighthouseBaseline.ps1` for repeatable local or deployed Lighthouse checks;
- documented the sandbox limitation that prevented a trustworthy local Lighthouse browser score here;
- completed static root-document SEO checks and a production build-size baseline.

Phase 7C completed:

- reviewed the user's local Lighthouse baseline: Performance 99, Accessibility 96, Best Practices 93, SEO 100;
- fixed the homepage `View Portfolio` accessible-name mismatch and touch-target warning;
- added first-hero image preloads for the current mobile and desktop LCP candidates;
- kept hash routing intact because the SEO score is already 100 and there is no report-backed need for route migration.

Phase 7D completed:

- raised primary public-site navigation font sizing to the 12px Lighthouse mobile legibility threshold;
- preserved the quiet uppercase editorial nav treatment with tighter tracking;
- left gallery plaque/card type, homepage metadata microtype, homepage thumbnail microtype, favicon/logo/social-preview work, hash routing, and thumbnail rendition work out of scope.


Phase 7E completed:

- accepted the post-Phase 7D Lighthouse baseline: Performance 98, Accessibility 100, Best Practices 93, SEO 100;
- recorded core metrics: FCP 1.5s, LCP 2.3s, Speed Index 1.5s, TBT 0ms, CLS 0, TTI 2.3s;
- confirmed the navigation font-size cleanup removed primary nav from the Lighthouse small-font warning list;
- closed Phase 7 without changing runtime code, CSS, data, images, routing, editor behavior, or public copy.

Current hash-routing position:

```text
Keep hash routing for now.
```

Reason: the user prefers its performance/simplicity and wants production Lighthouse results before deciding whether route architecture is worth changing. A hash-to-real-route or prerender migration should be considered only if deployment data, Search Console data, or a clear launch requirement shows that separate crawlable routes are necessary.

Remaining Phase 7 scope: none. Phase 7 is closed.

Deferred by user preference:

- favicon/logo update until after logo redesign;
- app-icon update until after logo redesign;
- final social preview image asset until after logo redesign;
- final SEO launch copy polish;
- final image alt text/content metadata pass after launch curation;
- final image/gallery curation;
- homepage thumbnail rendition efficiency until the pre-launch image pipeline/performance pass after final image/gallery/homepage curation.

## Phase 8 — Advanced 3D gallery expansion, texture, lighting, atmosphere, and room realism

Status: active as of Phase 8A.

Long-term direction: museum/private archive feeling.

Phase 8 should proceed in controlled passes because the current gallery has accepted collision, wall placement, plaque fallback, editor curation logic, and mobile touch controls.

Recommended ordering:

1. **Phase 8A — Direction and constraint start.** Define the gallery environment target and record what should not change yet. Complete in this docs-only pack.
2. **Phase 8B — Materials and lighting foundation.** Implemented, then mostly superseded. Added deterministic procedural wall/floor/ceiling/paper textures and warmer low-cost lighting balance. The static contact-shadow mesh experiment from this phase is superseded by Phase 8C, the wall/ceiling texture-map treatment is superseded by Phase 8E, and the remaining procedural floor/paper texture-map treatment is superseded by Phase 8F.
3. **Phase 8C — Gallery load recovery hotfix.** Implemented and accepted after a proper browser refresh. Restores the pre-Phase-8B `GalleryScene.ts` scene-construction flow and removes the experimental contact-shadow mesh/material code.
4. **Phase 8D — Full runtime rollback fallback.** Generated during troubleshooting but not accepted/current after the user clarified Phase 8C worked. Do not treat this as the active source state unless the user explicitly says it was applied.
5. **Phase 8E — Gallery surface tone correction.** Implemented, then superseded by Phase 8F after visual review. Removed wall and ceiling texture maps that caused the unappealing darker top-wall/cap band.
6. **Phase 8F — Gallery motion artifact cleanup.** Accepted correction pass. Removed remaining procedural floor/paper texture maps, restored stable flat matte material values and the pre-Phase-8B lighting balance, restored safer ceiling light panel behavior, and explicitly set renderer frame-clear flags.
7. **Phase 8G — Gallery tonal refinement restart.** Accepted conservative visual baseline. Refined flat material tones, low-cost lighting balance, scene/clear color, tone-mapping exposure, and ceiling-light fixture geometry without procedural texture maps or shadow geometry.
8. **Phase 8H — Frame and ceiling refinement.** Implemented deeper artwork frames, modest dark-wood frame material response, four-piece frame rail geometry, and subtle ceiling relief through opaque geometry rather than texture maps. User visual review found the frame material too dark and not visibly glossy enough.
9. **Phase 8I — Frame sheen tuning.** Partial refinement pass. Lightens the Phase 8H frame palette modestly, increases clearcoat response, and adds a narrow inner-sheen rail layer while preserving no texture maps, no shadow geometry, no collision changes, and no room layout changes. User reported it felt a little bit better, but frame refinement remained open.
10. **Phase 8J — Dramatic lighting and frame highlights.** Previous runtime baseline after Phase 8L rollback. Lowered ambient fill, added focused non-shadow-casting ceiling spotlights, darkened ceiling atmosphere, and added opaque frame catchlight/depth-edge rail geometry while avoiding dynamic shadows, procedural texture maps, post-processing, new assets, and layout/control changes.
11. **Phase 8K — Dramatic lighting target refinement.** Rejected/superseded before acceptance. Attempted a no-local-URL browser/WebGL test harness; Chromium could load inline code but could not create a WebGL context in the sandbox, so the final pass used target-image luminance analysis and source-level Three.js changes. User visual review found this pass much too dark with basically no visible lighting.
12. **Phase 8L — Dramatic lighting rollback to Phase 8J.** Corrective rollback. Restored the Phase 8J runtime files and records Phase 8K as rejected/superseded.
13. **Phase 8M — Screenshot-guided lighting rebalance.** Superseded by Phase 8N after local screenshots showed the ceiling still read too black and fixture lighting did not create enough visible surface illumination.
14. **Phase 8N — Light volume and ceiling readability.** Accepted runtime refinement. Added non-shadowing Three.js RectAreaLight fixture/artwork wall washes through the existing `three` dependency, raised warm ceiling readability, strengthened fixture-driven pools, and kept texture maps, dynamic shadows, post-processing, fog, new assets, package dependency changes, layout changes, control changes, and editor changes out of scope.
15. **Phase 8O through Phase 8AI — Gallery texture/readability, loading, and ceiling-lift iteration.** These passes refined the Phase 8N lighting architecture, recovered from a gallery import/runtime break, staged gallery texture opening, reduced early texture upload cost, reduced shadow cost to one low-cost ceiling spotlight, and lifted the ceiling while preserving the accepted lighting direction.
16. **Phase 8AJ — Ceiling architecture and modern fixture geometry.** Rejected after local visual review. Added ceiling fields, recessed fixture wells, base/floor reveals, and freestanding-wall end caps, but the result created intrusive black geometry and moved away from the provided dramatic gallery reference.
17. **Phase 8AK — Remove rejected Phase 8AJ geometry.** Current corrective baseline. Restores the Phase 8AI `GalleryScene.ts` and `galleryMaterials.ts` runtime files while preserving the documentation trail.
21. **Phase 8W/Future — Room expansion feasibility.** Evaluate larger/non-square room models, boundary modeling, and editor/runtime footprint sync before any permanent wall movement.
22. **Phase 8X — Optional window/time-of-day concept.** Treat windows and time-of-day behavior as later environmental storytelling after the room, materials, lighting, and performance behavior are stable.

Potential future work:

- larger gallery room;
- less square/non-rectangular room layouts;
- corridors or alcoves;
- archive-room direction;
- window wall/time-of-day concept;
- texture and material system refinement;
- wall, floor, ceiling, frame, and plaque material improvements;
- realistic or stylized lighting design;
- lighting performance strategy for the Three.js gallery;
- formalized room model from `galleryRoom.json`;
- careful preservation of collision, wall placement, plaque fallback, editor curation logic, and mobile gallery controls.

Phase 8 visual direction should be run by the user before major visible changes.

## Phase 4G v5 note

The local editor visual direction has been corrected toward an Adobe-inspired archive editor, but Phase 4G v5 should be treated as the current baseline rather than v3. Treat the editor design target as professional production software rather than a public-site page: compact panels, neutral gray workspace, softened software controls, restrained labels, image-first asset management, clean technical previews, and optional dark mode.

Do not use the VCR/pixel font in the editor UI. Before future visible editor UI changes, propose the component treatment first and get approval.

## Phase 4G v6 gallery curation stabilization — 2026-05-15

The Phase 4G visual editor work was followed by a Gallery curation regression report. Phase 4G v6 is a narrow stabilization pack that re-ships the full Gallery editor frontend/API file set, preserves `galleryRoom` in editor state, bumps the editor cache to `v=56`, and avoids any public-site, Three.js, placement-math, collision, plaque-fallback, or schema changes.



## Phase 4H-I-J combined editor functionality pack — 2026-05-15

The combined Phase 4H-I-J pack implements category-specific image drag-and-drop ordering, editor saved/unsaved state protection, route/reload/clear-import discard warnings, and stronger import collision/error handling. The All images view remains non-draggable. Import preflight now rejects duplicate IDs, existing IDs, invalid IDs, unsupported file types, and existing rendition-file collisions before writing files. Editor asset version is `v=57`.


## Phase 4H-I-J v2 category drag smoothing — 2026-05-16

Category image drag ordering now uses direct card dragging on category-specific Images pages. The previous handle-only interaction should be treated as superseded. The All images page remains read-only for ordering.


### Phase 4H-I-J v4 — Category drag interaction refinement

- Refines category-specific image drag ordering after the dynamic drag preview pass.
- Custom drag can start from photo previews without triggering native browser image drag.
- Short photo-preview clicks still open the individual image editor page, while a brief hold activates drag.
- Placeholder placement is calculated against real cards only to avoid the extra empty side cell/offset issue.
- All Images remains read-only for ordering.

## Phase 4H-I-J v5 category drag placeholder correction — 2026-05-16

Category-specific image ordering remains part of the active Phase 4 editor closeout work. The v5 drag correction should be treated as the current category drag baseline: placeholder placement is calculated with the placeholder temporarily removed from the CSS Grid, card preview short-clicks should open the image editor, and the cursor should remain normal until drag activation.
## Phase 4H-I-J v6 category drag single-placeholder fix — 2026-05-16

Category-specific image ordering should now treat the dragged source card as the single live placeholder while a cloned ghost card floats above the grid. This supersedes the v5 separate-placeholder model and is intended to remove the extra blank cell that appeared next to the actual placeholder. Pack notes and manifests are now placed under `docs/` instead of the project root for new packs.


## Phase 4H-I-J v7 category drag pacing refinement — 2026-05-16

Category-specific Images drag ordering remains part of the active Phase 4 editor closeout. The current drag baseline is v7: source-card-as-placeholder from v6 plus direction-aware insertion buffering to make rightward placeholder movement less abrupt. All Images remains read-only for ordering.

## Phase 4H-I-J v8 category drag left-threshold tuning — 2026-05-16

Category-specific Images drag ordering remains part of the active Phase 4 editor closeout. The current drag baseline is v8: source-card-as-placeholder from v6, rightward pacing buffer from v7, and reduced left-side crossing sensitivity so the placeholder does not move to the left of a neighboring card too eagerly. All Images remains read-only for ordering.

### Phase 4H-I-J v9 — Category drag symmetric threshold tuning

Status: completed as a narrow follow-up to the category drag ordering work. The implementation keeps category-only drag ordering, the single-placeholder drag model, the floating ghost card, short-click image navigation, and non-draggable All Images. The v9 adjustment brings right-side placement sensitivity closer to left-side placement by using a midpoint-oriented threshold rather than allowing the placeholder to settle after a small card overlap.



### Phase 5A — About/contact structure and separate About photo pipeline

Phase 5A creates the first About/contact redesign structure and adds a separate About photo pipeline. About-page imagery is stored in `src/data/aboutPhotos.json` and rendered through `src/data/aboutPhotos.ts`. Initial records reference current portfolio portrait/editorial images as temporary design placeholders. Future native imports from the editor write into `public/images/about/` instead of `public/images/portfolio/`, keeping About imagery separate from portfolio/gallery images.

The local editor now includes an About tab with import review, ordering, active/inactive controls, and metadata editing for About photos. This is intentionally separate from the existing Images/Import workflow.

### Phase 5B — Vertical About layout and portfolio-reference action

Phase 5B reworks the public About page toward the user's vertical mockup: a large copy block beside overlapping photos, a full-width copy band, a lower split photo/copy section, and subtle floating background imagery with scroll-linked movement. All copy remains placeholder-only.

Normal portfolio image edit pages now include an action to add that image to the separate About photo list as a `portfolio-reference` record. This reuses existing portfolio rendition paths and does not copy files into `public/images/about/`.

Final About copy remains user-authored. Placeholder copy exists only to preserve layout structure.

### Phase 5C — About three-layer collage controls

Phase 5C refines the public About/contact image layout into editor-controlled placement groups matching the user's updated mockup. About photo records now support `placementRole` values for `upper-collage`, `lower-collage`, `background-float`, and `unused`.

The public About page uses the first two active upper-collage records for the top foreground collage, the ordered lower-collage group for the lower foreground collage, and background-float records as low-opacity scroll-linked decorative images. The editor About tab exposes placement controls for existing About photos and import review records. Final About copy remains user-authored.

## Phase 5D refinement note — 2026-05-16

Phase 5D keeps Phase 5 active and refines the About/contact collage model before final copy or final About-specific photo selection. The About editor now separates records by placement role for clearer curation. The public About page now uses a stronger two-image upper collage, larger transparent floating background photos, and non-clickable foreground collage images.

Remaining Phase 5 work should focus on visual review, final About-specific image selection/import, and user-authored copy. Avoid broad public-site redesign unless specifically requested.

### Phase 5E — About background-float positioning refinement — 2026-05-16

Completed a CSS-only refinement to the public About page background-float placement. Background images are larger atmospheric elements, with most floats spilling beyond the viewport edges and one float positioned near the middle of the page field.

### Phase 5F — About background-float viewport breakout

Status: completed as a focused layout correction. The About background-float layer now behaves as page-wide atmospheric imagery instead of being constrained to the centered content column. Foreground collage behavior, About editor controls, About data schema, and final-copy placeholders remain unchanged.

## Phase 5G About/contact lower-collage and bottom-float correction — 2026-05-16

Phase 5G is a narrow visual correction after screenshot review. The lower foreground collage container no longer renders a large rectangular outline/background behind the photo stack; individual photo frames remain unchanged. The lowest background-float images now sit higher above the page bottom so they keep visible bottom margin even with scroll-linked drift. Phase 5F's full-width background-float breakout remains the current positioning baseline.

## Phase 5H About/contact background-motion refinement — 2026-05-16

Phase 5H is a narrow public About page motion refinement. The background-float photos keep their full-width edge-spilling placement and bottom margin, but their scroll-linked drift is much smaller and no longer uses side-to-side sine-wave wobble. Remaining Phase 5 work should continue with visual review, final About-specific imagery, and user-authored copy.

## Phase 5I completed — About Copy Editor

Phase 5I adds editor-managed About/contact copy. Public About text is now data-backed via `src/data/aboutCopy.json` and editable from the local editor About tab. Final image curation and final gallery curation remain pre-launch content tasks rather than current blockers.

Next recommended Phase 5 work:

1. Responsive QA for About/contact across desktop, tablet, and mobile.
2. Accessibility/basic polish for links, focus behavior, image alt review readiness, and readability.
3. Phase 5 docs/handoff closeout.

After Phase 5 closeout, move to the next public/mobile phase, including the known future 3D gallery mobile control work.

## Phase 5J status — About editor page split

Complete. The About editor is split into a default About Copy page and a separate About Photos page. Final About image curation remains a pre-launch content task rather than a current blocker.

Next recommended sequence:

1. Responsive/accessibility closeout for Phase 5 About/contact.
2. Responsive pass for the public site phases the user identified as 4, 5, and 6.
3. Later pre-launch content curation for About photos and 3D gallery setup.


## Phase 5K closeout — responsive/accessibility/docs

Complete. Phase 5K closes the About/contact redesign phase with responsive safeguards, basic accessibility polish, and updated handoff documentation.

Completed in Phase 5K:

- tablet/mobile spacing safeguards for the public About/contact page;
- narrow-screen collage sizing cleanup and reduced decorative background load on very small screens;
- wrapping safeguards for long user-authored copy, long email addresses, and optional contact links;
- visible keyboard focus styling for contact links;
- stronger reduced-motion handling for About/collage parallax elements;
- semantic section labeling through `aria-labelledby` relationships;
- safe email/contact-link rendering from `aboutCopy.json`;
- active-only fallback image behavior for the About upper collage;
- Phase 5 closeout handoff documentation.

Deferred until pre-launch:

- final About copy written by the user;
- final About photo curation;
- final public/3D gallery curation.

Current phase after Phase 8P: Phase 8 is active. Phase 8T is the current texture-and-ceiling-readability baseline pending local review unless local visual review rejects it. Future Phase 8/editor backlog includes a basic/fast local-editor gallery lighting toggle after the dramatic lighting target is stable, and restrained visible spotlight/wall-wash fixture geometry for the currently invisible wall-wash/artwork accent lights. Final content curation, final copy, logo/favicon/social-preview work, and thumbnail rendition efficiency remain deferred until their appropriate pre-launch or redesign points.


### Phase 8V status update — texture reference and loading feedback polish

Phase 8AH is the current runtime baseline pending local visual review. It follows Phase 8AG after local screenshots showed slower loading and a ceiling that still read too dark. It removes the extra Phase 8AG ceiling rake point lights, reduces selective shadow-map cost, reduces procedural texture-generation footprint by moving color maps to smaller canvases and fewer marks, and lightens the ceiling through material and existing broad/local light balance rather than adding more light objects. It continues after Phase 8AF stabilized the wall/floor direction but screenshots still showed the ceiling reading too close to a black flat plane. Phase 8AG keeps the current wall/floor restraint, increases the ceiling knockdown/bump response, and adds very small localized ceiling rake/lift lighting rather than making broad room/exposure changes. It does not change room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, dependencies, post-processing, fog, transparent shadow planes, logo/favicon/social-preview work, or external texture assets.


### Phase 8V status update — texture reference and loading feedback polish

Phase 8AH is the current runtime baseline pending local visual review. It follows Phase 8AG after local screenshots showed slower loading and a ceiling that still read too dark. It removes the extra Phase 8AG ceiling rake point lights, reduces selective shadow-map cost, reduces procedural texture-generation footprint by moving color maps to smaller canvases and fewer marks, and lightens the ceiling through material and existing broad/local light balance rather than adding more light objects. It continues after Phase 8AF stabilized the wall/floor direction but screenshots still showed the ceiling reading too close to a black flat plane. Phase 8AG keeps the current wall/floor restraint, increases the ceiling knockdown/bump response, and adds very small localized ceiling rake/lift lighting rather than making broad room/exposure changes. It does not change room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, dependencies, post-processing, fog, transparent shadow planes, logo/favicon/social-preview work, or external texture assets.


### Phase 8W — Gallery lighting import recovery hotfix

Status: build/runtime recovery hotfix. Phase 8V remains the current visual/material baseline pending local review.

- responds to a Vite import-resolution failure after Phase 8V: `Failed to resolve import "./environment/galleryLighting" from "src/gallery/GalleryScene.ts"`;
- root cause in the uploaded source: `src/gallery/GalleryScene.ts` imports `./environment/galleryLighting`, but `src/gallery/environment/galleryLighting.ts` was missing from the applied source tree;
- restores `src/gallery/environment/galleryLighting.ts` from the selective-shadow lighting baseline used by Phase 8U and expected by the current `GalleryScene.ts`;
- does not change room layout, wall placement, collision, plaque fallback, image assets, editor logic, public copy, routing, SEO, or the Phase 8V material/loading polish direction.


### Phase 8X status update — texture reference and loading prewarm correction

Phase 8X is the current runtime baseline pending local visual review. It keeps the Phase 8U/V selective-shadow architecture, removes ceiling shadow receiving to avoid grid-like ceiling lines, makes the generated wall/floor/ceiling textures significantly more legible, and adds material-module prewarming so generated environment textures are prepared before or during the loading phase rather than only during room construction. It does not change room geometry, wall placement, collision, plaque fallback, editor curation logic, controls, image assets, routing, public copy, package dependencies, transparent shadow geometry, post-processing, or fog.


### Phase 8Z status update — gallery runtime recovery and lightweight textures

Phase 8AA is the current surface-restraint baseline pending local review. It responds to the Phase 8Y runtime failure where the loading screen appeared briefly and then returned to the welcome screen. The pack restores the material prewarm export expected by the current gallery controller and replaces the heavier Phase 8Y procedural texture generation with lower-cost Canvas-drawn texture maps. It preserves the room footprint, wall placement, collision, plaque fallback, editor logic, mobile controls, routing, public copy, dependencies, post-processing boundaries, and external-asset deferrals.


### Phase 8AA — Surface restraint and ceiling balance

Status: current runtime baseline pending local visual review.

Phase 8AA responds to local screenshots after Phase 8Z. Phase 8Z successfully recovered the gallery runtime and made wall/floor/ceiling surfaces visible, but the result overshot: the wall surface read too blotchy, the floor marble became too visibly patterned, and the ceiling was readable but still needed restraint. Phase 8AA keeps the lightweight Canvas texture path and restored `prewarmGalleryEnvironmentMaterials` export, but reduces large wall blotches, replaces them with subtler organic sand/plaster grain, reins in floor marble contrast and directionality, and balances the ceiling texture so it remains readable without dominating the room.


### Phase 8AC status update — ceiling texture recovery and overhead lift

Phase 8AH is the current runtime baseline pending local visual review. It follows Phase 8AG after local screenshots showed slower loading and a ceiling that still read too dark. It removes the extra Phase 8AG ceiling rake point lights, reduces selective shadow-map cost, reduces procedural texture-generation footprint by moving color maps to smaller canvases and fewer marks, and lightens the ceiling through material and existing broad/local light balance rather than adding more light objects. It continues after Phase 8AF stabilized the wall/floor direction but screenshots still showed the ceiling reading too close to a black flat plane. Phase 8AG keeps the current wall/floor restraint, increases the ceiling knockdown/bump response, and adds very small localized ceiling rake/lift lighting rather than making broad room/exposure changes.

Next likely Phase 8 work should be screenshot-guided: either object-shadow refinement, visible spotlight/wall-wash fixture geometry, a restrained warmth pass, or a deeper loader/chunk-splitting pass if the gallery still appears to freeze during first open.


### Phase 8AF — Surface detail visibility and ceiling finish

Status: current runtime baseline pending local visual review.

- continues from Phase 8AC after screenshots showed the gallery was coherent and readable, but the ceiling still felt too broad, uniform, and brown;
- keeps the restrained wall and floor material direction intact;
- pulls the ceiling material back toward darker warm charcoal;
- reduces broad uniform ceiling emissive/overhead wash so the ceiling does not read as one flat brown plane;
- slightly strengthens localized ceiling-panel light pools so fixture-driven lighting remains visible;
- preserves the lightweight Canvas texture path, `prewarmGalleryEnvironmentMaterials`, selective-shadow architecture, room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, dependencies, post-processing boundaries, and external-asset avoidance.


### Phase 8AG — Ceiling finish separation and localized rake light

Status: current runtime baseline pending local visual review.

- follows Phase 8AF screenshots where the room balance looked stable but the ceiling still read too black/flat;
- keeps the current floor and wall material direction;
- increases ceiling texture/bump response and adds two very low-intensity localized ceiling rake/lift lights;
- intentionally avoids broad exposure changes or another global material rewrite.


---

## 2026-05-19 — Phase 8AI staged texture open and ceiling lift

Phase 8AI is the latest Phase 8 gallery visual/performance pass. It responds to local review after Phase 8AH: gallery first-open loading was still slower than desired and the ceiling still needed to read lighter. A Chrome trace from the user showed a long gallery-open frame with image decode/GPU work during the opening path.

Current Phase 8AI source changes:

- `src/gallery/artwork/galleryTextureLoader.ts` now waits only on priority preview textures before scene construction and streams deferred preview/full artwork textures in small idle batches.
- Preview/thumb texture uploads no longer generate mipmaps, reducing early GPU cost.
- `src/gallery/GalleryScene.ts` can accept deferred preview texture updates and prevents a later preview from replacing an already-loaded full texture.
- `src/gallery/environment/galleryLighting.ts` keeps only one low-cost shadow-casting ceiling spotlight and lowers the shadow map size to `384`.
- `src/gallery/environment/galleryMaterials.ts` keeps the floor/wall direction while making the ceiling lighter and reducing procedural texture generation counts.

The intended visual direction remains the dramatic museum/private-archive lighting reference: dark controlled ceiling atmosphere, focused warm artwork illumination, restrained surface texture, matte stone/marble-like floor, and frames with depth. If loading still feels frozen, the next pass should add a true fast/basic gallery lighting mode or staged scene construction rather than more small material-only tweaks.


### Phase 8AL — Reference-led surface and light calibration

Status: current runtime baseline pending local visual review.

Phase 8AL follows the Phase 8AK rollback and avoids repeating the rejected Phase 8AJ geometry approach. It makes smaller, reference-led changes inside the existing gallery shell: warmer floor and wall material values, darker smoother ceiling atmosphere, thinner/smaller existing light-panel geometry, and mild lighting recalibration that lowers broad fill while preserving warm artwork pools. It does not change room footprint, wall placement, collision, plaque fallback, editor/curation logic, mobile controls, routing, public copy, image assets, dependencies, fog, post-processing, or external texture assets.

