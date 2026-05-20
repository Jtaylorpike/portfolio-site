# Taylor Pike Portfolio — Current Project Handoff

Updated: 2026-05-19

## Current status

**Phase 8: Advanced 3D gallery texture, lighting, atmosphere, and room realism is active.** Phase 8AL is the current runtime baseline pending local visual review. It builds from the Phase 8AK rollback baseline and avoids new architectural geometry. It moves toward the provided dramatic gallery reference through warmer floor/wall material values, darker smoother ceiling atmosphere, less visually dominant existing ceiling-light panels, and small warm-pool lighting calibration. Phase 8AK remains the corrective rollback baseline that removed the rejected Phase 8AJ architectural geometry. Phase 8AJ is rejected after local visual review because the added ceiling fields, recessed fixture wells, base/floor reveal strips, and freestanding-wall end caps created intrusive black geometry and moved the gallery away from the provided reference image. Phase 8N remains the earlier accepted dramatic light-volume baseline, Phase 8K remains rejected/superseded for being much too dark, and Phase 8D remains fallback-only/not accepted unless explicitly applied later. Continue Phase 8 through smaller, reference-led visual passes that protect collision, wall placement, plaque fallback, gallery curation data flow, editor logic, accepted mobile controls, routing, public copy, image assets, and dependency boundaries.

**Phase 7: SEO/discoverability and launch-readiness infrastructure is complete/closed as of Phase 7E.** Phase 7A added the SEO metadata infrastructure, Phase 7B switched the canonical/search baseline to `https://taylorpike.com/` and added the repeatable Lighthouse runner, Phase 7C fixed the homepage `View Portfolio` accessible-name/touch-target issue and added first-hero LCP preload hints, Phase 7D raised primary navigation type to the 12px Lighthouse mobile legibility threshold, and Phase 7E records the accepted closeout state. The post-Phase 7D Lighthouse baseline is Performance 98, Accessibility 100, Best Practices 93, and SEO 100, with FCP 1.5s, LCP 2.3s, Speed Index 1.5s, TBT 0ms, CLS 0, and TTI 2.3s. Hash routing remains the accepted architecture for now because the root SEO score is healthy, the user prefers the performance/simplicity of hash routing, and there is no report-backed need for a real-route/prerender migration yet.

Phase 8 must preserve collision, wall placement, plaque fallback, editor curation logic, gallery curation data flow, and the accepted mobile gallery controls while exploring the museum/private-archive room direction, texture/material improvements, lighting design, atmosphere, and possible room expansion. Run proposed visual direction by the user before major UI/visual changes.

**Phase 6: Mobile 3D gallery controls is complete/closed as of Phase 6J.** The public Three.js gallery now opens on touch/coarse devices, supports a left thumb movement pad, supports drag-to-look camera control, preserves desktop pointer-lock/WASD behavior, uses the accepted Phase 6E movement responsiveness and Phase 6F touch-camera midpoint, removes internal wall-type labels from viewer-facing gallery metadata, and includes short-landscape phone handling for Home, Portfolio, and About. Phase 6I added the final touch-interruption hardening so active movement/look state clears during orientation changes, app switching, blur/page-hide events, touch-mode resize, and gallery teardown. Phase 6J is docs-only closeout: no runtime code changes were made.

**Phase 5: About/contact redesign is complete as of Phase 5K.** The About/contact page has the accepted vertical editorial layout, separate About image pipeline, data-backed copy editor, split About Copy/About Photos editor pages, responsive safeguards, accessibility polish, and closeout documentation. Final About image curation, final About copy, and final gallery setup remain pre-launch content tasks rather than active blockers.

Phase 0 is closed. The local editor gallery map whitespace issue was fixed and confirmed working by the user.

Phase 1 is closed. The public-site audit and documentation pass was completed.

Phase 2 is closed. Public polish was completed and pushed so that `dev` and `main` matched at the confirmed checkpoint. The public design baseline is stable and should not be churned unless the user identifies a specific issue.

Phase 3 is closed by user decision as of 2026-05-15. The portfolio image set may still feel large or unfinished, but the site is not close to public launch, so further content refinement can happen later without blocking editor work.

Phase 4 is closed with the Phase 4K non-gallery editor closeout pack. Phase 4A corrected the rename ID/title/suggestion refresh issue. Phase 4B added public hide/show visibility and bulk editor curation controls. Phase 4C improved bulk editor readability. Phase 4D improved import review workflow. Phase 4E through Phase 4G established the Adobe-inspired archive-editor visual system, dark mode, and gallery editor stabilization. Phase 4H-I-J added category drag ordering, dirty-state protection, and import collision hardening; v9 is the accepted drag threshold baseline. Phase 4K finishes remaining non-gallery editor polish with safer category management, category usage stats, backup restore clarity, and pack-note/manifest organization under `docs/`.

## Source of truth rules

Fresh uploaded current source files are the source of truth. If current source conflicts with memory, older handoffs, or previous replacement packs, follow the current source.

Keep the `docs/` folder updated as part of meaningful project changes. The docs folder is both a chatbot handoff mechanism and a human-readable project record.

Replacement packs should be root-relative: the zip root should contain changed project paths such as `src/`, `docs/`, and `PROJECT_CHANGELOG.md` directly, so the user can copy the contents into the project root. Do not place replacement files under `source/`, `01-source/`, or another wrapper folder. Do not put phase README files at the zip root; pack notes/manifests belong inside `docs/pack-notes/` and `docs/pack-manifests/`.

