# Chat Transfer and Upload Workflow

Updated: 2026-05-19

## Purpose

This project depends on accurate handoffs between chats. The upload package should carry enough active source, documentation, and selected runtime image assets for another assistant to understand the current codebase without relying on stale memory.

The upload script was modernized because the older script still searched for legacy image folders such as `card-optimized`, `gallery-optimized`, `thumbnails`, and `public/images/logo`. The active site no longer uses those paths.

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

There is currently no active `public/images/logo/` folder. Do not add or stage that path unless logo assets are intentionally restored later.

## Standard upload command

From the repo root:

```powershell
.\scripts\New-TaylorPikePortfolioChatUpload.cmd
```

Default mode is intentionally small and should include source/docs/changelog plus thumbnail-level runtime image assets where configured.

## Runtime image modes

Use one of these depending on the next chat task:

```powershell
.\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode thumb
.\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode display
.\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode all
.\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode none
```

Use `thumb` for most handoffs. Use `display` when the next chat needs to visually inspect photos or generate/review alt text. Use `all` only when upload limits allow and full runtime coverage is needed.

For editor code work, `thumb` or `none` is usually enough unless the task specifically needs runtime image inspection.

## What future upload packages should include

At minimum:

```text
src/
local-editor/
docs/
scripts/
public/fonts/
public/images/ui/
public/images/portfolio/thumb/    # or display/all depending on mode
index.html
package.json
package-lock.json
tsconfig.json
vite.config.ts
PROJECT_CHANGELOG.md
```

## Next chat instruction

In a new chat, upload the latest generated chat package and say:

```text
This is my current Taylor Pike portfolio site source. Read the docs folder first, especially CURRENT_PROJECT_HANDOFF.md, CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md, PROJECT_ROADMAP_CURRENT.md, CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md, and the latest changelog entries. Treat the uploaded source as the source of truth. Phase 7 SEO/discoverability and launch-readiness infrastructure is complete/closed as of Phase 7E. The accepted post-Phase 7D Lighthouse baseline is Performance 98, Accessibility 100, Best Practices 93, and SEO 100. Hash routing remains accepted for now. Phase 8 advanced 3D gallery texture, lighting, atmosphere, and room realism is active. Phase 8A was docs-only. Phase 8B/8C introduced and then recovered the first runtime environment work. Phase 8D was generated as a fallback rollback but is not the accepted/current state unless explicitly applied. Phase 8E removed the wall/ceiling texture maps that caused an unappealing darker top-wall/cap band. Phase 8F is the accepted corrective stability pass: it removed the remaining procedural floor/paper texture maps, restored the stable pre-Phase-8B lighting/material baseline, and explicitly set renderer frame-clear flags after the user reported a greenish-grey motion trace around wall geometry; the user confirmed that tracer appeared to be gone. Phase 8G is the accepted conservative visual restart. Phase 8H deepened the artwork frames and added subtle ceiling relief. Phase 8I partially improved frame sheen. Phase 8N was accepted after the user said it looked great. Phase 8AK is the current corrective baseline after Phase 8AJ was rejected in local visual review. The user liked the Phase 8AI lighting direction, so Phase 8AK restores the Phase 8AI `GalleryScene.ts` and `galleryMaterials.ts` runtime files and removes the rejected Phase 8AJ ceiling fields, recessed fixture wells, base/floor reveal strips, and freestanding-wall end caps. Phase 8K is rejected/superseded because it made the room much too dark with basically no visible lighting. Preserve collision, wall placement, plaque fallback, editor curation logic, gallery data flow, and accepted mobile controls. Final public About copy, final metadata copy, favicon/logo/social preview assets, final image curation, final gallery curation, and thumbnail rendition efficiency should be handled later by me or during the pre-launch content/performance pass.
```

## Important transfer rule

Do not put transfer-only documents into a nested `docs/new-chat-transfer/` folder unless the project intentionally adopts that folder. Current project convention is to keep handoff files directly under `docs/`.


## Replacement pack formatting rule

Replacement/fix packs should be packaged so the zip root mirrors the repository root. The user should be able to copy or extract the pack contents directly into the project root and allow changed files to overwrite their matching paths.

Correct replacement pack layout:

```text
src/...
docs/...
PROJECT_CHANGELOG.md
```

Do not wrap replacement packs in `source/`, `01-source/`, `updated-files/`, or any other container folder unless the user explicitly asks for that format. Do not place phase README files or transfer notes at the zip root. Pack notes belong under `docs/pack-notes/`, manifests belong under `docs/pack-manifests/`, and phase documentation belongs under `docs/`.

Generated chat-upload archives may still include whatever structure the upload script creates for transfer convenience. This rule is specifically for assistant-created replacement packs meant to be copied into the repo root.


### Regression hotfix pack rule

When a replacement pack causes a runtime regression, the recovery pack should still use the same root-relative structure. Prefer full-file replacements for the affected runtime files and document exactly which experimental change was backed out. Do not introduce wrapper folders, root-level phase README files, or undocumented patch fragments during recovery work.


