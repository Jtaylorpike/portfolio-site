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
This is my current Taylor Pike portfolio site source. Read the docs folder first, especially CURRENT_PROJECT_HANDOFF.md, CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md, PROJECT_ROADMAP_CURRENT.md, and CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md. Treat the uploaded source as the source of truth. Phase 6 mobile 3D gallery controls is complete/closed as of Phase 6J. The next recommended phase is Phase 7 SEO/discoverability and launch-readiness infrastructure. Final public About copy, final image curation, and final gallery curation should be written/decided by me, not generated as finished content.
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