Do not treat older handoff snapshots as authoritative when they conflict with the current repo. In particular, older references to `public/images/logo/` are stale unless the current source actually contains that folder.

## Current architecture

- Vite + TypeScript static portfolio site.
- Vanilla TypeScript modules, not React.
- Three.js-powered public 3D gallery.
- Local editor is Flask-backed under `local-editor/`.
- Active data lives in `src/data/`.
- `public/data/` is stale/archive-only and should not be restored as active data.
- Public image paths are resolved through `import.meta.env.BASE_URL` for GitHub Pages project-path deployment.

## Active data files

```text
src/data/galleryImages.json
src/data/categories.json
src/data/heroSlides.json
src/data/galleryCuration.json
src/data/galleryRoom.json
src/data/aboutPhotos.json
src/data/aboutCopy.json
src/data/siteSeo.json
src/data/images.ts
src/data/aboutPhotos.ts
src/data/aboutCopy.ts
src/data/siteSeo.ts
```

## Active runtime image structure

```text
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/portfolio/texture/
public/images/portfolio/full/
public/images/ui/cards/
public/images/about/display/
public/images/about/thumb/
public/images/about/full/
```

There is currently **no active `public/images/logo/` folder**. Do not add or stage it unless logo assets are intentionally restored later.

## Current public-site baseline

The public site currently uses a hero-only homepage. The extra below-hero UI was removed because it created unnecessary scroll/visual weight.

The homepage should not require scrolling on a normal 1920x1080 desktop viewport in the current hero-only state.

The portfolio/index page had the red accent underline removed from the header. The extra “Open gallery room” button was removed from the portfolio meta strip because the gallery is already reachable from the top navigation and hero CTA.

The VCR/pixel-style font should be used only as a secondary or tertiary accent, especially on minor numeric UI details such as hero slide numbering. It should not replace primary interface typography and should not be used for the “Taylor Pike” header/wordmark text.

Final site copy should be written by the user. Do not generate final website prose, especially About page copy, unless the user specifically asks for draft copy.

## Mobile baseline

The public mobile pass included:

- tighter spacing between nav and hero;
- no mobile Enter Virtual Gallery button;
- no main hero body copy on mobile;
- mobile hero content reduced to Selected Work + View Portfolio;
- corrected Visual Index number spacing;
- compact two-column hero metadata where screen width allows;
- preserved portfolio category rail scroll position after category changes;
- mobile hero image performance improvements using smaller mobile-preferred sources and deferred preload behavior.

Phase 6 is now complete. Mobile/coarse devices can enter the real Three.js gallery rather than the old desktop-only fallback. The accepted mobile gallery interaction baseline is:

- left thumb movement pad for analog forward/back/strafe movement;
- drag-to-look camera control on the gallery canvas;
- Phase 6E movement responsiveness;
- Phase 6F touch-camera sensitivity midpoint;
- public gallery plaques/info cards without internal wall type labels;
- short-landscape phone guards for Home, Portfolio, and About;
- touch state cleanup on orientation/app-focus interruptions.

Future mobile work should be issue-driven rather than treated as an open phase.


## Phase 8 gallery environment state

Phase 8 is active. The current accepted visual direction remains a restrained museum/private-archive room, but the first material experiments need to be treated carefully because they introduced visible artifacts.

Current Phase 8 sequence:

