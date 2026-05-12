# Taylor Pike Portfolio Project Changelog

This file records meaningful design, architecture, data, editor, and gallery changes made during development.

Current source files remain the source of truth. This changelog is a historical record and should be updated with every replacement pack going forward.

---

## 2026-05-12 â€” Stale public data archive cleanup

### Changed
- Added a dry-run-first script to move stale `public/data` files into `asset-archive/`.
- Updated the public image reference audit message to point stale public data users to the archive script.
- Added documentation explaining why active editable data should live in `src/data`, not stale deployed `public/data` snapshots.

### Files changed
- `scripts/Archive-StalePublicData.ps1`
- `scripts/Audit-PublicImageReferences.ps1`
- `docs/STALE_PUBLIC_DATA_CLEANUP.md`
- `PROJECT_CHANGELOG.md`

### Notes
- This resolves missing image references caused by old `public/data/projects.json` entries.
- The script does not delete stale data. It moves it to local `asset-archive/`.

---

---

## Appended changelog fragments - 20260512-112355


## 2026-05-12 â€” Dev branch validation tooling

### Changed
- Added a dev-branch validation script that runs image audits, Git safety checks, public image structure reporting, and the production build.
- Added a public image structure summary script.
- Added a release checklist for deciding when `dev` is safe to merge into `main`.

### Files changed
- `scripts/Validate-PortfolioDevBranch.ps1`
- `scripts/Summarize-PublicImageStructure.ps1`
- `docs/DEV_BRANCH_RELEASE_CHECKLIST.md`
- `PROJECT_CHANGELOG_APPEND_20260512_DEV_VALIDATION.md`

### Notes
- This pack is validation-only.
- It does not modify runtime site code, image data, or deployed assets.
- Append this entry into `PROJECT_CHANGELOG.md` when ready rather than blindly replacing the current changelog.


## 2026-05-12 — Validation empty report fix

### Changed
- Fixed `Audit-PublicImageReferences.ps1` so empty report files are explicitly cleared and recreated.
- Fixed `Validate-PortfolioDevBranch.ps1` so the public image audit check reads the missing count from the audit summary instead of stale text file contents.

### Files changed
- `scripts/Audit-PublicImageReferences.ps1`
- `scripts/Validate-PortfolioDevBranch.ps1`
- `PROJECT_CHANGELOG_APPEND_20260512_EMPTY_REPORT_FIX.md`

### Notes
- The prior validation output showed `Missing referenced files: 0` in the summary but still failed with 4 missing files because stale rows remained in `public-image-missing.txt`.


## 2026-05-12 — Dev validation PowerShell parser fix

### Changed
- Replaced the dev branch validation script with an ASCII-only version.
- Rewrote compact one-line helper functions into expanded PowerShell syntax.
- Wrote the replacement script with a UTF-8 BOM for safer Windows PowerShell 5.1 parsing.

### Files changed
- `scripts/Validate-PortfolioDevBranch.ps1`
- `PROJECT_CHANGELOG_APPEND_20260512_VALIDATION_ASCII_FIX.md`

### Notes
- This fixes the parser error caused by mojibake from a non-ASCII dash in the validation script.


## 2026-05-12 — Workspace and image folder cleanup tooling

### Changed
- Added root workspace cleanup audit tooling.
- Added card image migration tooling for moving category card images from `public/images/card-optimized` to `public/images/ui/cards`.
- Added stale legacy gallery code archive tooling.
- Added changelog fragment append/archive tooling.
- Added workspace and image folder cleanup documentation.

### Files changed
- `scripts/Audit-WorkspaceCleanupTargets.ps1`
- `scripts/Append-ChangelogFragments.ps1`
- `scripts/Migrate-CardImagesToUiCards.ps1`
- `scripts/Archive-StaleLegacyGalleryCode.ps1`
- `docs/WORKSPACE_AND_IMAGE_FOLDER_CLEANUP.md`
- `PROJECT_CHANGELOG_APPEND_20260512_WORKSPACE_IMAGE_CLEANUP.md`

### Notes
- This pack is dry-run-first.
- It does not delete image folders.
- It supports moving toward `public/images/portfolio/*` plus `public/images/ui/cards`.


---

## Appended changelog fragments - 20260512-124709


## 2026-05-12 — Dev validation image data integration

