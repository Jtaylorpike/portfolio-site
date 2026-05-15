# Upload Script Modernization

Updated: 2026-05-15

## Reason for change

The previous chat upload script was created before the project fully moved to the current rendition-based image structure. It still looked for older paths and did not include the documentation folder or root changelog.

This caused two problems:

```text
1. Future chats could not see the docs that explain the project state.
2. Active image folders were missing from upload packages, requiring a separate thumbnail upload.
```

## Main changes

The updated script now includes:

```text
src/
scripts/
local-editor/
docs/
PROJECT_CHANGELOG.md
public/fonts/
```

It also supports runtime image modes for active image folders:

```text
none
thumb
display
all
```

Default is `thumb` to keep upload packages smaller.

## Removed stale assumptions

The script no longer assumes these old runtime paths are active:

```text
public/images/logo/
public/images/card-optimized/
public/images/gallery-optimized/
public/images/thumbnails/
public/images/imported/...optimized/
```

The active paths are now:

```text
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/portfolio/texture/
public/images/portfolio/full/
public/images/ui/cards/
```

## Recommended usage

Normal handoff:

```powershell
.\scripts\New-TaylorPikePortfolioChatUpload.cmd
```

Visual/photo review:

```powershell
.\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode display
```

Image pipeline review:

```powershell
.\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode all
```

Code-only review:

```powershell
.\scripts\New-TaylorPikePortfolioChatUpload.cmd -RuntimeImageMode none
```