```text
Phase 8A  Docs-only direction start. No runtime changes.
Phase 8B  First runtime material/lighting experiment. Mostly superseded.
Phase 8C  Removed experimental per-artwork contact-shadow scene wiring after a gallery-load report. Accepted after browser refresh.
Phase 8D  Generated full runtime rollback fallback. Not accepted/current unless explicitly applied.
Phase 8E  Removed wall/ceiling texture maps after screenshot showed a darker top-wall/cap band. Superseded by Phase 8F after motion-trace feedback.
Phase 8F  Corrective stability pass. Removed remaining procedural floor/paper texture maps, restored stable matte materials and pre-Phase-8B lighting, and explicitly set renderer frame-clear flags. User confirmed the movement tracer appeared to be gone.
Phase 8G  Accepted conservative visual restart. Refines flat material tones, low-cost lighting balance, scene/clear color, tone-mapping exposure, and ceiling-light fixture geometry without texture maps or shadow geometry.
Phase 8H  Frame and ceiling refinement. Adds deeper dark-wood frame material response, four-piece frame rail geometry, and subtle opaque ceiling relief strips without texture maps or shadow geometry. User visual review found the frame material too dark and not glossy enough.
Phase 8I  Partial frame-sheen improvement. Lightens the dark frame palette modestly, increases clearcoat response, and adds a narrow inner-sheen rail layer so the wood-like frame depth reads more clearly without texture maps, dynamic shadows, or room/collision changes. User reported it felt a little bit better, but not final.
Phase 8J  Dramatic-lighting/frame-highlight baseline after Phase 8L rollback. Lowered broad ambient fill, added focused non-shadow-casting ceiling spotlights, darkened the ceiling atmosphere, and added opaque frame catchlight/depth-edge rail geometry to move toward the approved dramatic museum/private-archive target.
Phase 8K  Rejected/superseded by Phase 8L before acceptance. Attempted a stronger dramatic lighting target refinement after the failed sandbox WebGL harness, but user visual review found the room much too dark with almost no visible lighting.
Phase 8L  Corrective rollback pack. Restored the Phase 8J runtime files while preserving the documentation trail that Phase 8K was too dark and should not be treated as current.
Phase 8M  Screenshot-guided lighting rebalance. Improved post-8K readability but local screenshots showed the ceiling remained too black and the fixture pools were not shaping the room enough. Superseded by Phase 8N.
Phase 8N  Accepted screenshot-guided light-volume refinement. Added non-shadowing Three.js RectAreaLight fixture/artwork wall washes, raised warm ceiling readability, strengthened fixture-driven pools, and warmed/layered the base palette without reintroducing texture maps, dynamic shadows, post-processing, fog, room changes, control changes, editor changes, assets, or package dependencies.
Phase 8O  Conservative polish pass after Phase 8N. Keeps the Phase 8N lighting architecture, slightly calms golden wall/copper frame warmth, keeps the ceiling atmospheric but more readable, softens visible panel glow, and records future local-editor basic/fast lighting plus visible spotlight/wall-wash fixture geometry as backlog items.
Phase 8AI Staged texture opening and ceiling lift. The user liked this lighting direction, so later work should preserve it unless explicitly asked otherwise.
Phase 8AJ Rejected after local visual review. Added ceiling fields, recessed fixture wells, base/floor reveal strips, and freestanding-wall end caps; the result created intrusive black geometry and did not match the provided gallery reference.
Phase 8AK Corrective rollback. Restores the Phase 8AI `GalleryScene.ts` and `galleryMaterials.ts` runtime files, removing the rejected Phase 8AJ geometry while preserving the documentation trail.
Phase 8AL Current baseline pending local visual review. Keeps the AK room geometry baseline and calibrates existing materials, fixtures, and lighting toward the provided reference without adding new architecture.
```

Phase 8AL should be treated as the current runtime baseline pending local visual review. Continue pursuing the approved dramatic museum/private-archive mockup through smaller, reference-led increments. Do not add new architectural geometry or fixture models until the visual direction is narrowed and approved against the reference. Future work should first study the reference image's real-world traits: warm localized artwork illumination, dark but smooth ceiling atmosphere, clean wall planes, subtle floor texture, restrained recessed lighting, and almost no decorative wall/end-cap geometry. Avoid collision changes, wall movement, editor/curation changes, new dependencies, external texture assets, or heavy post-processing unless explicitly approved. Future backlog remains: add a local editor basic/fast gallery lighting toggle after the dramatic lighting target is stable, and later add restrained physical source models for invisible wall-wash lights only after the room-shell direction is accepted.

Preserved Phase 8 boundaries:

- no room footprint changes;
- no wall placement changes;
- no movement/collision changes;
- no plaque placement/fallback changes;
- no gallery curation/editor changes;
- no mobile control changes;
- no routing/SEO changes;
- no favicon/logo/social preview work;
- no public copy changes;
- no new dependencies or image assets.

## Phase 7 SEO/discoverability state

Phase 7 is closed as of Phase 7E.

Completed Phase 7 implementation:

```text
src/data/siteSeo.json      # editable SEO metadata source; siteUrl now https://taylorpike.com/
src/data/siteSeo.ts        # typed normalization/fallback layer; fallback siteUrl now https://taylorpike.com/
src/app/seoController.ts   # route-aware document/meta/JSON-LD updates
src/app/siteRouter.ts      # applies SEO metadata after hash-route resolution
index.html                 # static baseline SEO/social metadata for crawlers and previews
public/robots.txt          # crawl allowance and sitemap pointer for https://taylorpike.com/
public/sitemap.xml         # canonical root URL sitemap baseline for https://taylorpike.com/
scripts/Run-LighthouseBaseline.ps1 # local/deployed Lighthouse baseline runner
```

Completed Phase 7 low-risk cleanup:

```text
index.html                            # first-hero mobile/desktop preload hints
src/app/sitePages.ts                  # homepage CTA accessible-name markup
src/app/siteInteractionsController.ts # dynamic CTA screen-reader context update
src/styles/global.css                 # sr-only utility, CTA touch target, and nav font-size overrides
```

Accepted post-Phase 7D Lighthouse baseline from the user's local production-preview run:

```text
Performance: 98
Accessibility: 100
Best Practices: 93
SEO: 100
FCP: 1.5s
LCP: 2.3s
Speed Index: 1.5s
TBT: 0ms
CLS: 0
TTI: 2.3s
```

The intended public URL/domain is:

```text
https://taylorpike.com/
```

Hash routing remains accepted for now. Hash routes do not create separately crawlable server paths, but the root SEO baseline is strong and the user currently prefers the performance/simplicity of the hash router. Only reconsider a real-route/prerender migration if deployed-domain data, Google Search Console evidence, or a clear launch requirement shows that separate crawlable routes are worth the architectural churn.

Deferred until later by user preference or roadmap placement:

- favicon/logo update after logo redesign;
- app-icon update after logo redesign;
- final social preview image asset after logo redesign;
- final launch metadata copy rewrite by the user;
- final image alt text/content metadata pass after launch curation;
- final image/gallery/homepage curation;
- homepage thumbnail rendition efficiency during the pre-launch image pipeline/performance pass;
- hash-router replacement unless deployment data justifies it.

