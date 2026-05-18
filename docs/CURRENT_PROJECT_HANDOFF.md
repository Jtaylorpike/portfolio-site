# Taylor Pike Portfolio — Current Project Handoff

Updated: 2026-05-18

## Current status

**Phase 7: SEO/discoverability and launch-readiness infrastructure is complete/closed as of Phase 7E.** Phase 7A added the SEO metadata infrastructure, Phase 7B switched the canonical/search baseline to `https://taylorpike.com/` and added the repeatable Lighthouse runner, Phase 7C fixed the homepage `View Portfolio` accessible-name/touch-target issue and added first-hero LCP preload hints, Phase 7D raised primary navigation type to the 12px Lighthouse mobile legibility threshold, and Phase 7E records the accepted closeout state. The post-Phase 7D Lighthouse baseline is Performance 98, Accessibility 100, Best Practices 93, and SEO 100, with FCP 1.5s, LCP 2.3s, Speed Index 1.5s, TBT 0ms, CLS 0, and TTI 2.3s. Hash routing remains the accepted architecture for now because the root SEO score is healthy, the user prefers the performance/simplicity of hash routing, and there is no report-backed need for a real-route/prerender migration yet.

**Phase 8: Advanced 3D gallery expansion, texture, and lighting is the next available future phase, but it has not started.** Treat Phase 8 as user-directed future work. It should preserve collision, wall placement, plaque fallback, editor curation logic, and the accepted mobile gallery controls while exploring the museum/private-archive room direction, texture/material improvements, lighting design, and possible room expansion.

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
- Phase 8: Advanced 3D gallery expansion, including room expansion, non-square/private archive layout, windows/time-of-day ideas, texture work, material refinement, and lighting design.

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