## Phase 5 upload note

When transferring Phase 5 work, include `src/data/aboutPhotos.json`, `src/data/aboutPhotos.ts`, and the `public/images/about/` folder structure. If the next task involves imported About images, use a runtime image mode that includes the About display/thumb assets.

## Phase 6 upload note

When transferring Phase 6 mobile gallery work, include the gallery runtime controllers and CSS: `src/app/galleryController.ts`, `src/app/renderSite.ts`, `src/gallery/GalleryScene.ts`, `src/gallery/controls/lookController.ts`, `src/gallery/controls/movementController.ts`, and `src/styles/global.css`. Real-device mobile QA is important because headless browser coverage may not capture touch feel, device safe-area placement, or mobile GPU performance.

## Current Phase 6 transfer note — 2026-05-18

Phase 6 mobile gallery work is complete/closed as of Phase 6J. Phase 6A created the baseline touch controls; Phase 6B softened the interaction layer, added first-use hint fadeout, safer phone/landscape spacing, analog dead-zone/curve behavior, slightly slower touch movement, and less jumpy drag-look; Phase 6C cleaned up public gallery metadata so plaques and bottom-right artwork cards no longer expose internal wall type labels; Phase 6D fixed the individual image editor's lower Save JSON button; Phase 6E increased touch movement responsiveness; Phase 6F set the accepted touch-camera midpoint and added the first horizontal-phone homepage guard; Phase 6G refined the homepage hero in short landscape mode; Phase 6H broadened the guard for Pixel-class wide CSS mobile viewports; Phase 6I extended short-landscape treatment to Portfolio/About and cleared active touch movement/look state during orientation changes, app switching, page hide, document visibility loss, touch-mode resize, and gallery teardown; Phase 6J is docs-only closeout.

Future mobile changes should be issue-driven. Treat Phase 6E movement responsiveness, Phase 6F camera sensitivity, Phase 6H Pixel-class homepage landscape handling, and Phase 6I route/touch hardening as the accepted mobile baseline unless real-device testing identifies a specific problem.

## Phase 7 upload note

When transferring Phase 7 work, include `index.html`, `src/data/siteSeo.json`, `src/data/siteSeo.ts`, `src/app/seoController.ts`, `src/app/siteRouter.ts`, `src/app/sitePages.ts`, `src/app/siteInteractionsController.ts`, `src/styles/global.css`, `public/robots.txt`, `public/sitemap.xml`, `scripts/Run-LighthouseBaseline.ps1`, and the Phase 7 docs. Phase 7B sets the intended public domain to `https://taylorpike.com/`. Phase 7C fixes the homepage CTA accessible-name/touch-target warning and adds first-hero LCP preload hints. Phase 7D adds primary navigation font-size overrides in `src/styles/global.css`. Phase 7E closes the phase and records the accepted Lighthouse baseline: Performance 98, Accessibility 100, Best Practices 93, SEO 100. The site still uses hash routing, so the sitemap currently lists the canonical root URL rather than hash-fragment routes. Current route decision: keep hash routing unless production Lighthouse/Search Console/deployment evidence shows a clear reason to change.

## Phase 8 upload note

Phase 8 is active. Phase 8AK is the current gallery runtime baseline. It removes the rejected Phase 8AJ geometry and restores the liked Phase 8AI scene/material runtime files. Preserve collision, wall placement, plaque fallback, gallery curation data flow, editor curation logic, accepted mobile controls, routing, public copy, image assets, dependencies, fog, and post-processing boundaries unless a specific later Phase 8 pack intentionally and carefully changes them.


## Phase 8Q upload note

Phase 8T is the latest texture-and-ceiling-readability baseline pending local visual review. It continues from Phase 8N/8O/8P/8Q/8R/8S, increases the visibility of the procedural surface treatment, makes the floor read more like faint matte marble, lifts the ceiling out of the near-black range, adds a more legible gritty/chipped-paint ceiling texture, and keeps the future basic/fast editor lighting toggle plus visible spotlight/wall-wash fixture ideas documented as backlog. Continue to review Phase 8 visually with normal screenshots from the wide main-artwork, frame/material close-up, corridor/depth positions, plus ceiling/floor texture checks.


## Phase 8U upload note

Phase 8V is the latest texture-reference/loading-feedback polish baseline pending local visual review. It introduces a capped dynamic-shadow test using `THREE.PCFSoftShadowMap` and only selected ceiling-panel spotlights, reimagines the floor as larger matte-marble stone movement, lifts the ceiling texture/readability, and keeps post-processing, fog, transparent shadow planes, new assets, new dependencies, room layout changes, collision changes, plaque fallback changes, editor changes, controls changes, public copy, and deferred branding work out of scope. Because this is the first dynamic-shadow test, local review should include both visual quality and whether gallery load/movement performance remains acceptable.