## Phase 4 editor closeout state

Phase 4K is the non-gallery editor closeout baseline. Keep the Adobe-inspired archive-editor direction: neutral, compact, professional, panel-based, visually quiet, image-first, and free of decorative status icons. Do not use the VCR/pixel font inside the editor UI. The accepted category drag behavior is Phase 4H-I-J v9: direct card drag on category-specific image views only, single-placeholder model, short-click image preview navigation, and tuned symmetric thresholds.

Primary Phase 4 scope:

1. Add hide/show controls so photos can be hidden from the public website without deleting image data or rendition files — complete in Phase 4B.
2. Add bulk selection and bulk edit controls — complete in Phase 4B.
3. Add bulk hide/show selected photos — complete in Phase 4B.
4. Add bulk category reassignment — complete in Phase 4B.
5. Add bulk hero-candidate or hero-slide selection workflow, being careful not to accidentally overwrite curated final hero slides — complete in Phase 4B.
6. Add remove buttons to import review cards — complete in Phase 4D.
7. Rename “save review import” to clearer wording such as “Import X photo(s)” — complete in Phase 4D.
8. Add import progress bar and log/status text for larger imports — complete in Phase 4D with browser upload progress and stage-based backend processing status.
9. Create new categories directly from the import workflow — complete in Phase 4D.
10. Consider gallery eligibility controls if helpful for 3D gallery curation — optional remaining work.
11. Remove import crop/framing tools from import review cards — complete in Phase 4F.
12. Fix local-editor button bevel/inner-white-rim styling — complete in Phase 4F.
13. Fix false `galleryCuration.json` missing empty-state language — complete in Phase 4F.
14. Professionalize the Gallery editor UX/readability while preserving gallery data/runtime behavior — complete in Phase 4G.
15. Correct the Phase 4G gallery boolean/control treatment to remove the oversized green checkmark and align the editor with the approved Adobe-inspired archive direction — complete in Phase 4G v2.
16. Correct the Phase 4G v3 CSS pass with better Wall Finder layout, cleaner wall previews, less awkward image-selection UI, softer button styling, and local dark mode — complete in Phase 4G v5.

Completed in Phase 4A:

```text
Rename ID/title/suggestion refresh bug — corrected in Phase 4A v2
```

Completed in Phase 4B:

```text
Public hide/show data model + editor control + public filtering
Bulk selection framework
Bulk hide/show controls
Bulk category reassignment
Bulk hero add/remove controls for eligible public landscape images
```

Completed in Phase 4C:

```text
Bulk editor UI/readability polish
Higher-contrast Visible on site / Hidden from site / Homepage hero status chips
Selected-card visual state
Disabled bulk apply button until selection and update choices are present
Improved single-image public visibility wording
```

Completed in Phase 4D:

```text
Import review remove buttons
Dynamic Import X photo(s) wording
Import progress panel with upload percentage and log text
Category creation controls from the import workflow
Backend support for saving reviewed categories with an import transaction
```

Completed in Phase 4F:

```text
Flat editor button styling without the white inner bevel artifact
Import review cards simplified to metadata + thumbnail/lightbox only
Import crop/framing controls removed from import review
Gallery curation empty-state diagnostics added so existing galleryCuration.json files are not falsely described as missing
Editor asset version bumped to v=50
```

Completed in Phase 4G / 4G v2:

```text
Gallery editor archive-room control surface
Cleaner gallery summary, wall finder, wall cards, grouped room behavior controls, and overlays
Phase 4G v2 correction removed the oversized green checkbox treatment
Boolean controls now use compact neutral checkboxes
Gallery status chips use restrained neutral/amber states instead of loud success styling
The local editor does not use VCR/pixel typography
Editor asset version bumped to v=52
```

Remaining Phase 4 ordering:

```text
1. Optional gallery-specific bulk eligibility controls, if still useful
2. Future drag-and-drop ordering for category-specific Images views, excluding All images
3. Additional import progress streaming only if true backend per-file progress becomes necessary
```

## Alt text workflow

An alt-text first pass was generated from the thumbnail set and committed by the user. The project has an alt-only update script:

```text
scripts/Apply-PortfolioImageAltTextOnly.mjs
```

The script is intentionally designed to overwrite only the `alt` values in `src/data/galleryImages.json`, not reserialize or rewrite the entire JSON file.

## Future roadmap after Phase 4

- Phase 5: About/contact redesign.
- Phase 6: Mobile 3D gallery controls.
- Phase 7: SEO/discoverability and launch pass.
- Phase 8: Advanced 3D gallery expansion, texture, lighting, atmosphere, and room realism — active as of Phase 8A docs-only direction start.

## Phase 8A gallery environment direction start — 2026-05-18

Phase 8A starts the advanced 3D gallery environment phase without making visual runtime changes yet. The approved direction still needs user confirmation before implementation. The proposed Phase 8 direction is a restrained museum/private-archive room: warmer off-white plaster walls, subtle floor material detail, grounded base trim, softer ceiling/wall transitions, more intentional pools of light around artwork, modest fixture geometry, and optional later room expansion into a less-square archive layout.

