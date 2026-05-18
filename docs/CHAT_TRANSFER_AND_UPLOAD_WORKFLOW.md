# Chat Transfer and Upload Workflow

Updated: 2026-05-18

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
This is my current Taylor Pike portfolio site source. Read the docs folder first, especially CURRENT_PROJECT_HANDOFF.md, CURRENT_PROJECT_HANDOFF_PHASE7_CLOSEOUT.md, PROJECT_ROADMAP_CURRENT.md, and CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md. Treat the uploaded source as the source of truth. Phase 7 SEO/discoverability and launch-readiness infrastructure is complete/closed as of Phase 7E. Phase 7A added data-backed SEO metadata, route-aware metadata updates, JSON-LD, robots.txt, and sitemap.xml. Phase 7B set the public domain baseline to https://taylorpike.com/, added scripts/Run-LighthouseBaseline.ps1, and kept hash routing intact. Phase 7C fixed the homepage View Portfolio CTA accessible-name/touch-target issue and added first-hero LCP preload hints. Phase 7D raised primary navigation font sizing to the 12px Lighthouse mobile legibility threshold. The accepted post-Phase 7D Lighthouse baseline is Performance 98, Accessibility 100, Best Practices 93, and SEO 100. Phase 8 advanced 3D gallery expansion, texture, and lighting is the next available future phase, but it has not started. Final public About copy, final metadata copy, final favicon/logo/social preview assets, final image curation, final gallery curation, and thumbnail rendition efficiency should be handled later by me or during the pre-launch content/performance pass.
```

## Important transfer rule

Do not put transfer-only documents into a nested `docs/new-chat-transfer/` folder unless the project intentionally adopts that folder. Current project convention is to keep handoff files directly under `docs/`.


## Phase 5 upload note

When transferring Phase 5 work, include `src/data/aboutPhotos.json`, `src/data/aboutPhotos.ts`, and the `public/images/about/` folder structure. If the next task involves imported About images, use a runtime image mode that includes the About display/thumb assets.

## Phase 6 upload note

When transferring Phase 6 mobile gallery work, include the gallery runtime controllers and CSS: `src/app/galleryController.ts`, `src/app/renderSite.ts`, `src/gallery/GalleryScene.ts`, `src/gallery/controls/lookController.ts`, `src/gallery/controls/movementController.ts`, and `src/styles/global.css`. Real-device mobile QA is important because headless browser coverage may not capture touch feel, device safe-area placement, or mobile GPU performance.

## Current Phase 6 transfer note — 2026-05-18

Phase 6 mobile gallery work is complete/closed as of Phase 6J. Phase 6A created the baseline touch controls; Phase 6B softened the interaction layer, added first-use hint fadeout, safer phone/landscape spacing, analog dead-zone/curve behavior, slightly slower touch movement, and less jumpy drag-look; Phase 6C cleaned up public gallery metadata so plaques and bottom-right artwork cards no longer expose internal wall type labels; Phase 6D fixed the individual image editor's lower Save JSON button; Phase 6E increased touch movement responsiveness; Phase 6F set the accepted touch-camera midpoint and added the first horizontal-phone homepage guard; Phase 6G refined the homepage hero in short landscape mode; Phase 6H broadened the guard for Pixel-class wide CSS mobile viewports; Phase 6I extended short-landscape treatment to Portfolio/About and cleared active touch movement/look state during orientation changes, app switching, page hide, document visibility loss, touch-mode resize, and gallery teardown; Phase 6J is docs-only closeout.

Future mobile changes should be issue-driven. Treat Phase 6E movement responsiveness, Phase 6F camera sensitivity, Phase 6H Pixel-class homepage landscape handling, and Phase 6I route/touch hardening as the accepted mobile baseline unless real-device testing identifies a specific problem.

## Phase 7 upload note

When transferring Phase 7 work, include `index.html`, `src/data/siteSeo.json`, `src/data/siteSeo.ts`, `src/app/seoController.ts`, `src/app/siteRouter.ts`, `src/app/sitePages.ts`, `src/app/siteInteractionsController.ts`, `src/styles/global.css`, `public/robots.txt`, `public/sitemap.xml`, `scripts/Run-LighthouseBaseline.ps1`, and the Phase 7 docs. Phase 7B sets the intended public domain to `https://taylorpike.com/`. Phase 7C fixes the homepage CTA accessible-name/touch-target warning and adds first-hero LCP preload hints. Phase 7D adds primary navigation font-size overrides in `src/styles/global.css`. Phase 7E closes the phase and records the accepted Lighthouse baseline: Performance 98, Accessibility 100, Best Practices 93, SEO 100. The site still uses hash routing, so the sitemap currently lists the canonical root URL rather than hash-fragment routes. Current route decision: keep hash routing unless production Lighthouse/Search Console/deployment evidence shows a clear reason to change. Phase 8 is the next available future phase, not an active/in-progress phase unless the user starts it.