### Changed
- Updated the dev branch validation script so it also runs the portfolio image data validator.
- Added `-ImageDataWarningsAsErrors` support for stricter validation.
- Updated the dev branch release checklist to include image data validation.

### Files changed
- `scripts/Validate-PortfolioDevBranch.ps1`
- `docs/DEV_BRANCH_RELEASE_CHECKLIST.md`
- `PROJECT_CHANGELOG_APPEND_20260512_DEV_VALIDATION_IMAGE_DATA.md`

### Notes
- This makes the full dev validation checkpoint include both file-level image checks and data-model checks.


## 2026-05-12 — Local editor fit mode normalization fix

### Changed
- Updated `local-editor/app/data_store.py` so `save_project_data()` performs a final normalization pass before validation and writing JSON.
- Added `Repair-PortfolioImageModes.ps1` to audit and repair invalid fit/frame values in `galleryImages.json`.
- Added documentation for the editor fit mode import error.

### Files changed
- `local-editor/app/data_store.py`
- `scripts/Repair-PortfolioImageModes.ps1`
- `docs/LOCAL_EDITOR_FIT_MODE_NORMALIZATION_FIX.md`
- `PROJECT_CHANGELOG_APPEND_20260512_EDITOR_FIT_MODE_FIX.md`

### Notes
- This fixes editor import errors where a new record has an invalid `heroFitMode`.
- Valid fit modes remain `cover` and `contain`; invalid values are normalized to `cover`.


## 2026-05-12 — Image data validation

### Changed
- Added a portfolio image data validation script.
- Added validation for image record fields, unique IDs, category references, rendition path prefixes, existing files, WebP output, metadata consistency, and hero slide eligibility.
- Added documentation for image data validation reports.

### Files changed
- `scripts/Validate-PortfolioImageData.ps1`
- `scripts/validate-portfolio-image-data.mjs`
- `docs/IMAGE_DATA_VALIDATION.md`
- `PROJECT_CHANGELOG_APPEND_20260512_IMAGE_DATA_VALIDATION.md`

### Notes
- This creates a guardrail for future imports and local editor changes.
- The validator can run in normal mode or with warnings treated as errors.


## 2026-05-12 — Image import workflow

### Changed
- Added a dry-run-first portfolio image import workflow.
- Added an inbox audit script for `source-images/inbox`.
- Added a Node/Sharp importer that creates full, display, texture, and thumb WebP renditions.
- Added JSON update logic for appending new records to `src/data/galleryImages.json`.
- Added optional category update and source-file move behavior.

### Files changed
- `scripts/Audit-ImageImportInbox.ps1`
- `scripts/Import-PortfolioImages.ps1`
- `scripts/import-portfolio-images.mjs`
- `docs/IMAGE_IMPORT_WORKFLOW.md`
- `PROJECT_CHANGELOG_APPEND_20260512_IMAGE_IMPORT_WORKFLOW.md`

### Notes
- This completes the basic image pipeline: source image in, optimized public renditions out, JSON record appended.
- It should run on `dev` first.


## 2026-05-12 — Image removal workflow

### Changed
- Added a dry-run-first script for removing a portfolio image record by ID.
- Added archival behavior for removed public rendition files.
- Added automatic hero slide cleanup for removed image IDs.
- Added documentation for removing test imports safely.

### Files changed
- `scripts/Remove-PortfolioImageRecord.ps1`
- `scripts/remove-portfolio-image-record.mjs`
- `docs/IMAGE_REMOVAL_WORKFLOW.md`
- `PROJECT_CHANGELOG_APPEND_20260512_IMAGE_REMOVAL_WORKFLOW.md`

### Notes
- This is intended for test-import cleanup and future image removal.
- Removed image files are moved to `asset-archive/`, not deleted.


## 2026-05-12 — Legacy editor import repair

### Changed
- Added a repair script for image records that still point to `/images/imported/...`.
- Added an editor backend audit script for detecting legacy import paths.
- Re-included the rendition-based local editor import backend files.
- Added documentation for repairing legacy editor import output.

### Files changed
- `local-editor/app/image_importer.py`
- `local-editor/app/asset_manager.py`
- `scripts/Audit-EditorLegacyImportPaths.ps1`
- `scripts/Repair-LegacyImportedImageRecords.ps1`
- `scripts/repair-legacy-imported-image-records.mjs`
- `docs/LEGACY_EDITOR_IMPORT_REPAIR.md`
- `PROJECT_CHANGELOG_APPEND_20260512_LEGACY_EDITOR_IMPORT_REPAIR.md`