The recommended first implementation pack after approval is Phase 8B: a reversible runtime environment pass limited to `src/gallery/environment/galleryMaterials.ts`, `src/gallery/environment/galleryLighting.ts`, possibly `src/gallery/GalleryScene.ts`, docs, and changelog. Phase 8B should not move wall slots, change collision math, alter gallery curation data, change mobile controls, add logo/social assets, or modify public copy.

## Latest editor visual state — Phase 4G v5

Phase 4G v6 plus the Phase 4H-I-J functionality pack is the current local-editor baseline. It keeps the Adobe/archive-editor direction from v3 but corrects the reported rough edges rather than treating v3 as finished.

Current visual constraints:

```text
No VCR/pixel font in the editor UI
No decorative/loud status icons
Neutral professional workspace
Softer compact software controls, not hard rectangles or marketing pills
Image-first archive/contact-sheet treatment
Gallery cards styled as inspector panels
Clean technical wall previews without decorative trim/baseboard/floor elements
Small selection-square UI instead of large Select Image overlays
Light/dark local editor theme toggle
No public-site behavior or styling changes
```

Editor asset version is now `v=57`.

## Phase 4G v6 gallery curation stabilization — 2026-05-15

The Phase 4G visual editor work was followed by a Gallery curation regression report. Phase 4G v6 is a narrow stabilization pack that re-ships the full Gallery editor frontend/API file set, preserves `galleryRoom` in editor state, bumps the editor cache to `v=56`, and avoids any public-site, Three.js, placement-math, collision, plaque-fallback, or schema changes.

## Phase 4H-I-J combined editor functionality pack — 2026-05-15

This pack implements the remaining core Phase 4 editor workflow items in one combined pass.

Completed:

```text
Category-specific image drag-and-drop ordering, excluding All images
Header saved/unsaved indicator
Route-change discard warning for unsaved editor changes
Reload Data discard warning
Clear Import Review discard warning
Frontend duplicate-filename import warnings
Backend import preflight before file writes
Backend rejection for duplicate import IDs, existing image IDs, invalid IDs, unsupported extensions, and existing rendition-file collisions
Backend cleanup of newly created import files if optimization or JSON validation fails mid-import
Editor asset version bumped to v=57
```

Manual test focus: drag order within one category, save/reload to confirm order persistence, confirm All images remains non-draggable, confirm discard warnings, and test duplicate/existing import IDs.



## Phase 4H-I-J v2 note — 2026-05-16

Category image drag ordering was corrected after user testing. Treat the current category ordering baseline as Phase 4H-I-J v2: drag category-specific image cards directly from non-control card areas; do not reintroduce a small handle-only drag interaction unless the user asks for it.


### Phase 4H-I-J v4 — Category drag interaction refinement

- Refines category-specific image drag ordering after the dynamic drag preview pass.
- Custom drag can start from photo previews without triggering native browser image drag.
- Short photo-preview clicks still open the individual image editor page, while a brief hold activates drag.
- Placeholder placement is calculated against real cards only to avoid the extra empty side cell/offset issue.
- All Images remains read-only for ordering.

## Phase 4H-I-J v5 category drag placeholder correction — 2026-05-16

The current category image drag-ordering baseline is Phase 4H-I-J v5. It corrects the placeholder offset/extra blank card issue by measuring the category grid without the placeholder in layout, keeps preview short-click navigation available, and only switches to a drag cursor after the drag activates. Editor assets are at `v=61`.

### Phase 4H-I-J v6 — Category drag single-placeholder fix

Phase 4H-I-J v6 supersedes the v5 category drag placeholder model. The source card now becomes the single grid placeholder while a cloned ghost card floats above the grid. This is intended to remove the extra adjacent blank-cell artifact that could appear during drag activation or movement. Window-level pointermove handling keeps the placeholder updating outside the immediate editor list area. Pack notes and manifests are now stored under `docs/` for this pack and future packs; `scripts/Move-PackDocsIntoDocs.ps1` can move older root-level pack docs into docs folders. Editor asset version is `v=62`.


## Phase 4H-I-J v7 category drag pacing refinement — 2026-05-16

Category-specific image ordering now keeps the Phase 4H-I-J v6 single-placeholder model and adds direction-aware insertion buffering so rightward drag movement is less snappy. This is a narrow interaction refinement only. Editor assets are at `v=63`.

## Phase 4H-I-J v8 category drag left-threshold tuning — 2026-05-16

Category-specific image ordering keeps the current v6/v7 drag baseline: source-card-as-placeholder, floating ghost preview, short-click photo navigation, press/hold drag activation, and non-draggable All Images. This v8 tuning lowers the left-side insertion threshold so the placeholder requires a more intentional move into a neighboring card's left side before crossing to that card's leading edge. Editor assets are at `v=64`.

## Phase 4H-I-J v9 drag threshold note

The latest category image drag-ordering tuning is Phase 4H-I-J v9. It keeps the working single-placeholder model from v6 and tunes the left/right insertion thresholds so dragging to the right side of a neighboring card requires a more intentional midpoint-style overlap instead of feeling like it activates after only a small portion of the card.



## Phase 5 About/contact active state — 2026-05-16

Phase 5A starts the About/contact redesign and creates a separate About image data/editor pipeline. The public About page now uses `src/data/aboutPhotos.json` through `src/data/aboutPhotos.ts`. The initial About photo set is seeded from existing portfolio portrait/editorial images as temporary references so the page can be designed before final personal/About images are imported.