## Phase 8V upload note

Phase 8V is the current runtime baseline pending local visual review. It keeps the accepted Phase 8U selective-shadow architecture, removes the explicit ceiling-grid strip geometry, makes procedural wall/ceiling/floor material maps more visible, reworks the floor toward a stronger faint matte-marble/stone effect, lifts the ceiling toward textured warm charcoal, and smooths the perceived loading state by prewarming gallery modules during idle time and adding explicit loading-phase text. It does not change room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, dependencies, post-processing, fog, transparent shadow planes, logo/favicon/social-preview work, or external texture assets. Continue to review Phase 8 visually with normal screenshots from the wide main-artwork, frame/material close-up, corridor/depth, ceiling/texture, and loading-feel positions. If the loading screen still appears frozen, investigate further module-splitting or progress instrumentation rather than changing the visual lighting/material work.


### Phase 8W — Gallery lighting import recovery hotfix

Status: build/runtime recovery hotfix. Phase 8V remains the current visual/material baseline pending local review.

- responds to a Vite import-resolution failure after Phase 8V: `Failed to resolve import "./environment/galleryLighting" from "src/gallery/GalleryScene.ts"`;
- root cause in the uploaded source: `src/gallery/GalleryScene.ts` imports `./environment/galleryLighting`, but `src/gallery/environment/galleryLighting.ts` was missing from the applied source tree;
- restores `src/gallery/environment/galleryLighting.ts` from the selective-shadow lighting baseline used by Phase 8U and expected by the current `GalleryScene.ts`;
- does not change room layout, wall placement, collision, plaque fallback, image assets, editor logic, public copy, routing, SEO, or the Phase 8V material/loading polish direction.


## Phase 8X upload note

Phase 8X is the latest texture/reference and loading-prewarm correction baseline pending local visual review. It continues from Phase 8V + 8W, strengthens generated sand/plaster wall texture, faint matte-marble floor texture, and knockdown/Venetian ceiling texture, disables ceiling shadow receiving to prevent grid-like ceiling lines, and adds material-module prewarming through idle/pointer/focus/touch intent. Continue reviewing Phase 8 with wide main-artwork, frame/material close-up, corridor/depth, and ceiling/floor texture screenshots.


## Phase 8AC upload note

Phase 8AH is the current runtime baseline pending local visual review. It follows Phase 8AG after local screenshots showed slower loading and a ceiling that still read too dark. It removes the extra Phase 8AG ceiling rake point lights, reduces selective shadow-map cost, reduces procedural texture-generation footprint by moving color maps to smaller canvases and fewer marks, and lightens the ceiling through material and existing broad/local light balance rather than adding more light objects. It continues after Phase 8AF stabilized wall/floor balance but the ceiling still read too close to black. It keeps the wall/floor direction intact, increases ceiling knockdown/bump response, and adds very small localized ceiling rake/lift lighting around fixture pools. Preserve collision, wall placement, plaque fallback, gallery curation data flow, editor curation logic, accepted mobile controls, routing, public copy, dependencies, and external texture-asset deferrals unless a specific later pack changes them intentionally.

Treat the uploaded source as the source of truth if it conflicts with older Phase 8 pack descriptions.


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

Phase 8AG keeps the Phase 8AF wall/floor restraint and focuses only on making the ceiling finish separate more clearly around fixture pools. It increases ceiling knockdown/bump response and adds two very low-intensity ceiling rake/lift point lights. It does not change room footprint, wall placement, collision, plaque fallback, editor logic, gallery curation, mobile controls, routing, public copy, dependencies, external texture assets, post-processing, or fog.


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

## 2026-05-19 — Phase 8AJ rejected and Phase 8AK corrective rollback

Phase 8AJ was rejected after local visual review. The added ceiling fields, recessed fixture-well geometry, perimeter floor/base reveal strips, and freestanding-wall end caps created intrusive black geometry and did not match the provided dramatic gallery reference.

Current Phase 8AK source changes:

- `src/gallery/GalleryScene.ts` is restored from the Phase 8AI uploaded source baseline.
- `src/gallery/environment/galleryMaterials.ts` is restored from the Phase 8AI uploaded source baseline.
- The rejected Phase 8AJ runtime geometry is removed.
- The accepted Phase 8AI lighting/material balance is preserved.

The next visual pass should be smaller and more reference-led. Avoid adding broad new architectural geometry until the specific treatment is approved against the reference image.


## Latest Phase 8 transfer note — Phase 8AL

Phase 8AL is the current runtime baseline pending local visual review. It builds from Phase 8AK after the rejected Phase 8AJ geometry rollback. It keeps the existing room geometry, avoids new architectural additions, and limits the gallery visual change to surface/material calibration, reduced existing fixture visual mass, and small lighting-balance adjustments. Future chats should not reintroduce the rejected Phase 8AJ geometry and should continue toward the provided dramatic gallery reference through small screenshot-led passes.
