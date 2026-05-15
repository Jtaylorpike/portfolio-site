# Chat Transfer and Upload Workflow

Updated: 2026-05-15

## Purpose

This project depends on accurate handoffs between chats. The upload package should carry enough active source, documentation, and selected runtime image assets for another assistant to understand the current codebase without relying on stale memory.

The upload script was modernized because the older script still searched for legacy image folders such as `card-optimized`, `gallery-optimized`, `thumbnails`, and `public/images/logo`. The active site no longer uses those paths.

## Active runtime image structure

The active public image structure is rendition-based:

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

Default mode is intentionally small and includes:

```text
01-source/             active source, scripts, editor, docs, changelog, fonts
02-runtime-images/     active portfolio thumbnails and UI image assets
manifests/             source tree, runtime image tree, package manifest
```

This is the preferred mode for most code review, roadmap, handoff, and documentation tasks.

## Runtime image modes

Use one of these modes depending on what the next chat needs to inspect:

```powershell
.\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode thumb
.\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode display
.\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode all
.\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode none
```

### `thumb`

Default. Includes:

```text
public/images/portfolio/thumb/
public/images/ui/
```

Use this for normal continuity, code review, layout review, and data review where full visual fidelity is not required.

### `display`

Includes:

```text
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/ui/
```

Use this when the next chat needs to visually inspect photos, generate alt text, or review portfolio image presentation.

### `all`

Includes:

```text
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/portfolio/texture/
public/images/portfolio/full/
public/images/ui/
```

Use this only when the image pipeline, Three.js texture behavior, full-size viewing, or rendition validation is under review. This mode may exceed upload size limits.

### `none`

Includes no runtime image payload. Use this only for code-only discussion or when upload size is the priority.

## Original/source images

Original import assets are not included by default. To include them:

```powershell
.\scripts\New-TaylorPikePortfolioChatUpload.cmd -IncludeOriginalImages
```

This attempts to include:

```text
source-images/
assets-to-import/
```

Use this only when import pipeline behavior or source-original processing is the task.

## What should be uploaded to a new chat

For normal project continuation:

```text
1. The latest generated TaylorPikePortfolio-ChatUpload-*.zip.
2. The latest high-level handoff doc, if separately available.
3. Any screenshots showing the specific visual issue being discussed.
```

For alt text or image-level visual review, use `-RuntimeImageMode display` if the package size is uploadable. If it is too large, upload the standard source package and a separate compressed folder containing the relevant display or thumbnail images.

## What the next chat should treat as source of truth

Priority order:

```text
1. Fresh uploaded current source files.
2. Current docs in docs/.
3. PROJECT_CHANGELOG.md.
4. Prior handoff summaries.
5. Long-term memory/context.
```

If current source files conflict with older handoffs or memory, the current source files win.