About-native imports are intentionally separate from the portfolio archive and write to:

```text
public/images/about/display/
public/images/about/thumb/
public/images/about/full/
source-images/about-editor-imports/
```

The local editor now has an About section for About image import, ordering, activation, and metadata edits. Final public About copy should still be written by the user; the Phase 5A public page uses clearly marked placeholder copy blocks.

## Phase 5C About/contact update — 2026-05-16

The About/contact page now uses a three-layer image model controlled through `src/data/aboutPhotos.json` and the local editor About tab. About photo records support `placementRole` values of `upper-collage`, `lower-collage`, `background-float`, and `unused`. The public About page renders only the first two active upper-collage records in the top foreground collage, renders the lower-collage group separately, and uses background-float records as transparent scroll-linked background images. Final About copy remains placeholder-only/user-authored.

## Phase 5D About/contact collage refinement — 2026-05-16

Phase 5D refines the About/contact visual model and About editor organization. The upper collage now renders as a large base image with one smaller centered image stacked on top. Foreground About collage images are no longer hyperlinks and should not open source image files in new tabs. Background-float images are intentionally much larger and remain transparent/low-opacity with scroll-linked drift. The About editor now groups photo records into Upper collage, Lower collage, Background floats, and Unused / staged sections for clearer curation. Editor assets are at `v=70`.

## Phase 5E About/contact update — 2026-05-16

Phase 5E refines the public About/contact background-float image layer. Background-float images are now positioned so most spill intentionally off the browser edges by roughly 20-30%, while one float sits slightly off-center toward the middle of the page. This is a CSS-only public About page positioning refinement; About editor behavior, About data schema, public portfolio behavior, and gallery behavior are unchanged.

## Phase 5F About/contact background-float correction — 2026-05-16

Phase 5F corrects the About/contact background-float layer after screenshots showed the transparent background images were still locked to the centered content container. The float layer now renders outside the About `main` element and spans the full About page shell/viewport width, while the copy blocks and foreground collages remain constrained to the existing layout. Scroll-linked motion still applies to the background floats through the full About page shell selector.

## Phase 5G About/contact lower-collage and bottom-float correction — 2026-05-16

Phase 5G is a narrow visual correction after screenshot review. The lower foreground collage container no longer renders a large rectangular outline/background behind the photo stack; individual photo frames remain unchanged. The lowest background-float images now sit higher above the page bottom so they keep visible bottom margin even with scroll-linked drift. Phase 5F's full-width background-float breakout remains the current positioning baseline.

## Phase 5H About/contact background-motion refinement — 2026-05-16

Phase 5H refines the About/contact background-float animation after user feedback that the motion was too noticeable. The background floats remain full-width/viewport-aware and keep the Phase 5G bottom spacing, but their motion constants are reduced, their maximum transform offsets are smaller, and the previous side-to-side sine wobble is removed.

The intended visual direction is near-static atmospheric background photography with only slight parallax movement during scroll. About editor behavior, About data schema, foreground collage layout, placeholder copy, public portfolio behavior, and 3D gallery behavior are unchanged.

## Phase 5I About Copy Editor — 2026-05-16

The current About/contact page now has data-backed copy editing. Public copy is stored in `src/data/aboutCopy.json`, typed/normalized through `src/data/aboutCopy.ts`, and rendered by `src/app/sitePages.ts`. The local Flask editor About tab includes an About Copy section above the About image import controls.

The editor save payload, backend normalization, backup creation, and backup restore flow now include `aboutCopy.json`. This means the user can revise About/contact text in the editor while keeping final public copy user-authored. Current copy values remain placeholders until the user writes final copy.

After Phase 5I, remaining Phase 5 work should be responsive QA, accessibility/basic polish, and docs closeout unless the user identifies a specific About/contact issue.

## Phase 5J update — About editor page split

The local editor now treats About copy and About photos as separate editor pages:

- `#/about` opens About Copy by default.
- `#/about/photos` opens About Photos.

The split keeps Phase 5I's structured copy editor immediately available from the About nav item while moving the larger image import and curation controls to their own page. No data schema change was made.


## Phase 5K update — About responsive/accessibility closeout

Phase 5K closes Phase 5. It keeps the accepted About/contact visual direction and applies a final responsive/accessibility pass:

- tighter tablet and mobile spacing for the vertical About layout;
- safer mobile collage sizing and reduced decorative layers on narrow screens;
- long-copy and long-contact-value wrapping safeguards;
- keyboard-visible focus treatment for About/contact links;
- reduced-motion cleanup for About parallax/collage elements;
- section heading IDs with `aria-labelledby` relationships;
- safer data-backed contact email/link rendering;
- active-only fallback image selection for the upper About collage.

No final About copy or final About image curation was added. Those remain user-authored/pre-launch tasks. Phase 5 is now documented as complete, with Phase 6 mobile 3D gallery controls as the next recommended project phase.



### Phase 8P — Refined gallery lighting polish

Status: current runtime baseline pending local visual review.

