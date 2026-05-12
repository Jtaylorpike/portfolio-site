# Handoff refresh workflow

## Purpose

Use this after major project changes so future chats have a compact, current source of truth.

## Generate the handoff document

```powershell
.\scripts\Write-PortfolioHandoffSnapshot.ps1
```

With validation first:

```powershell
.\scripts\Write-PortfolioHandoffSnapshot.ps1 -RunValidation
```

This writes:

```text
docs/CURRENT_PROJECT_HANDOFF.md
asset-reports/portfolio-handoff-snapshot-YYYYMMDD-HHMMSS.md
```

## Create a handoff zip

```powershell
.\scripts\Create-PortfolioHandoffZip.ps1
```

With validation first:

```powershell
.\scripts\Create-PortfolioHandoffZip.ps1 -RunValidation
```

This writes:

```text
_chat-uploads/TaylorPikePortfolio-Handoff-YYYYMMDD-HHMMSS.zip
```

## What the zip excludes

```text
.git/
node_modules/
dist/
asset-archive/
asset-reports/
source-images/
assets-to-import/
_chat-uploads/
.drive-browser-profile/
portfolio-public-site-polish-pack/
```

It is meant for project continuation, not for deploying or backing up source images.

## When to run this

Run after:

```text
major image pipeline changes
editor architecture changes
gallery architecture changes
deployment changes
before moving to a new chat
before merging dev into main
```