### Notes
- This fixes records that cause 4 prefix violations after a test import writes into `/images/imported/`.


## 2026-05-12 — Local editor image pipeline contract

### Changed
- Added a local editor compatibility audit script.
- Added a local editor launch helper that can run the compatibility audit before startup.
- Added an editor pipeline snapshot script.
- Added documentation defining the editor's contract with the cleaned image pipeline.

### Files changed
- `scripts/Audit-LocalEditorCompatibility.ps1`
- `scripts/Run-LocalEditor.ps1`
- `scripts/Export-EditorPipelineSnapshot.ps1`
- `docs/LOCAL_EDITOR_IMAGE_PIPELINE_CONTRACT.md`
- `local-editor/EDITOR_PIPELINE_CONTRACT.md`
- `PROJECT_CHANGELOG_APPEND_20260512_LOCAL_EDITOR_PIPELINE_CONTRACT.md`

### Notes
- This is a guardrail pack before modifying editor internals.
- It identifies stale path assumptions without replacing editor source code yet.


## 2026-05-12 — Workspace root final cleanup tooling

### Changed
- Added root artifact audit tooling.
- Added dry-run-first workspace root cleanup that archives generated pack/report/changelog files.
- Added `.gitignore` updater for local archive/report/source folders.
- Added workspace root validation to prevent generated artifacts from staying in the active project tree.
- Added documentation for the intended root-folder policy.

### Files changed
- `scripts/Update-WorkspaceGitignore.ps1`
- `scripts/Audit-WorkspaceRootArtifacts.ps1`
- `scripts/Clean-WorkspaceRootArtifacts.ps1`
- `scripts/Validate-WorkspaceRootClean.ps1`
- `docs/WORKSPACE_ROOT_CLEANUP_POLICY.md`
- `PROJECT_CHANGELOG_APPEND_20260512_WORKSPACE_ROOT_FINAL_CLEANUP.md`

### Notes
- This cleanup archives generated artifacts into `asset-archive/`; it does not permanently delete them.
- `asset-archive/`, `asset-reports/`, and `source-images/` should remain local and untracked.


---

## Appended changelog fragments - 20260512-125157


## 2026-05-12 — Dev validation image data integration

### Changed
- Updated the dev branch validation script so it also runs the portfolio image data validator.
- Added `-ImageDataWarningsAsErrors` support for stricter validation.
- Updated the dev branch release checklist to include image data validation.

### Files changed
- `scripts/Validate-PortfolioDevBranch.ps1`
- `docs/DEV_BRANCH_RELEASE_CHECKLIST.md`
- `PROJECT_CHANGELOG_APPEND_20260512_DEV_VALIDATION_IMAGE_DATA.md`

### Notes
- This makes the full dev validation checkpoint include both file-level image checks and data-model checks.


## 2026-05-12 — Local editor fit mode normalization fix

### Changed
- Updated `local-editor/app/data_store.py` so `save_project_data()` performs a final normalization pass before validation and writing JSON.
- Added `Repair-PortfolioImageModes.ps1` to audit and repair invalid fit/frame values in `galleryImages.json`.
- Added documentation for the editor fit mode import error.

### Files changed
- `local-editor/app/data_store.py`
- `scripts/Repair-PortfolioImageModes.ps1`
- `docs/LOCAL_EDITOR_FIT_MODE_NORMALIZATION_FIX.md`
- `PROJECT_CHANGELOG_APPEND_20260512_EDITOR_FIT_MODE_FIX.md`

### Notes
- This fixes editor import errors where a new record has an invalid `heroFitMode`.
- Valid fit modes remain `cover` and `contain`; invalid values are normalized to `cover`.


## 2026-05-12 — Image data validation

### Changed
- Added a portfolio image data validation script.
- Added validation for image record fields, unique IDs, category references, rendition path prefixes, existing files, WebP output, metadata consistency, and hero slide eligibility.
- Added documentation for image data validation reports.

### Files changed
- `scripts/Validate-PortfolioImageData.ps1`
- `scripts/validate-portfolio-image-data.mjs`
- `docs/IMAGE_DATA_VALIDATION.md`
- `PROJECT_CHANGELOG_APPEND_20260512_IMAGE_DATA_VALIDATION.md`

