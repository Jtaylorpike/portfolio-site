# Staged commit audit

## Purpose

Use this before committing a large cleanup. It checks that temporary/generated files are being removed from tracking and that permanent replacement assets are present.

## Run

```powershell
.\scripts\Audit-StagedCommit.ps1
```

Full pre-commit gate:

```powershell
.\scripts\Run-PreCommitPortfolioChecks.ps1
```

Skip the duplicate build:

```powershell
.\scripts\Run-PreCommitPortfolioChecks.ps1 -SkipBuild
```

## What it checks

```text
asset-archive is not tracked
asset-reports is not tracked
source-images is not tracked
PROJECT_CHANGELOG_APPEND_*.md is not staged as a live file
REPLACEMENT_PACK_NOTES.md is not staged as a live file
_chat-uploads files are not staged as live files
public/data is not staged as live active data
src/gallery/_legacy is not staged as live code
required public/images/ui/cards files exist
```

## Expected warnings

During the current cleanup, these warnings are expected:

```text
tracked _chat-uploads files are staged for deletion
changelog append fragments are staged for deletion
old public image files are staged for deletion
```

Those are cleanup warnings, not blockers.

## Commit after checks pass

```powershell
git commit -m "Clean workspace and finalize portfolio image pipeline"
```
