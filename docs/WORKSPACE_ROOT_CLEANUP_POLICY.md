# Workspace root cleanup policy

## Goal

The project root should contain source, configuration, and intentional project documentation only.

Generated upload packs, local reports, chat transfer files, changelog fragments, and local source-image archives should not stay in the root.

## Keep at root

```text
.github/
docs/
local-editor/
public/
scripts/
src/
.gitignore
index.html
package.json
package-lock.json
PROJECT_CHANGELOG.md
README.md
tsconfig.json
vite.config.ts
```

## Archive or ignore

```text
asset-archive/
asset-reports/
source-images/
assets-to-import/
_chat-uploads/
_chat-uploads.zip
asset-reports.zip
TaylorPikePortfolio-*.zip
Taylor_Pike_Portfolio_*.zip
PROJECT_CHANGELOG_APPEND_*.md
REPLACEMENT_PACK_NOTES.md
portfolio-public-site-polish-pack/
.drive-browser-profile/
```

## Workflow

Update ignore rules:

```powershell
.\scripts\Update-WorkspaceGitignore.ps1
```

Audit:

```powershell
.\scripts\Audit-WorkspaceRootArtifacts.ps1
```

Dry-run cleanup:

```powershell
.\scripts\Clean-WorkspaceRootArtifacts.ps1
```

Review:

```text
asset-reports/workspace-root-cleanup-plan.txt
```

Apply:

```powershell
.\scripts\Clean-WorkspaceRootArtifacts.ps1 -Apply
```

Validate:

```powershell
.\scripts\Validate-WorkspaceRootClean.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
```

## Changelog fragments

By default, `Clean-WorkspaceRootArtifacts.ps1 -Apply` appends `PROJECT_CHANGELOG_APPEND_*.md` files into `PROJECT_CHANGELOG.md` before moving the fragments to `asset-archive/`.

Use `-SkipChangelogAppend` only if you want to archive fragments without appending them.
