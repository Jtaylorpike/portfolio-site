# Workspace and image folder cleanup

## Goal

Keep the repository root and `public/images` understandable.

## Root folder model

Keep source/config at root:

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

Local/generated folders should not be committed:

```text
asset-archive/
asset-reports/
dist/
node_modules/
.drive-browser-profile/
_chat-uploads/
portfolio-public-site-polish-pack/
```

Generated fragment files should be appended into `PROJECT_CHANGELOG.md` and then archived:

```text
PROJECT_CHANGELOG_APPEND_*.md
```

## Public image model

Long-term structure:

```text
public/images/portfolio/full/
public/images/portfolio/display/
public/images/portfolio/texture/
public/images/portfolio/thumb/
public/images/ui/cards/
public/images/logo/
```

The remaining root-level category folders are only safe to archive when the reference audit shows they are unreferenced.

## Workflow

Audit first:

```powershell
.\scripts\Audit-WorkspaceCleanupTargets.ps1
```

Migrate card images into the UI folder:

```powershell
.\scripts\Migrate-CardImagesToUiCards.ps1
.\scripts\Migrate-CardImagesToUiCards.ps1 -Apply
```

Archive stale legacy gallery code if present:

```powershell
.\scripts\Archive-StaleLegacyGalleryCode.ps1
.\scripts\Archive-StaleLegacyGalleryCode.ps1 -Apply
```

Append changelog fragments:

```powershell
.\scripts\Append-ChangelogFragments.ps1
.\scripts\Append-ChangelogFragments.ps1 -Apply
```

Then rerun:

```powershell
.\scripts\Audit-PublicImageReferences.ps1
.\scripts\Archive-UnreferencedPublicImages.ps1
```

If the archive plan is correct:

```powershell
.\scripts\Archive-UnreferencedPublicImages.ps1 -Apply
```

Final validation:

```powershell
.\scripts\Validate-PortfolioDevBranch.ps1
```