- continues from the accepted Phase 8N/8O dramatic-lighting direction;
- responds to the latest user screenshots showing a working but still slightly gold/copper gallery palette;
- slightly neutralizes wall, shell, floor, trim, mat, and plaque materials;
- raises ceiling and ceiling-detail material readability toward warm charcoal/brown;
- softens and slightly shrinks the visible ceiling panel face inside the fixture frame;
- shifts fixture and wall-wash colors toward refined warm museum tungsten instead of saturated yellow;
- slightly lowers artwork wall-wash intensity so feature-wall illumination feels less rectangular and less gold;
- pulls frame rail/catchlight colors away from copper/orange and back toward dark stained walnut;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, image assets, routing, mobile controls, dependencies, public copy, and logo/favicon/social-preview deferrals.


### Phase 8Q — Cooled lighting and surface texture refinement

Status: current runtime baseline pending local visual review.

- continues from the accepted Phase 8N/8O direction and the Phase 8P refined-lighting polish pass;
- responds to the latest screenshots asking for cooler overall lighting, more surface character in the walls/floor, a mostly matte floor with only a hint of reflection, and lighting/shadow shaping closer to the approved dramatic mockup;
- shifts the wall/floor/shell/panel/palette toward a more neutral greige museum balance rather than amber/gold;
- introduces subtle deterministic low-frequency wall plaster and floor concrete texture maps directly in `galleryMaterials.ts` with no external assets;
- keeps the floor largely matte while using a very restrained `MeshPhysicalMaterial` response so it can catch a slight light reflection;
- cools and slightly narrows the fixture/artwork lighting balance without reintroducing dynamic shadows, post-processing, transparent shadow planes, or new dependencies;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, image assets, routing, mobile controls, dependencies, public copy, and logo/favicon/social-preview deferrals.


### Phase 8S — Surface texture enhancement

Status: current runtime baseline pending local visual review.

- continues from the accepted Phase 8N/8O/8P direction and the Phase 8Q cooling/surface-texture pass;
- responds to the latest screenshots showing visible floor/wall texture seam grids, an over-cool room balance, very dark flat-looking frame blacks, and a floating bottom frame strip;
- rebuilds the wall/floor procedural textures as lower-frequency tileable patterns to reduce visible repeat seams;
- adds a bit of warmth back into the room lighting and materials without returning to the earlier yellow/gold cast;
- lightens the dark-wood frame/rail palette so the frames keep depth instead of collapsing into black;
- removes the bottom frame depth-edge strip so the floating geometry under frames is no longer rendered;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, image assets, routing, mobile controls, dependencies, public copy, and logo/favicon/social-preview deferrals.


### Phase 8T — Texture visibility and ceiling readability

Status: current runtime baseline pending local visual review.

- continues from the accepted Phase 8R balance and the Phase 8S surface-texture attempt;
- responds to user feedback that Phase 8S textures were still not noticeable enough and that the ceiling remained too dark;
- makes the procedural floor/wall/ceiling material maps more visible while keeping them low-frequency and restrained;
- pushes the floor further toward faint matte marble / polished stone with cloudy veining;
- brightens the ceiling material and ceiling atmosphere lift so the gritty/chipped-paint shell texture can read against warm charcoal instead of near-black;
- keeps object shadows deferred to the next focused pass;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, image assets, routing, mobile controls, dependencies, public copy, and logo/favicon/social-preview deferrals.


### Phase 8U — Selective shadows and material readability

Status: current runtime baseline pending local visual review.

- continues from Phase 8T after the user reported that the marble texture still needed reimagining, the ceiling was too dark, and the material changes still felt too subtle;
- answers the user question about shadows by testing a capped selective dynamic-shadow pass rather than enabling expensive shadows everywhere;
- enables renderer shadow maps with `THREE.PCFSoftShadowMap`;
- allows only selected ceiling-panel spotlights to cast shadows;
- marks floor, walls, trims, frames, plaques, and relevant architecture as shadow receivers/casters where appropriate;
- reimagines the floor texture toward larger matte-marble / stone movement and increases material response;
- lifts the ceiling texture and emissive floor so it should read as warm textured charcoal rather than black;
- keeps post-processing, fog, transparent shadow planes, new image assets, new package dependencies, room footprint changes, wall placement changes, collision changes, plaque fallback changes, editor changes, mobile-control changes, routing changes, public copy, and logo/favicon/social-preview work out of scope.


### Phase 8V — Texture reference and loading feedback polish

Status: current runtime baseline pending local visual review.

- continues from Phase 8U after the user provided floor/wall/ceiling texture references and reported that the loading bar can feel hung during larger gallery-code work;
- preserves the capped selective-shadow experiment from Phase 8U;
- removes explicit ceiling-grid strip geometry so the ceiling reads through material texture instead of visible panel lines;
- makes wall sand/plaster texture more visible through stronger color, roughness, and bump maps;
- reimagines the floor toward a more readable faint matte-marble / stone effect with broader veining;
- lifts and textures the ceiling as warm charcoal knockdown/venetian plaster rather than near-black;
- adds gallery module prewarming during idle time and loading-phase text so the loading screen feels less frozen while large modules initialize;
- It does not change room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, dependencies, post-processing, fog, transparent shadow planes, logo/favicon/social-preview work, or external texture assets.


### Phase 8W — Gallery lighting import recovery hotfix

