# Chat Transfer and Upload Workflow

Updated: 2026-05-15

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
This is my current Taylor Pike portfolio site source. Read the docs folder first, especially CURRENT_PROJECT_HANDOFF.md, CURRENT_PROJECT_HANDOFF_PHASE3_ACTIVE.md, PROJECT_ROADMAP_CURRENT.md, and CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md. Treat the uploaded source as the source of truth. We are in Phase 3: portfolio content and metadata curation. Phase 2 public polish is complete, and the alt text pack has been applied and committed.
```

## Important transfer rule

Do not put transfer-only documents into a nested `docs/new-chat-transfer/` folder unless the project intentionally adopts that folder. Current project convention is to keep handoff files directly under `docs/`.