### Notes
- This creates a guardrail for future imports and local editor changes.
- The validator can run in normal mode or with warnings treated as errors.


## 2026-05-12 — Image import workflow

### Changed
- Added a dry-run-first portfolio image import workflow.
- Added an inbox audit script for `source-images/inbox`.
- Added a Node/Sharp importer that creates full, display, texture, and thumb WebP renditions.
- Added JSON update logic for appending new records to `src/data/galleryImages.json`.
- Added optional category update and source-file move behavior.

### Files changed
- `scripts/Audit-ImageImportInbox.ps1`
- `scripts/Import-PortfolioImages.ps1`
- `scripts/import-portfolio-images.mjs`
- `docs/IMAGE_IMPORT_WORKFLOW.md`
- `PROJECT_CHANGELOG_APPEND_20260512_IMAGE_IMPORT_WORKFLOW.md`

### Notes
- This completes the basic image pipeline: source image in, optimized public renditions out, JSON record appended.
- It should run on `dev` first.


## 2026-05-12 — Image removal workflow

### Changed
- Added a dry-run-first script for removing a portfolio image record by ID.
- Added archival behavior for removed public rendition files.
- Added automatic hero slide cleanup for removed image IDs.
- Added documentation for removing test imports safely.

### Files changed
- `scripts/Remove-PortfolioImageRecord.ps1`
- `scripts/remove-portfolio-image-record.mjs`
- `docs/IMAGE_REMOVAL_WORKFLOW.md`
- `PROJECT_CHANGELOG_APPEND_20260512_IMAGE_REMOVAL_WORKFLOW.md`

### Notes
- This is intended for test-import cleanup and future image removal.
- Removed image files are moved to `asset-archive/`, not deleted.


## 2026-05-12 — Legacy editor import repair

### Changed
- Added a repair script for image records that still point to `/images/imported/...`.
- Added an editor backend audit script for detecting legacy import paths.
- Re-included the rendition-based local editor import backend files.
- Added documentation for repairing legacy editor import output.

### Files changed
- `local-editor/app/image_importer.py`
- `local-editor/app/asset_manager.py`
- `scripts/Audit-EditorLegacyImportPaths.ps1`
- `scripts/Repair-LegacyImportedImageRecords.ps1`
- `scripts/repair-legacy-imported-image-records.mjs`
- `docs/LEGACY_EDITOR_IMPORT_REPAIR.md`
- `PROJECT_CHANGELOG_APPEND_20260512_LEGACY_EDITOR_IMPORT_REPAIR.md`

### Notes
- This fixes records that cause 4 prefix violations after a test import writes into `/images/imported/`.


## 2026-05-12 — Local editor image pipeline contract

### Changed
- Added a local editor compatibility audit script.
- Added a local editor launch helper that can run the compatibility audit before startup.
- Added an editor pipeline snapshot script.
- Added documentation defining the editor's contract with the cleaned image pipeline.

### Files changed
- `scripts/Audit-LocalEditorCompatibility.ps1`
- `scripts/Run-LocalEditor.ps1`
- `scripts/Export-EditorPipelineSnapshot.ps1`
- `docs/LOCAL_EDITOR_IMAGE_PIPELINE_CONTRACT.md`
- `local-editor/EDITOR_PIPELINE_CONTRACT.md`
- `PROJECT_CHANGELOG_APPEND_20260512_LOCAL_EDITOR_PIPELINE_CONTRACT.md`

### Notes
- This is a guardrail pack before modifying editor internals.
- It identifies stale path assumptions without replacing editor source code yet.


## 2026-05-12 — Workspace cleanup locked folder fix

### Changed
- Updated `Clean-WorkspaceRootArtifacts.ps1` to continue cleanup when one folder cannot be moved.
- Added `-CopyThenRemove` to preserve a directory in the archive before trying to remove the root copy.
- Added `-SkipChatUploads` for bypassing locked `_chat-uploads` folders.
- Added cleanup result reports.
- Added a troubleshooting helper for `_chat-uploads` locks.

### Files changed
- `scripts/Clean-WorkspaceRootArtifacts.ps1`
- `scripts/Unlock-ChatUploadFolderHelp.ps1`
- `docs/WORKSPACE_CLEANUP_LOCKED_FOLDER_FIX.md`
- `PROJECT_CHANGELOG_APPEND_20260512_WORKSPACE_CLEANUP_LOCKED_FOLDER_FIX.md`

