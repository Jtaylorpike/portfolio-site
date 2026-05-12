# Workspace cleanup locked folder fix

## Problem

The root cleanup script may fail on:

```text
Move-Item : Access to the path ...\_chat-uploads is denied.
```

This usually means the folder is locked by Explorer, VS Code, a terminal, antivirus scanning, or another process.

## Updated behavior

`Clean-WorkspaceRootArtifacts.ps1` now handles each cleanup target independently and writes:

```text
asset-reports/workspace-root-cleanup-results.txt
asset-reports/workspace-root-cleanup-results.csv
```

A locked folder no longer stops the entire cleanup.

## Recommended retry

Close Explorer/VS Code/terminals using `_chat-uploads`, then run:

```powershell
.\scripts\Clean-WorkspaceRootArtifacts.ps1 -Apply -CopyThenRemove
```

`-CopyThenRemove` copies directory targets into the archive first, then attempts to remove the original. If removal fails, the archive copy is still preserved.

## Skip option

If `_chat-uploads` keeps failing and you want to continue the rest of cleanup:

```powershell
.\scripts\Clean-WorkspaceRootArtifacts.ps1 -Apply -SkipChatUploads
```

Then delete or archive `_chat-uploads` manually later.

## Troubleshooting helper

```powershell
.\scripts\Unlock-ChatUploadFolderHelp.ps1
```