Status: build/runtime recovery hotfix. Phase 8X is the current texture/readability and loading-prewarm baseline pending local review. It continues after Phase 8V + Phase 8W, makes the procedural wall/floor/ceiling textures much more explicit and reference-driven, disables ceiling shadow receiving to remove the remaining grid/shadow-line read, keeps the selective-shadow architecture for other room surfaces, and adds material-module prewarming so generated environment textures are created before or during the loading phase instead of only during room construction.

- responds to a Vite import-resolution failure after Phase 8V: `Failed to resolve import "./environment/galleryLighting" from "src/gallery/GalleryScene.ts"`;
- root cause in the uploaded source: `src/gallery/GalleryScene.ts` imports `./environment/galleryLighting`, but `src/gallery/environment/galleryLighting.ts` was missing from the applied source tree;
- restores `src/gallery/environment/galleryLighting.ts` from the selective-shadow lighting baseline used by Phase 8U and expected by the current `GalleryScene.ts`;
- does not change room layout, wall placement, collision, plaque fallback, image assets, editor logic, public copy, routing, SEO, or the Phase 8V material/loading polish direction.


### Phase 8X — Texture reference and loading prewarm correction

Status: current runtime baseline pending local visual review.

- continues from Phase 8V + Phase 8W after the user confirmed the loader improved but textures still did not appear visible enough;
- keeps selective dynamic shadows but disables ceiling shadow receiving so shadow lines do not read as a ceiling grid;
- reworks generated floor texture toward clearer faint matte-marble / polished-stone movement;
- reworks wall material toward more legible sand/plaster texture;
- reworks ceiling material toward a warmer, brighter knockdown/Venetian-plaster charcoal texture with an emissive map so it remains visible under low light;
- adds `prewarmGalleryEnvironmentMaterials()` and starts material-module prewarming earlier through idle time, pointer intent, focus intent, and touch intent;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, image assets, routing, mobile controls, dependencies, public copy, and logo/favicon/social-preview deferrals.


### Phase 8Z — Gallery runtime recovery and lightweight textures

Phase 8AA is the current surface-restraint baseline pending local review. It was created after Phase 8Y caused the gallery to show the loading screen briefly and then return to the welcome screen. The likely issue was that Phase 8Y overwrote `src/gallery/environment/galleryMaterials.ts` without preserving the `prewarmGalleryEnvironmentMaterials` export expected by the active gallery controller, and it also used heavier per-pixel texture generation than is appropriate while the loader is already sensitive. Phase 8Z restores the expected prewarm export and replaces the heavy material generation with lower-cost Canvas-drawn texture maps for wall, floor, and ceiling surfaces.


### Phase 8AA — Surface restraint and ceiling balance

Status: current runtime baseline pending local visual review.

Phase 8AA responds to local screenshots after Phase 8Z. Phase 8Z successfully recovered the gallery runtime and made wall/floor/ceiling surfaces visible, but the result overshot: the wall surface read too blotchy, the floor marble became too visibly patterned, and the ceiling was readable but still needed restraint. Phase 8AA keeps the lightweight Canvas texture path and restored `prewarmGalleryEnvironmentMaterials` export, but reduces large wall blotches, replaces them with subtler organic sand/plaster grain, reins in floor marble contrast and directionality, and balances the ceiling texture so it remains readable without dominating the room.


### Phase 8AB — Surface unification and floor restraint

Phase 8AH is the current runtime baseline pending local visual review. It follows Phase 8AG after local screenshots showed slower loading and a ceiling that still read too dark. It removes the extra Phase 8AG ceiling rake point lights, reduces selective shadow-map cost, reduces procedural texture-generation footprint by moving color maps to smaller canvases and fewer marks, and lightens the ceiling through material and existing broad/local light balance rather than adding more light objects. It continues after Phase 8AF stabilized the room balance and wall/floor direction, but screenshots still showed the ceiling reading too close to a flat black plane. Phase 8AG keeps the wall/floor balance intact, increases the ceiling knockdown map and bump response, and adds very small localized ceiling rake/lift lighting so finish detail can separate around fixture pools without returning to a broad flat brown ceiling.

Validation notes: build passes with `npm run build`; the pack remains root-format and does not include node_modules, dist, or external texture assets.


### Phase 8AC — Ceiling texture recovery and overhead lift

Phase 8AC is the current runtime baseline pending local visual review. It continues from Phase 8AB after screenshots showed the room was more coherent and the floor/walls were more stable, but the ceiling still read as a broad, flat, heavy plane. This pass keeps the restrained wall/floor material direction intact, increases organic ceiling knockdown variation, slightly lifts ceiling material readability, and adds a small overhead/ceiling-atmosphere light lift. It preserves the lightweight Canvas texture path, `prewarmGalleryEnvironmentMaterials`, selective-shadow architecture, room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, dependencies, post-processing, fog, transparent shadow planes, logo/favicon/social-preview deferrals, and external-asset avoidance.


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

- continues from Phase 8AF after screenshots showed the overall room balance, wall texture, and floor direction were stable, but the ceiling still read too close to a black flat plane;
- keeps the Phase 8AF wall/floor restraint intact;
- increases the ceiling knockdown texture response and bump scale;
- adds very small localized ceiling rake/lift point lights to help the ceiling finish separate near fixture pools;
- avoids broad exposure changes, room layout changes, wall placement changes, collision changes, plaque fallback changes, editor/gallery curation changes, mobile-control changes, new dependencies, external texture assets, post-processing, fog, or public-copy changes.


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