### Notes
- This fixes cleanup failure caused by Windows denying access to `_chat-uploads`.


## 2026-05-12 — Workspace root final cleanup tooling

### Changed
- Added root artifact audit tooling.
- Added dry-run-first workspace root cleanup that archives generated pack/report/changelog files.
- Added `.gitignore` updater for local archive/report/source folders.
- Added workspace root validation to prevent generated artifacts from staying in the active project tree.
- Added documentation for the intended root-folder policy.

### Files changed
- `scripts/Update-WorkspaceGitignore.ps1`
- `scripts/Audit-WorkspaceRootArtifacts.ps1`
- `scripts/Clean-WorkspaceRootArtifacts.ps1`
- `scripts/Validate-WorkspaceRootClean.ps1`
- `docs/WORKSPACE_ROOT_CLEANUP_POLICY.md`
- `PROJECT_CHANGELOG_APPEND_20260512_WORKSPACE_ROOT_FINAL_CLEANUP.md`

### Notes
- This cleanup archives generated artifacts into `asset-archive/`; it does not permanently delete them.
- `asset-archive/`, `asset-reports/`, and `source-images/` should remain local and untracked.


---

## Appended changelog fragments - 20260512-130115


## 2026-05-12 — Changelog fragment policy

### Changed
- Added explicit policy for `PROJECT_CHANGELOG_APPEND_*.md` files.
- Added a dry-run-first fragment consolidation script.
- Added validation to prevent temporary changelog fragments and pack notes from becoming permanent root files.
- Added documentation explaining what to commit and what to archive.

### Files changed
- `scripts/Consolidate-ChangelogFragments.ps1`
- `scripts/Validate-ChangelogFragmentsClean.ps1`
- `docs/CHANGELOG_FRAGMENT_POLICY.md`
- `PROJECT_CHANGELOG_APPEND_20260512_CHANGELOG_FRAGMENT_POLICY.md`

### Notes
- Changelog append files are temporary. They should be appended into `PROJECT_CHANGELOG.md`, then moved to `asset-archive/`.


## 2026-05-12 — Handoff refresh workflow

### Changed
- Added a script that writes a current project handoff snapshot.
- Added a script that creates a source-focused handoff zip for future chats.
- Added documentation for refreshing handoff state after major project changes.

### Files changed
- `scripts/Write-PortfolioHandoffSnapshot.ps1`
- `scripts/Create-PortfolioHandoffZip.ps1`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/HANDOFF_REFRESH_WORKFLOW.md`
- `PROJECT_CHANGELOG_APPEND_20260512_HANDOFF_REFRESH.md`

### Notes
- This keeps future chats aligned with the current `dev` branch, cleaned image pipeline, editor import workflow, and validation tools.


## 2026-05-12 — Handoff snapshot PowerShell syntax fix

### Changed
- Replaced the handoff snapshot script with a Windows PowerShell-safe version.
- Removed Markdown backtick-heavy strings from the PowerShell source.
- Switched generated Markdown code fences from triple backticks to `~~~`.
- Added documentation for the syntax issue.

### Files changed
- `scripts/Write-PortfolioHandoffSnapshot.ps1`
- `docs/HANDOFF_SNAPSHOT_POWERSHELL_SYNTAX_FIX.md`
- `PROJECT_CHANGELOG_APPEND_20260512_HANDOFF_SNAPSHOT_SYNTAX_FIX.md`

### Notes
- This fixes parser errors when generating the current project handoff snapshot.


---

## Appended changelog fragments - 20260512-131729


## 2026-05-12 — Staged commit audit

### Changed
- Added a staged commit audit for large cleanup commits.
- Added a single pre-commit command that runs workspace, changelog, staged-file, image-data, dev-branch, and build checks.
- Added documentation for expected warnings during the cleanup commit.

### Files changed
- `scripts/Audit-StagedCommit.ps1`
- `scripts/Run-PreCommitPortfolioChecks.ps1`
- `docs/STAGED_COMMIT_AUDIT.md`
- `PROJECT_CHANGELOG_APPEND_20260512_STAGED_COMMIT_AUDIT.md`

### Notes
- This is intended to prevent generated archives, reports, source images, pack notes, and changelog fragments from accidentally staying tracked.

