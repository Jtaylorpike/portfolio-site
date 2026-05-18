# Taylor Pike Portfolio Project Changelog

This file records meaningful design, architecture, data, editor, and gallery changes made during development.

Current source files remain the source of truth. This changelog is a historical record and should be updated with every replacement pack going forward.

---

## 2026-05-15 — Phase 4D import review workflow polish

### Changed
- Added remove-from-review controls to individual import review cards.
- Changed the reviewed import action to dynamic wording such as `Import X photo(s)`.
- Added an import progress panel with upload progress, percentage text, and log/status messages.
- Added category creation controls within the import workflow.
- Updated the backend import endpoint so reviewed categories can be saved with the import transaction.
- Bumped the local editor script cache version to `v=48`.

### Files changed
- `local-editor/app/image_importer.py`
- `local-editor/static/js/api.js`
- `local-editor/static/js/dom.js`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/static/editor.css`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4D_IMPORT_REVIEW_WORKFLOW_POLISH.md`
- `PROJECT_CHANGELOG.md`

### Notes
- Browser upload progress is real. Backend rendition generation remains a single non-streaming Flask request, so backend progress is stage-based.
- New categories created from the import screen are saved when the reviewed import is submitted.

---

## 2026-05-12 — Stale public data archive cleanup

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


## 2026-05-12 — Dev branch validation tooling

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


## 2026-05-12 � Validation empty report fix

### Changed
- Fixed `Audit-PublicImageReferences.ps1` so empty report files are explicitly cleared and recreated.
- Fixed `Validate-PortfolioDevBranch.ps1` so the public image audit check reads the missing count from the audit summary instead of stale text file contents.

### Files changed
- `scripts/Audit-PublicImageReferences.ps1`
- `scripts/Validate-PortfolioDevBranch.ps1`
- `PROJECT_CHANGELOG_APPEND_20260512_EMPTY_REPORT_FIX.md`

### Notes
- The prior validation output showed `Missing referenced files: 0` in the summary but still failed with 4 missing files because stale rows remained in `public-image-missing.txt`.


## 2026-05-12 � Dev validation PowerShell parser fix

### Changed
- Replaced the dev branch validation script with an ASCII-only version.
- Rewrote compact one-line helper functions into expanded PowerShell syntax.
- Wrote the replacement script with a UTF-8 BOM for safer Windows PowerShell 5.1 parsing.

### Files changed
- `scripts/Validate-PortfolioDevBranch.ps1`
- `PROJECT_CHANGELOG_APPEND_20260512_VALIDATION_ASCII_FIX.md`

### Notes
- This fixes the parser error caused by mojibake from a non-ASCII dash in the validation script.


## 2026-05-12 � Workspace and image folder cleanup tooling

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


## 2026-05-12 � Dev validation image data integration

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


## 2026-05-12 � Local editor fit mode normalization fix

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


## 2026-05-12 � Image data validation

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


## 2026-05-12 � Image import workflow

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


## 2026-05-12 � Image removal workflow

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


## 2026-05-12 � Legacy editor import repair

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


## 2026-05-12 � Local editor image pipeline contract

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


## 2026-05-12 � Workspace root final cleanup tooling

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


## 2026-05-12 � Dev validation image data integration

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


## 2026-05-12 � Local editor fit mode normalization fix

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


## 2026-05-12 � Image data validation

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


## 2026-05-12 � Image import workflow

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


## 2026-05-12 � Image removal workflow

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


## 2026-05-12 � Legacy editor import repair

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


## 2026-05-12 � Local editor image pipeline contract

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


## 2026-05-12 � Workspace cleanup locked folder fix

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


## 2026-05-12 � Workspace root final cleanup tooling

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


## 2026-05-12 � Changelog fragment policy

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


## 2026-05-12 � Handoff refresh workflow

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


## 2026-05-12 � Handoff snapshot PowerShell syntax fix

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


## 2026-05-12 � Staged commit audit

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


---

## Appended changelog fragments - 20260512-132415


## 2026-05-12 � Dev to main release readiness

### Changed
- Added a dev-to-main release readiness audit.
- Added a release merge checklist generator.
- Added documentation for merging validated `dev` work into public `main`.

### Files changed
- `scripts/Audit-DevToMainReleaseReadiness.ps1`
- `scripts/Write-ReleaseMergeChecklist.ps1`
- `docs/DEV_TO_MAIN_RELEASE_WORKFLOW.md`
- `PROJECT_CHANGELOG_APPEND_20260512_DEV_TO_MAIN_RELEASE_READINESS.md`

### Notes
- This is intended for the final check before merging image pipeline/editor cleanup work into `main`.


---

## Appended changelog fragments - 20260512-174755


# Changelog append - 2026-05-12 - Editor ID rename authoritative reload fix

## Changed

- Hardened the local editor image ID rename workflow after the initial route-refresh fix was still not enough.
- After a successful rename, the editor now reloads authoritative data from `/api/data` before rendering the renamed image route.
- Added a visible identity sync check that confirms the image card route, hidden ID field, and visible Current ID value all match the renamed ID.
- Added a hard reload fallback if the dynamic editor render path remains stale after rename.
- Added `data-current-image-id` to the visible Current ID element for deterministic post-rename verification.
- Bumped local editor asset cache version to `v=18`.

## Files

```text
local-editor/static/js/main.js
local-editor/static/js/render.js
local-editor/templates/editor.html
docs/EDITOR_IMAGE_ID_RENAME_AUTHORITATIVE_RELOAD_FIX.md
```


## 2026-05-12 — Editor image ID rename backend fix

- Added the missing backend helper functions used by `rename_image_id()` in `local-editor/app/data_store.py`.
- Added safe title/slug-based ID de-duplication on the backend.
- Added canonical portfolio rendition URL generation for image ID renames.
- Added safe public path resolution so rename operations stay inside `public/`.
- Added all-four-rendition file planning with missing-file and target-collision checks.
- Added rollback behavior if a multi-file rename fails partway through.
- Kept the prior authoritative editor reload behavior and bumped editor asset cache version to `v=19`.


# Changelog append — Editor image ID rename UI refresh fix

Date: 2026-05-12

## Changed

- Updated the local editor image ID rename flow so successful renames render the new image-detail route directly instead of rendering against the old image hash first.
- Added a defensive check that the rename API response includes `updatedImage.id` before the UI updates the route.
- Extended `applyLoadedState()` so callers can pass an explicit route when the current hash route is no longer valid after a data mutation.
- Bumped the local editor CSS/JS cache-bust query from `v=16` to `v=17`.

## Reason

The previous rename flow could leave the visible Image identity panel stale after `Rename ID + Rendition Files` because the editor state updated before the browser hash moved from the old image ID to the new image ID.


## 2026-05-12 � Editor image ID rename workflow

### Changed
- Added a controlled image ID rename endpoint to the Flask editor backend.
- Added backend logic to update `galleryImages[].id`, `heroSlides[].imageId`, and portfolio rendition paths together.
- Added copy-first file rename behavior for `display`, `thumb`, `texture`, and `full` WebP renditions.
- Added browser API support for image ID renames.
- Added image detail UI for title-based ID suggestions and future rendition path previews.
- Changed new imports to default to title-based IDs instead of category-prefixed filename IDs.
- Added import review title-to-ID auto-sync until the ID is manually edited.
- Bumped the local editor asset cache version.

### Files changed
- `local-editor/app/data_store.py`
- `local-editor/app/routes.py`
- `local-editor/static/js/api.js`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/static/js/importValidation.js`
- `local-editor/static/editor.css`
- `local-editor/templates/editor.html`
- `docs/EDITOR_IMAGE_ID_RENAME_WORKFLOW.md`
- `PROJECT_CHANGELOG_APPEND_20260512_EDITOR_IMAGE_ID_RENAME.md`

### Notes
- Existing image IDs remain protected from direct free editing.
- Renames should use the dedicated `Rename ID + Rendition Files` action.
- This pack should be applied before the gallery curation controls pack is regenerated.


## 2026-05-12 � Editor import UI validation

### Changed
- Added browser-side import validation for IDs, duplicate IDs, required text fields, fit modes, and frame styles.
- Added browser-side image dimension detection before import review.
- Expanded the import review cards to show orientation, hero eligibility, rendition output paths, gallery fit mode, gallery frame style, gallery size, thumbnail crop, and virtual gallery crop.
- Added a dedicated `importValidation.js` module for shared import UI rules.
- Bumped local editor asset cache version in `editor.html`.

### Files changed
- `local-editor/static/js/importValidation.js`
- `local-editor/static/js/collect.js`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/static/editor.css`
- `local-editor/templates/editor.html`
- `docs/EDITOR_IMPORT_UI_VALIDATION.md`
- `PROJECT_CHANGELOG_APPEND_20260512_EDITOR_IMPORT_UI_VALIDATION.md`

### Notes
- The backend remains the final source of validation truth.
- This change prevents invalid import values earlier in the editor UI and makes the new rendition pipeline visible before save.


# Changelog append - 2026-05-12 - Gallery curation controls regenerated

- Added `src/data/galleryCuration.json` as the editable image-to-wall assignment layer for the 3D gallery.
- Added a Gallery tab to the Flask local editor for assigning artwork, wall section metadata, display order metadata, plaque visibility, and plaque side.
- Updated the local editor backend with gallery curation read/save support.
- Updated backup creation/restore handling so gallery curation data is preserved when present.
- Updated image ID rename handling so `galleryCuration[].artworkId` follows controlled ID renames.
- Updated `galleryBlueprint.ts` so fixed architecture remains in TypeScript while artwork assignment is applied from JSON.
- Replaced the stale hardcoded `climbing-landscape-portfolio-02` gallery reference with `landscape-201019-jtp6059`.
- Added `docs/GALLERY_CURATION_WORKFLOW.md`.
- Added `docs/PROJECT_CREATIVE_INTENT_AND_DESIGN_PHILOSOPHY.md` to preserve the human/design-philosophy side of the project.


# Changelog Append — 2026-05-12 — Gallery Curation Visual Assignment and Wall Types

- Added a visual **Assign artwork** overlay to the Gallery editor page so wall assignments can be chosen from image thumbnails instead of names/IDs only.
- Kept the Assigned artwork ID select as a precise fallback control.
- Replaced the ambiguous `wallSection` curation field with a smaller descriptive `wallType` model.
- Added human-facing wall labels while preserving stable internal `wallId` blueprint slots.
- Updated gallery curation normalization to migrate older `wallSection` values into the newer wall type model.
- Updated `galleryCuration.json`, local editor UI, editor data collection, Flask data validation, and gallery blueprint types to use wall types.
- Updated gallery artwork layout metadata so runtime artwork records keep a human-readable wall label while also carrying the new wall type.


# Changelog Append - Gallery Wall Block Types and Card Save

Date: 2026-05-12

## Changed

- Replaced location/zone-style gallery wall type labels with a smaller physical wall-block taxonomy.
- Added `feature-wall`, `wide-display-wall`, `standard-display-wall`, `compact-display-wall`, and `unassigned-wall`.
- Made wall block type affect the rendered gallery wall preset and artwork scale.
- Added a per-card `Save Wall` action to the gallery curation editor.
- Added a backend route for saving one gallery curation wall record into `galleryCuration.json`.
- Kept the global `Save All Gallery Curation` action for batch edits and reorder operations.
- Updated gallery curation docs for the new wall block type model.

## Notes

This does not add visual drag-and-drop wall placement. Wall position and rotation remain controlled by `galleryBlueprint.ts`.


# Changelog Append — Gallery Wall Type Display Status Cleanup

- Replaced the user-facing `unassigned-wall` option with `narrow-transition-wall`.
- Added a separate Display status control for gallery wall cards.
- Preserved `showInGallery` as the data field for active/hidden wall slots.
- Updated TypeScript gallery wall type normalization and layout defaults.
- Added a narrow wall preset for transition/guide wall slots.
- Migrated current entry guide wall records to `narrow-transition-wall` while keeping them hidden/inactive.
- Added documentation for the wall type/status separation.


---

## Appended changelog fragments - 20260512-191656


## 2026-05-12 - Gallery architectural wall preview editor

- Revised the local editor gallery wall preview so it reads as an architectural wall elevation rather than a floating image/plaque composition.
- Added wall plane, baseboard, floor-plane, and wall-elevation cues to the preview surface.
- Grouped the frame and plaque as a mounted installation so side and below-plaque previews stay visually attached to the artwork.
- Updated the enlarged gallery wall preview lightbox to use the same architectural wall language.
- Bumped the local editor asset cache version to `v=26`.

Files changed:

- `local-editor/static/js/render.js`
- `local-editor/static/editor.css`
- `local-editor/templates/editor.html`
- `docs/GALLERY_ARCHITECTURAL_WALL_PREVIEW_EDITOR.md`


# Changelog Append: Gallery Editor Stabilization and Validation

## Added

- Added Gallery tab curation summary cards for total wall slots, active walls, hidden walls, and assigned artwork.
- Added wall block type count pills.
- Added Gallery tab filters for search, display status, wall block type, and artwork category.
- Added wall card badges for active/hidden state, assigned/needs-artwork state, and wall block type.
- Added search and category filters to the visual artwork assignment overlay.
- Added gallery curation validation to `scripts/validate-portfolio-image-data.mjs`.
- Added `asset-reports/portfolio-gallery-curation-audit.csv` output from the validator.
- Added docs for gallery editor stabilization, gallery curation validation, future map editor planning, and public 3D gallery review.

## Changed

- Bumped local editor cache version to `v=23`.
- Updated Gallery workflow documentation to mention the current usability layer.

## Notes

This is a stabilization/polish pack. It does not redesign the public 3D gallery room or change wall positions, collisions, fog, lighting, or plaque placement.


## 2026-05-12 — Gallery floor-grid placement and collision prevention

- Replaced freehand gallery wall X/Z placement controls with 0.5m floor-grid controls in the local editor.
- Added wall footprint calculations based on wall block type and cardinal facing.
- Updated the placement map so wall slots render as scaled floor footprints instead of point markers.
- Added editor-side collision warnings and disabled Save Wall / Save All when wall footprints overlap.
- Added backend collision validation so overlapping wall placement cannot be written to `galleryCuration.json`.
- Snapped current gallery wall positions to the 0.5m floor grid.
- Extended portfolio image data validation to detect unsnapped placement values and wall footprint collisions.
- Kept the 3D gallery runtime data contract on `positionX`, `positionZ`, and `rotationYDegrees`.


# Changelog append - 2026-05-12 - Gallery plaque collision fallback

## Added

- Added runtime plaque placement collision detection for the 3D gallery.
- Added automatic below-frame plaque fallback when a left/right side plaque would overlap the artwork frame.
- Added documentation for the plaque collision fallback behavior.

## Changed

- Updated `src/gallery/GalleryScene.ts` so plaque placement now respects the resolved left/right side when there is enough wall clearance.
- Replaced side plaque clamping with an explicit fit check, preventing plaques from being pushed into landscape frames on tighter wall blocks.

## Not changed

- Did not change gallery wall positions.
- Did not change collision movement boundaries.
- Did not change lighting, fog, room shell, artwork assignment, or gallery curation data.
- Did not add a new editor-facing `below` plaque option yet.


# Changelog Append — Gallery Preview Lightbox Editor

Date: 2026-05-12

## Added

- Added a large preview overlay for Gallery tab assigned artwork thumbnails.
- Added a large preview overlay for compact wall previews.
- Added keyboard access for preview triggers with Enter and Space.
- Added Escape/backdrop/close-button dismissal for the preview overlay.
- Added documentation for the gallery preview lightbox editor behavior.

## Changed

- Converted the Gallery tab assigned artwork preview into an interactive preview trigger.
- Made the compact wall preview open a larger version using the current wall card controls.
- Bumped the local editor asset cache version to `v=25`.

## Not changed

- Did not change the 3D gallery runtime.
- Did not change gallery wall placement, lighting, fog, collision, plaques, or movement.
- Did not change image data, gallery curation data, or backend save logic.


## 2026-05-12 - Gallery preview plaque marker fix

- Replaced text inside the editor wall-preview plaque with abstract marker lines so compact previews no longer show clipped title fragments.
- Removed dynamic plaque-title syncing from the editor preview refresh path.
- Kept plaque placement, scaled wall preview geometry, and runtime gallery plaque behavior unchanged.
- Added `docs/GALLERY_PREVIEW_PLAQUE_MARKER_FIX.md`.


# Changelog Append - Gallery Scaled Wall Preview Editor

Date: 2026-05-12

## Changed

- Reworked the Gallery tab wall preview from a decorative-grid composition into a scaled wall-elevation preview.
- Added wall-block dimensions and artwork-size presets to the editor preview model so preview proportions better match the 3D gallery's current wall types.
- Updated frame and plaque preview placement to use percentage positions derived from physical wall dimensions.
- Removed the misleading grid background from the preview wall plane.
- Improved compact card preview behavior so frame, plaque, and wall surface do not read as detached UI elements.
- Bumped the Flask editor asset cache version to v27.

## Added

- Added `docs/GALLERY_SCALED_WALL_PREVIEW_EDITOR.md`.

## Notes

- This is an editor-preview update only.
- It does not change 3D gallery runtime geometry, collision, lighting, plaques, image data, or curation data.


## 2026-05-12 — Gallery wall placement controls

- Added editor-controlled physical placement fields to gallery curation records: `positionX`, `positionZ`, and `rotationYDegrees`.
- Updated the Three.js gallery blueprint so `galleryCuration.json` can override an existing wall slot's room position and facing.
- Added a Wall placement control group to each Gallery tab wall card.
- Added a top-down placement map to the Gallery tab summary so wall slots can be understood spatially before a full drag/map editor exists.
- Extended Flask-side gallery curation normalization and validation for wall placement fields.
- Extended portfolio image data validation reporting for gallery wall placement fields.
- Removed the visible `scaled wall elevation` label from the editor wall preview.
- Kept the current room layout, collision system, lighting, fog state, and plaque runtime behavior otherwise unchanged.


## 2026-05-12 - Gallery wall preview editor

- Added a 2D wall preview to each Gallery curation card in the Flask editor.
- The preview shows assigned artwork, approximate wall block scale, display status, and plaque placement.
- Added editor-side plaque fallback awareness so left/right plaque choices visually fall below the frame when the image/wall ratio is too tight.
- Updated the Gallery card preview when assigned artwork, wall block type, plaque side, plaque enabled state, or display status changes.
- Added documentation for the Gallery wall preview editor behavior.


---

## Appended changelog fragments - 20260513-130436


## 2026-05-12 - Gallery drag/drop wall entity editor

- Replaced the rejected select-on-map concept with a drag/drop wall placement model.
- Added a wall-entity sidebar beside the floor-grid map.
- Added drag support from the sidebar onto the map and from placed wall footprints to new grid cells.
- Dragging a placed wall off the map now marks it as not placed instead of deleting the wall entity.
- Added `placedInGallery` to gallery curation data so wall-card existence is separate from physical room placement.
- Added Add Wall Card and Remove Wall controls in the gallery editor.
- Updated the runtime gallery blueprint so `galleryCuration.json` can be the wall-entity source of truth, including custom wall entities and removed base wall entities.
- Updated gallery validation/collision logic so unplaced wall entities do not participate in footprint collision checks.


## 2026-05-12 - Gallery interactive floor-grid map editor

- Made the Gallery tab's wall footprint map interactive.
- Added selectable wall markers to the placement map.
- Added a **Select on map** button to each gallery wall card.
- Added click-to-place behavior: after selecting a wall, clicking the map moves that wall to the clicked 0.5m grid cell.
- Updated map markers, card selection state, meter readouts, collision warnings, and save-button state from unsaved editor changes.
- Kept the existing `galleryCuration.json` placement schema unchanged.
- Did not change public gallery room layout, lighting, fog, movement, plaque runtime behavior, or image data.


## 2026-05-13 — Gallery Map Controls Height Fix

- Fixed the gallery floor-map controls panel stretching into a large empty box above the grid.
- Updated the map column layout so controls remain compact while the grid fills the available space.
- Bumped the Flask editor CSS/JS cache version to `v=40`.


## 2026-05-13 — Gallery Map Drag Direction and Rectangle Wall Refinement

- Fixed the editor map drag/drop preview so its X-axis mapping matches the resting wall marker orientation.
- Made wall blocks render as simple continuous square-ended rectangles in both resting and drag-preview states.
- Tightened the map controls bar and removed excess helper text from the compact control container.
- Bumped local editor cache version to `v=39`.


# Changelog Append — Gallery Map Drag Preview Cleanup

Date: 2026-05-13

## Changed

- Hid the native browser drag ghost while dragging gallery wall entities or placed wall footprints.
- Kept the map footprint preview as the primary drag feedback while placing or moving walls.
- Added drag-state styling so the source sidebar item or map marker is visually muted while dragging.
- Bumped the local editor asset cache version to `v=34`.

## Fixed

- Removed a duplicate `placedInGallery: false` key in the new wall-card default record.

## Not changed

- No gallery runtime files were changed.
- No wall placement data was changed.
- No backend routes or data schema were changed.
- No image data, image files, lighting, fog, plaques, camera, or movement behavior was changed.


# Changelog Append — Gallery Map Orientation, Boundary, and Runtime Visibility Fix

## Added

- Added editor-side boundary validation for placed gallery wall footprints that extend outside the floor-map border.
- Added backend validation for out-of-bounds gallery wall footprints.
- Added image-data validator checks for out-of-bounds gallery wall footprints.

## Changed

- Changed the public 3D gallery wall list to filter hidden walls out of the runtime wall meshes.
- Mirrored the editor floor map horizontally so placement reads more naturally.
- Moved Save Gallery Curation into the map-control bar.
- Simplified the map grid to a uniform cell grid to remove irregular center-line spacing.
- Restyled map walls as darker continuous wall lines with squared ends.
- Corrected facing-arrow placement and rotation so arrows sit on the facing side of each wall, including 45-degree walls.

## Fixed

- Fixed hidden walls still appearing in the virtual gallery.
- Fixed wall placement being allowed when a wall footprint extended past the map border.
- Fixed facing arrows pointing into walls or drifting away from the correct side after rotation.
- Fixed visual grid clutter and the close-line artifact near the map center.


## 2026-05-13 - Gallery map sidebar and drop highlight

- Flipped the gallery placement editor layout so the floor map sits left and the wall entity sidebar sits right.
- Strengthened sidebar card framing so each draggable wall entity reads as a discrete object.
- Changed sidebar wall labels to show wall number first and assigned artwork title second.
- Added a live grid-footprint landing preview while dragging a wall over the floor map.
- Added collision-state styling to the landing preview when the hovered drop position would overlap an existing wall footprint.
- Preserved the existing behavior where dragging a wall off the map marks it as not placed without deleting the wall card.


## 2026-05-13 — Gallery Map Visible Voxel Walls and Icon Controls

- Improved the gallery floor-grid editor so wall footprints remain visible while resting on the map instead of reading primarily as wall numbers and facing arrows.
- Reinforced the voxel/tile visual model by making occupied wall cells fill their full grid squares.
- Added clearer selected-wall, hidden-wall, collision, and drop-preview wall-cell treatments.
- Replaced text-heavy map rotation controls with icon-style controls for rotate-left, rotate-right, and flip-facing actions while retaining accessible labels and tooltips.
- Bumped the local editor cache version to `v=36`.


## 2026-05-13 - Gallery map visual refinement and add-wall modal

- Refined the Gallery tab floor-grid map so wall footprints render as continuous wall lines instead of segmented cell blocks.
- Removed the map axis labels and reduced visual clutter on the grid surface.
- Updated 45-degree wall rendering so resting walls visually match dragged walls.
- Centered facing arrows on the outward-facing side of each wall.
- Moved Save Gallery Curation into the map column below the grid.
- Stretched the wall-entity sidebar so the wall list reaches the bottom of the sidebar container.
- Widened the editor page/map layout to give the grid more usable room.
- Moved Add Wall Card to the wall-card section header.
- Added an Add Wall Card modal so new wall entities can be configured before being added to the list.


## 2026-05-13 - Gallery voxel map and rotation controls

- Changed the gallery placement editor from coordinate-style placement to voxel-style full-cell wall footprints.
- Updated wall type footprints to use discrete cell lengths so walls visually occupy full grid squares.
- Added support for 45-degree wall rotation values in editor helpers, Flask normalization, and image data validation.
- Moved rotation/facing controls from individual wall cards to the floor map controls.
- Added map controls for rotating selected walls, flipping facing direction, and removing a selected wall from the map without deleting the wall entity.
- Added a facing indicator on each placed wall footprint.
- Updated placement collision checks to compare occupied grid cells instead of rectangle overlap bounds.
- Kept the existing `galleryCuration.json` schema based on meter positions and `rotationYDegrees` so the runtime gallery remains compatible.


---

## Appended changelog fragments - 20260513-132803


## 2026-05-13 — Gallery Map Final Viewport and Grid Fix

- Restored the gallery placement map to a true square board so X/Z cells render with equal visual scale.
- Replaced the vertically condensed map sizing with a viewport-aware square clamp.
- Disabled the legacy center-axis pseudo-elements that caused doubled/uneven-looking grid lines.
- Removed fixed-pixel wall thickness from map markers so every wall block renders at a consistent one-cell thickness.
- Kept wall block types visually differentiated by length rather than thickness/volume.
- Bumped the local editor cache version to `v=42`.


## 2026-05-13 — Gallery map height, grid, and wall thickness fix

- Constrained the local editor gallery floor map height so the full map is easier to see without excessive page scrolling.
- Replaced the layered/repeating grid background with a uniform cell grid to remove visually uneven center-line spacing.
- Standardized editor map wall-block thickness so wall types differ by length, not visual volume.
- Kept hidden editor map walls subdued but visible.
- Bumped the local editor cache version to `v=41`.


---

## Appended changelog fragments - 20260513-173046


# Changelog Append — 2026-05-13 — Phase 0 Gallery Map Whitespace Closure

## Changed

- Added an explicit Gallery map intro wrapper in `local-editor/static/js/render.js`.
- Added final layout overrides in `local-editor/static/editor.css` to make the Gallery map section wrap to actual content height.
- Kept the map board square and preserved the right-side wall entity sidebar.
- Updated local editor cache query strings from `v=43` to `v=44`.
- Added documentation for the whitespace closure and current project roadmap under `docs/`.

## Not changed

- No public site files changed.
- No gallery curation data changed.
- No image records changed.
- No drag/drop, rotation, facing, collision, or save behavior changed intentionally.


# Changelog Append — Phase 1 Public Site Audit

Date: 2026-05-13

## Added

- Added `docs/PUBLIC_SITE_POLISH_AUDIT.md`.
- Added `docs/COPY_AUTHORSHIP_AND_PLACEHOLDER_POLICY.md`.
- Updated `docs/PROJECT_ROADMAP_CURRENT.md` to mark Phase 0 as complete and Phase 1 as current.

## Notes

- No public site code was changed in this pack.
- No editor code was changed in this pack.
- No image data was changed in this pack.
- The audit identifies the pixel/interface font restoration as a likely first Phase 2 implementation target.
- The audit records that final public-facing copy should be user-authored, especially for the About page.


# Changelog Append — 2026-05-13 — Phase 2A Public Interface Font Restoration

## Summary

Started Phase 2 public polish with a narrow CSS-only pass focused on restoring the pixel/VCR interface font throughout the public UI while preserving body copy readability.

## Changed

- Updated the main public interface typography selector to use `var(--font-interface)` instead of `Inter, Arial, Helvetica, sans-serif`.
- Added the public text brand selectors to the interface typography system.
- Adjusted text-brand weight/spacing so the VCR/pixel face reads as intentional rather than fake-bolded.
- Removed the late `.gallery-close` override that forced Arial back onto the gallery close button.
- Added a small accent-colored text selection style.
- Added Phase 2 documentation and refreshed the current roadmap.

## Not changed

- No public copy was changed.
- No editor behavior was changed.
- No image data was changed.
- No gallery room, curation, collision, plaque, or placement behavior was changed.

## Validation

- `npm ci` passed.
- `npm run build` passed.


# Changelog Append — 2026-05-13 — Phase 2A Typography Scope Correction

## Summary

Corrected the Phase 2A public typography direction so the VCR/pixel-style font is used only as a secondary/tertiary accent instead of becoming the main public interface font.

## Changed files

```text
src/styles/global.css
docs/PHASE2A_TYPOGRAPHY_SCOPE_CORRECTION.md
```

## Details

- Restored the main public interface stack to the normal sans-serif typeface.
- Added a separate `--font-accent` variable for the VCR/pixel face.
- Scoped the pixel font to minor numeric accents:
  - `.pixel-number`
  - `.hero-index-number`
  - `.portfolio-index-number`
  - `.portfolio-grid-card-index`
  - `.image-lightbox-counter`
- Prevented the `Taylor Pike` header/wordmark from being changed to the pixel font.
- Kept site copy and page content untouched.

## Validation

```text
npm run build
```

Result: passed.


# Changelog Append — 2026-05-13 — Phase 2B Homepage Polish

## Summary

Implemented a CSS-only homepage polish pass after Phase 0 and the Phase 2A typography scope correction.

## Changed

- Refined public header depth and navigation hover behavior.
- Added a contained Phase 2B homepage polish block to `src/styles/global.css`.
- Tightened hero index rhythm and active state treatment.
- Preserved narrow VCR/pixel font scope while allowing hero thumbnail numbers to use the accent font.
- Added editorial guide-line treatment around the hero stage.
- Added a subtle hero copy-panel readability overlay.
- Improved homepage CTA hover response.
- Refined hero metadata separator treatment.
- Refined thumbnail/contact-sheet density, border treatment, and active states.
- Added homepage intro top accent rule and archive-card hover treatment.
- Added responsive overrides for tablet and mobile widths.
- Updated documentation for Phase 2B, roadmap continuity, public polish, and copy ownership.

## Not changed

- No public website copy changed.
- No About page copy changed.
- No editor files changed.
- No image data changed.
- No gallery data changed.
- No 3D gallery behavior changed.
- No route or markup changes.

## Validation

- `npm run build` passed.
- `node scripts/validate-portfolio-image-data.mjs --project-root .` returned 0 errors and 1 known warning about an active placed wall slot without assigned artwork.


# Changelog Append — 2026-05-13 — Phase 2C Portfolio Index Polish

## Summary

Implemented a narrow public portfolio/index polish pass.

## Files changed

- `src/app/sitePages.ts`
- `src/styles/global.css`
- `docs/PHASE2C_PORTFOLIO_INDEX_POLISH.md`
- `docs/PUBLIC_SITE_POLISH_AUDIT.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`

## Details

- Added generated image counts to portfolio category buttons.
- Added orientation-aware portfolio card class names for future styling hooks.
- Split portfolio card metadata into category, title, and optional location/year details.
- Removed placeholder-like fallback metadata from portfolio cards when location/year are absent.
- Refined category sidebar spacing, active state, count placement, and mobile horizontal behavior.
- Refined portfolio page heading separation and archive-rule treatment.
- Refined portfolio card hover/focus treatment, image borders, grid background detail, and card metadata spacing.
- Refined lightbox frame/caption hierarchy.
- Preserved route behavior, image data, editor behavior, gallery behavior, and public copy ownership.

## Validation

- `npm run build` passed.
- `node scripts/validate-portfolio-image-data.mjs --project-root .` returned 0 errors and 1 known warning.

## Known remaining warning

The validator still reports one active placed gallery wall slot with no assigned artwork. This warning predates Phase 2C and is unrelated to this pack.


# Changelog append — 2026-05-13 — Phase 2D Gallery Entry CTA Polish

## Changed

- Updated the homepage archive/status strip so the existing `02 / Spatial` card acts as a clearer virtual-gallery entry point.
- Added a small `Enter` button to the homepage gallery card using the existing `data-open-virtual-gallery` controller hook.
- Added functional gallery-control chips for `WASD / arrows`, `Mouse look`, and `Desktop`.
- Added subtle spatial/grid styling to the homepage gallery card.
- Added a dedicated class and arrow affordance to the portfolio page's `Open gallery room` button.
- Added a small accent marker to the top-nav Gallery button.
- Updated Phase 2 documentation and the current roadmap.

## Not changed

- No final public copy was rewritten.
- No About page copy was changed.
- No editor files were changed.
- No image data was changed.
- No gallery curation data was changed.
- No gallery room data was changed.
- No virtual-gallery movement, collision, loading, plaque, or camera behavior was changed.

## Validation

- `npm run build` passed.
- `node scripts/validate-portfolio-image-data.mjs --project-root .` returned 0 errors and 1 known warning.

The known warning is the pre-existing active placed gallery wall slot with no assigned artwork.


# Changelog Append — 2026-05-13 — Phase 2D Gallery Entry Scope Correction

## Summary

Narrowed the Phase 2D gallery-entry polish after visual review. The homepage archive/status section should remain a clean three-card section, and the top-nav Gallery item should not have a red/accent dot marker.

## Files changed

- `src/app/sitePages.ts`
- `src/styles/global.css`
- `docs/PHASE2D_GALLERY_ENTRY_SCOPE_CORRECTION.md`
- `docs/PHASE2D_GALLERY_ENTRY_CTA_POLISH.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PUBLIC_SITE_POLISH_AUDIT.md`

## Changes

- Removed the internal `Enter` button from the homepage `02 / Spatial` archive card.
- Removed gallery control chips from the homepage `02 / Spatial` archive card.
- Removed the special gallery-entry card class from the homepage archive/status strip.
- Removed the red/accent dot beside the top-nav Gallery button.
- Kept the portfolio page `Open gallery room` arrow affordance.
- Updated project documentation to record the corrected direction.

## Validation

- `npm run build`: passed.
- `node scripts/validate-portfolio-image-data.mjs --project-root .`: 0 errors, 1 known warning.

The warning is the pre-existing active/placed gallery wall slot with no assigned artwork.


# Changelog Append — 2026-05-13 — Phase 2D Homepage Below-Hero Simplification

## Summary

Simplified the homepage below-hero structure after visual review.

The homepage previously showed both a large intro/CTA block and the three archive/status boxes below the hero slideshow. The chosen direction is to keep only the three boxes so the page flow is simpler and less redundant.

## Files changed

- `src/app/sitePages.ts`
- `src/styles/global.css`
- `docs/PHASE2D_HOME_BELOW_HERO_SIMPLIFICATION.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PUBLIC_SITE_POLISH_AUDIT.md`

## Details

- Removed the `modern-home-copy` section from the homepage render output.
- Removed the duplicated below-hero CTA row that lived inside that section.
- Removed now-unused `.modern-home-copy` CSS.
- Removed now-unused `.home-copy-actions` CSS.
- Preserved the homepage hero slideshow and hero CTAs.
- Preserved the three balanced archive/status boxes.
- Preserved gallery open behavior.

## Validation

Run from the project root:

```powershell
npm run build
node scripts/validate-portfolio-image-data.mjs --project-root .
```

Expected result:

- Build passes.
- Image-data validation has 0 errors.
- The existing active/placed/unassigned gallery wall warning may remain until gallery curation is completed.


# Changelog Append — 2026-05-13 — Phase 2E Home Hero-Only Simplification

## Summary

Removed the remaining homepage UI section below the hero slideshow so the homepage temporarily resolves as a clean hero-only landing surface.

## Changed

- Removed the `renderHomeArchiveNotes()` helper from `src/app/sitePages.ts`.
- Removed the below-hero archive/status section from `renderHomePage()`.
- Removed `.home-archive-notes` layout, hover, and responsive CSS from `src/styles/global.css`.
- Updated current roadmap and public-site audit docs.

## Preserved

- Homepage hero slideshow and hero CTAs.
- Top navigation.
- Entry page.
- Portfolio route and portfolio page metadata strip.
- About route.
- Image lightbox.
- Editor code.
- Image data.
- Gallery curation data.
- Gallery room data.
- Virtual gallery behavior.

## Validation

- `npm run build` passed.


# Changelog Append - Public Site Review Polish and Editor Cleanup

## Added

- Added a homepage archive-notes strip that frames the site as a photography archive, virtual gallery room, and evolving creative system.
- Added a portfolio metadata strip with visible image count, total image count, category count, and a direct virtual-gallery action.
- Added baseline SEO metadata updates and a JSON-LD `Person` schema.
- Added documentation for public-site review/polish and SEO planning.
- Added documentation for the gallery editor map/card separation.

## Changed

- Removed the visible map-placement section from individual gallery wall cards while preserving hidden placement fields for save/runtime behavior.
- Tightened gallery editor map spacing so the map section does not create unnecessary blank space below itself.
- Updated gallery editor copy so map placement is clearly controlled from the floor map rather than the cards.
- Added async decoding to hero images.

## Notes

- This update does not change the 3D gallery runtime room geometry, movement, collision, lighting, fog, plaques, or image data.
- SEO is only a baseline pass. A full SEO strategy should wait until the final public URL and content hierarchy are settled.


# Changelog append — 2026-05-13 — Room model baseline and site roadmap

## Added

- Added `src/data/galleryRoom.json` as the first data-backed virtual gallery room footprint/settings file.
- Added `src/data/galleryRoom.ts` to normalize room data for the public Three.js gallery runtime.
- Added `docs/GALLERY_ROOM_AND_EDITOR_MODEL_BASELINE.md` to capture the current wall/entity/map/room mental model.
- Added `docs/GALLERY_ROOM_FOOTPRINT_SETTINGS.md` to document the new room footprint settings file and future room-shape path.
- Added `docs/SITE_OVERALL_REVIEW_AND_NEXT_STEPS.md` to summarize the public site, editor, 3D gallery, weak spots, and recommended next work.

## Changed

- Updated `src/gallery/environment/galleryBlueprint.ts` so the current square room defaults now come from `galleryRoom.json` instead of being fully hardcoded in the blueprint.
- Updated the local editor backend so `/api/data` returns normalized `galleryRoom` settings.
- Updated editor backups so `galleryRoom.json` is included when present.
- Updated backup restore handling so backed-up `galleryRoom.json` is restored when available.
- Updated `scripts/validate-portfolio-image-data.mjs` to read and validate `galleryRoom.json`, report the active room, and use the room grid settings for gallery curation placement bounds.

## Notes

- This pack does not redesign the 3D room.
- The current rectangular/square gallery remains the default.
- `l-shaped` and `custom-footprint` are reserved shape labels for future room model work; they do not yet create non-rectangular geometry by themselves.


---

## Appended changelog fragments - 20260514-114814


## 2026-05-13 — Phase 2F global public UI polish

- Tightened the shared public header and navigation treatment.
- Added `aria-current="page"` to active Home, Portfolio, and About route links.
- Added a dedicated class and accessible label to the Gallery overlay trigger in the top navigation.
- Replaced the prior dot-like nav marker with a thin line treatment.
- Improved mobile header stacking and nav tap-target consistency.
- Preserved the normal typography for the `Taylor Pike` wordmark and kept the VCR/pixel font scoped to minor numeric accents.
- Updated Phase 2 roadmap and audit documentation.

Validation:

- `npm run build` passed.


## 2026-05-13 — Phase 2G Home Viewport and Portfolio Header Cleanup

- Removed remaining bottom padding from the current hero-only homepage route.
- Added desktop viewport-fit overrides so the homepage should not require scrolling on common 1920x1080 desktop screens while it contains only the hero system.
- Slightly tightened desktop hero stage and thumbnail-strip sizing to keep the hero system inside the available viewport.
- Removed the portfolio/index `Open gallery room` button from the page meta strip.
- Removed the portfolio/index red accent underline below the heading.
- Left the global Gallery navigation button and homepage hero CTA as the primary gallery entry points.
- Preserved public copy, About copy, editor files, image data, gallery data, and 3D gallery behavior.
- Ran `npm run build` successfully.


## 2026-05-13 — Phase 2H public responsive baseline

- Tightened the shared public header/main shell width on tablet and phone.
- Improved mobile home hero sizing for the current hero-only homepage.
- Changed the phone hero thumbnail strip to a horizontal scroller so it does not consume unnecessary vertical space.
- Added touch-scroll refinements for hero and portfolio horizontal rails.
- Kept the portfolio meta strip as the three simple counter boxes.
- Added contact-link wrapping safeguards for narrow screens.
- Brought mobile lightbox previous/next controls inside the viewport.
- Reduced hover/lift behavior on coarse pointer devices.

Validation:

- `npm run build` passed.



## 2026-05-13 — Phase 2I mobile public refinement

### Changed

- Tightened mobile spacing between the shared nav and public page content, especially on home and portfolio.
- Hid the homepage `Enter Virtual Gallery` CTA on mobile.
- Hid the homepage hero statement/body copy on mobile so the phone hero keeps only `Selected Work` and `View Portfolio`.
- Corrected mobile visual-index spacing and removed pseudo markers that could read as misplaced periods beside neighboring numbers.
- Compacted mobile hero metadata into two columns where screen width allows, with a one-column fallback for very narrow screens.
- Reduced scroll-snap/transition friction on mobile hero and category rails so horizontal movement feels less sticky.
- Added session-storage-backed scroll-position memory for the mobile portfolio category rail across category route changes.

### Unchanged

- No final website copy changed.
- No About page copy changed.
- No editor files changed.
- No image data changed.
- No gallery curation or room data changed.
- No 3D gallery mechanics or mobile gallery controls changed.



## 2026-05-14 — Phase 2J mobile hero performance

- Added mobile-specific homepage hero image delivery through a `picture` element using the existing thumb rendition at small viewport widths.
- Marked the first hero image eager/high-priority and emitted width/height attributes from image metadata when available.
- Changed runtime hero preloading so startup no longer eagerly queues every hero image immediately; active/adjacent slides are prioritized and the rest are deferred.
- Reduced mobile hero paint work by disabling nonessential guide overlays, lowering the mobile hero shadow cost, and removing the mobile hero image filter.
- Preserved homepage layout, public copy, editor files, image data, gallery room data, curation data, and virtual-gallery mechanics.


## 2026-05-14 — Phase 2K public accessibility and interaction polish

- Added a keyboard-visible skip link before the shared public header.
- Added `id="main-content"` and `tabindex="-1"` to public main content regions.
- Improved portfolio lightbox focus behavior by returning focus to the opener after close.
- Added a focus trap inside the image lightbox while it is open.
- Added horizontal swipe support for next/previous image navigation in the lightbox on touch devices.
- Added CSS support for skip-link behavior, lightbox overscroll containment, and mobile lightbox touch handling.
- Preserved public copy, editor files, image data, gallery data, and virtual-gallery mechanics.


---

## Appended changelog fragments - 20260514-122721


# Project Changelog Append — 2026-05-14 — Phase 2 Public Polish Closeout

## Summary

Closed Phase 2 public polish after confirming the public-polish commit was pushed to both `dev` and `main`.

## Documentation added

- Added `docs/PHASE2_PUBLIC_POLISH_CLOSEOUT.md`.
- Added `docs/CURRENT_PROJECT_HANDOFF_PHASE2_CLOSEOUT.md`.
- Updated `docs/PROJECT_ROADMAP_CURRENT.md` to mark Phase 2 complete and Phase 3 as next.
- Updated `docs/PUBLIC_SITE_POLISH_AUDIT.md` with the Phase 2 closeout note.

## Current checkpoint

The user confirmed both remote branches show the same top commit:

```text
origin/dev  -> cf7886c Polish public portfolio experience
origin/main -> cf7886c Polish public portfolio experience
```

## Notes

This is a documentation-only closeout pack. It does not change runtime code, editor code, image data, gallery room data, curation data, or public copy.


---

## Appended changelog fragments - 20260514-123223


# Changelog append — 2026-05-14 — Phase 3A content curation start

## Added

- Added `docs/PHASE3_CONTENT_METADATA_CURATION_START.md` to define the purpose, scope, workflow, and completion criteria for Phase 3.
- Added `docs/PORTFOLIO_IMAGE_METADATA_CHECKLIST.md` for image-by-image metadata review.
- Added `docs/EDITOR_CURATION_WORKFLOW.md` for practical local-editor curation sessions, validation, and commit guidance.
- Added `docs/CURRENT_PROJECT_HANDOFF_PHASE3_START.md` to help future chats or human reviewers understand the current project state.
- Updated `docs/PROJECT_ROADMAP_CURRENT.md` to mark Phase 3 as active after Phase 2 public polish.

## Notes

- This is a documentation-only pack.
- No public copy was generated or changed.
- No source code changed.
- No editor code changed.
- No image data changed.
- No gallery data changed.


---

## Appended changelog fragments - 20260515-143115


## 2026-05-15 — Modernize chat upload workflow and Phase 3 handoff

- Replaced the chat upload PowerShell script with a version that understands the current rendition-based image structure.
- Added runtime image modes: `none`, `thumb`, `display`, and `all`.
- Defaulted the upload script to thumbnail runtime assets so normal chat handoffs stay within upload size limits.
- Added docs and `PROJECT_CHANGELOG.md` to the upload package source set.
- Removed stale upload assumptions around `public/images/logo`, `card-optimized`, `gallery-optimized`, and legacy thumbnails folders.
- Added handoff documentation for the current Phase 3 active state.
- Added documentation for the current upload workflow and upload-size tradeoffs.
- Updated the current roadmap to reflect Phase 2 completion, Phase 3 content curation, later alt text, later About/contact redesign, mobile 3D controls, SEO, and future gallery expansion.


---

## Appended changelog fragments - 20260515-153251


# Changelog Append — 2026-05-15 — Alt Text and Handoff Review

## Added

- Added `docs/alt-text/portfolio-image-alt-text-20260515.json` with staged alt text for the current 67 referenced portfolio images.
- Added `scripts/Apply-PortfolioImageAltTextOnly.mjs`, a targeted script that updates only existing `alt` string lines in `src/data/galleryImages.json`.
- Added `docs/HANDOFF_DOCS_REVIEW_20260515.md`.

## Updated

- Updated `docs/CURRENT_PROJECT_HANDOFF.md`.
- Updated `docs/CURRENT_PROJECT_HANDOFF_PHASE3_ACTIVE.md`.
- Updated `docs/PROJECT_ROADMAP_CURRENT.md`.

## Notes

- The alt text was generated from thumbnail review and should be reviewed before final launch if more precise descriptions are desired.
- The alt update script intentionally avoids reserializing `galleryImages.json` so non-alt data and formatting remain untouched.
- The reviewed upload included 74 thumbnails: 67 referenced by current image data and 7 unreferenced legacy/test thumbnails.


# Changelog fragment — Correct new chat transfer structure

Date: 2026-05-15

## Summary

Reissued the new-chat transfer/handoff pack using the existing project folder structure.

## Details

- Removed the nested `docs/new-chat-transfer/` convention from the transfer pack.
- Placed transfer files directly under `docs/`, matching the current project documentation structure.
- Updated `CURRENT_PROJECT_HANDOFF.md`, `CURRENT_PROJECT_HANDOFF_PHASE3_ACTIVE.md`, `PROJECT_ROADMAP_CURRENT.md`, and `CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md` with the latest project state.
- Added root-level next-chat starter and authentication checklist documents under `docs/`.
- Reconfirmed that there is no active `public/images/logo/` folder.
- Reconfirmed Phase 3 as the active project phase after Phase 2 public polish and alt text commit.

## Files

```text
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE3_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/NEXT_CHAT_STARTER_PROMPT.md
docs/NEXT_CHAT_AUTHENTICATION_CHECKLIST.md
```



---

## Changelog fragment — Phase 3 closeout and Phase 4 editor start

Date: 2026-05-15

## Summary

Marked Phase 3 as complete by user decision and moved the project handoff/roadmap into Phase 4 editor curation controls and workflow fixes.

## Details

- Updated the current handoff to show Phase 4 as the active phase.
- Marked Phase 3 content/metadata curation as closed, while documenting that final image reduction can happen later because the site is not near public launch.
- Added `CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md` for the active editor-focused phase.
- Retained `CURRENT_PROJECT_HANDOFF_PHASE3_ACTIVE.md` as a superseded historical handoff with a clear pointer to the Phase 4 handoff.
- Added Phase 3 closeout documentation.
- Added Phase 4 editor-start documentation.
- Updated the roadmap so Phase 4 is active.
- Updated the transfer workflow and next-chat starter prompt to reference Phase 4 instead of Phase 3.
- Expanded Phase 8 to explicitly include texture, material, and lighting work for the 3D gallery.

## Files

```text
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE3_ACTIVE.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/NEXT_CHAT_STARTER_PROMPT.md
docs/PHASE3_CONTENT_METADATA_CURATION_CLOSEOUT.md
docs/PHASE4_EDITOR_FIXES_START.md
PROJECT_CHANGELOG.md
```

## Notes

- Documentation-only update.
- No public site code changed.
- No editor code changed.
- No image data changed.
- No runtime image files changed.


---

## Changelog fragment � Phase 4A editor rename metadata refresh fix

Date: 2026-05-15

## Summary

Fixed the local editor image ID rename workflow so visible title/metadata edits are preserved when the editor reloads authoritative data after renaming an image ID and its rendition files.

## Details

- Updated the browser rename request to send a whitelisted snapshot of the currently visible image metadata.
- Updated the Flask rename route to pass that metadata snapshot into the backend rename workflow.
- Updated the backend rename workflow to merge only safe non-path metadata fields before normalizing and writing the renamed image record.
- Kept `id`, rendition URL fields, image dimensions, and orientation backend-owned during rename so stale browser state cannot overwrite canonical paths or identity data.
- Preserved the existing authoritative reload behavior after rename so the visible editor state still comes from saved project JSON.
- Added Phase 4A documentation and updated active handoff/roadmap docs.

## Files

```text
local-editor/app/data_store.py
local-editor/app/routes.py
local-editor/static/js/api.js
local-editor/static/js/main.js
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4A_EDITOR_RENAME_METADATA_REFRESH_FIX.md
PROJECT_CHANGELOG.md
```

## Validation

```text
python3 -m py_compile local-editor/app/data_store.py local-editor/app/routes.py
node --check local-editor/static/js/api.js
node --check local-editor/static/js/main.js
npm ci --ignore-scripts
npm run build
```

A direct backend rename simulation was run in a disposable project copy with temporary rendition files and confirmed that submitted metadata survives the rename while all four rendition files move to the new ID.

`node scripts/validate-portfolio-image-data.mjs` was attempted but could not pass inside the thumbnail-mode chat upload because the runtime `public/images/portfolio/{display,thumb,texture,full}` files are absent from the sandbox copy. The reported errors were missing rendition files, not data-shape or code errors.

## Notes

- This pack does not add hide/show, bulk edits, import-review improvements, or category creation from dropdowns.
- Next recommended Phase 4 pack: public hide/show visibility model and single-image editor controls.


---

## Changelog fragment — Phase 4A v2 editor rename authoritative response fix

Date: 2026-05-15

## Summary

Replaced the first Phase 4A rename fix with a more robust version that keeps the editor UI and saved JSON aligned after renaming an image ID and its rendition files.

## Details

- Kept the whitelisted visible-metadata snapshot for rename requests.
- Changed the frontend rename flow to render from the successful rename response instead of doing an immediate post-rename `/api/data` reload.
- Added cache-busting and `cache: "no-store"` to normal `/api/data` loads.
- Bumped the local editor template asset query from `v=44` to `v=45` so the corrected module is easier to force-load in the browser.
- Updated the backend rename workflow to merge safe metadata before normalization while keeping ID, rendition paths, dimensions, and orientation backend-owned.
- Updated active Phase 4 docs to mark the rename fix as corrected in Phase 4A v2.

## Files

```text
local-editor/app/data_store.py
local-editor/app/routes.py
local-editor/static/js/api.js
local-editor/static/js/main.js
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/PHASE4A_EDITOR_RENAME_METADATA_REFRESH_FIX.md
PROJECT_CHANGELOG.md
```

## Validation

```text
python3 -m py_compile local-editor/app/data_store.py local-editor/app/routes.py
node --check local-editor/static/js/api.js
node --check local-editor/static/js/main.js
npm ci --ignore-scripts
npm run build
node scripts/validate-portfolio-image-data.mjs
```

Additional tested behavior:

- Direct backend rename simulation in a disposable project copy confirmed submitted metadata persists, all four rendition paths update, all four rendition files move, and a hero slide reference moves to the new ID.
- Headless Chromium DOM simulation confirmed the current title and other visible metadata are collected from the editor card and the visible ID fields can align to the new ID.

## Notes

- This pack is still limited to the rename workflow.
- Hide/show visibility controls remain the next recommended Phase 4 pack.
---

## 2026-05-15 — Phase 4B bulk editor visibility and curation controls

### Changed
- Added optional image visibility support using `isPublic: false` so images can be hidden from the public site without removing records or deleting rendition files.
- Updated public image exports so `galleryImages` is public-filtered and `allGalleryImages` remains available for editor/internal complete-record workflows.
- Added a single-image **Show on public website** checkbox in the Flask local editor.
- Added bulk editor controls on the all-images and per-category image pages: select visible, clear selection, selected count, bulk show/hide, bulk category reassignment, and bulk hero add/remove.
- Limited bulk hero add to public landscape images and automatically removed hidden images from hero slide output during save normalization.
- Added Public/Hidden/Hero status badges to editor overview cards.

### Files changed
- `src/data/images.ts`
- `src/app/editor/imageEditorPage.ts`
- `local-editor/app/data_store.py`
- `local-editor/static/js/collect.js`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/static/editor.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4B_BULK_EDITOR_VISIBILITY_CONTROLS.md`
- `PROJECT_CHANGELOG.md`

### Validation
- `python3 -m py_compile local-editor/app/data_store.py local-editor/app/routes.py`
- `node --check local-editor/static/js/api.js`
- `node --check local-editor/static/js/collect.js`
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- `npm ci --ignore-scripts`
- `npm run build`
- Backend visibility normalization and hero-filter logic test.
- Standalone bulk payload logic test.

### Notes
- `node scripts/validate-portfolio-image-data.mjs` still fails in the sandbox upload because the chat package does not include the full runtime rendition folders under `public/images/portfolio/{display,thumb,texture,full}`.
- Import review improvements remain future Phase 4 work.

---

## 2026-05-15 — Phase 4C editor bulk UX and readability polish

### Changed
- Reworked Phase 4B bulk editor styling to better match the light local editor UI.
- Replaced low-contrast `Public` / `Hidden` labels with larger `Visible on site` / `Hidden from site` status chips.
- Added a `Homepage hero` status chip and dot indicators for faster scanning.
- Added a hidden-state overlay on hidden thumbnails.
- Added a selected-card visual state for bulk-selected images.
- Disabled the bulk apply button until at least one image is selected and at least one bulk update is chosen.
- Improved single-image visibility wording so the user understands hidden images stay in the editor but are filtered out of public outputs.
- Bumped local editor asset query strings to `v=47`.

### Files changed
- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4C_EDITOR_BULK_UX_READABILITY_POLISH.md`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- `npm run build`
- Static markup check for the new status labels, disabled apply control, and cache-bumped editor assets.

### Notes
- No public-site behavior was changed in this pack.
- Phase 4B visibility filtering and bulk save behavior are intentionally preserved.

---

## 2026-05-15 — Phase 4E archive editor visual rehaul

### Changed
- Reworked the Flask local editor visual style around an archive-editor direction: warm paper surfaces, graphite controls, consistent cards, and cleaner status blocks.
- Fixed the import review card layout so the toolbar spans the full card and selected images render as compact thumbnails rather than oversized previews.
- Added a clickable import thumbnail preview with a full-size lightbox overlay.
- Added close behavior for the import preview lightbox via Close button, backdrop click, and Escape key.
- Removed the duplicate `Home hero eligibility` eyebrow from import review cards.
- Bumped local editor asset query strings to `v=49`.

### Files changed
- `local-editor/static/editor.css`
- `local-editor/static/js/dom.js`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4E_ARCHIVE_EDITOR_VISUAL_REHAUL.md`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/dom.js`
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- `npm run build`
- Static import-review render check confirmed the new thumbnail lightbox trigger markup and removed duplicate hero eligibility eyebrow.

### Notes
- No public-site behavior was changed in this pack.
- A full browser visual test could not complete in the sandbox because the execution environment blocked Chromium navigation.

---

## 2026-05-15 — Phase 4F editor import and gallery cleanup

### Changed
- Removed the editor button inset/bevel artifact that created a visible white rim inside pill buttons.
- Simplified import review cards so they no longer expose crop/framing controls during import.
- Kept default hidden import values for thumbnail, gallery, and hero framing so imported records remain valid.
- Added `galleryCurationStatus` diagnostics to editor API responses.
- Updated the gallery curation empty state so it no longer falsely claims `galleryCuration.json` is missing when the file exists.
- Bumped local editor asset query strings to `v=50`.

### Files changed
- `local-editor/app/data_store.py`
- `local-editor/app/routes.py`
- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4F_EDITOR_IMPORT_AND_GALLERY_CLEANUP.md`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/api.js`
- `node --check local-editor/static/js/dom.js`
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- `python3 -m py_compile local-editor/app/data_store.py local-editor/app/routes.py local-editor/app/image_importer.py`
- `npm run build`
- Static render test confirmed import review no longer renders crop/framing controls while preserving hidden default fields and the import lightbox trigger.
- Data-store diagnostic test confirmed the current source reports `galleryCuration.json` as existing with 17 loaded rows.

### Notes
- No public-site behavior was changed in this pack.
- A true browser screenshot test could not run in the sandbox because Playwright browsers are not installed in this environment.

---

## 2026-05-15 — Phase 4G gallery editor UX professionalization

### Changed
- Reworked the Gallery editor page around an archive-room control-surface direction.
- Added a clearer gallery summary header and a top-level `Save All Gallery Curation` action.
- Improved gallery stats for wall-card count, map placement, artwork assignment, and visible/hidden status.
- Reorganized Gallery filters into a clearer Wall Finder panel.
- Reworked gallery wall cards with clearer blueprint identity, status chips, artwork assignment controls, room behavior controls, map-position readouts, and grouped actions.
- Moved the precise artwork-ID fallback select into an advanced details block while preserving the existing save/picker logic.
- Restyled the gallery artwork picker, preview lightbox, add-wall overlay, placement sidebar, and map controls to match the archive-editor design system.
- Bumped local editor asset query strings to `v=51`.

### Files changed
- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4G_GALLERY_EDITOR_UX_PROFESSIONALIZATION.md`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- `npm run build`
- Static Gallery render test confirmed 17 wall cards render and required data selectors for save, filters, artwork assignment, preview, add-wall, wall type, visibility, plaque, and placement behavior are still present.

### Notes
- No public-site behavior was changed in this pack.
- No Three.js gallery runtime, wall-placement math, collision logic, plaque fallback logic, or gallery curation JSON schema was changed.

---

## 2026-05-15 — Phase 4G v2 Adobe-inspired Gallery editor correction

### Changed
- Corrected the Phase 4G Gallery editor visual treatment after user review.
- Removed the oversized saturated green checkbox appearance from Gallery boolean controls.
- Standardized local-editor checkboxes as compact neutral controls.
- Made Gallery status chips more restrained and less success-color-driven.
- Confirmed the editor uses system sans and standard system monospace only, not the VCR/pixel font.
- Documented future drag-and-drop ordering for category-specific Images views, excluding All images.
- Bumped local editor asset query strings to `v=52`.

### Files changed
- `local-editor/static/editor.css`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4G_V2_ADOBE_INSPIRED_GALLERY_EDITOR_CORRECTION.md`
- `PROJECT_CHANGELOG.md`

### Validation
- `npm run build`
- Static checks confirmed compact checkbox CSS, neutral Gallery plaque controls, no editor VCR/pixel font reference, and editor asset version `v=52`.

### Notes
- No public-site behavior was changed.
- No Three.js gallery runtime, wall-placement math, collision logic, plaque fallback logic, or gallery curation JSON schema was changed.
- Drag-and-drop category ordering was documented as backlog only; it was not implemented in this pack.

## 2026-05-15 — Phase 4G v3 Adobe archive editor CSS overhaul

- Reworked the local editor visual system with a CSS-forward Adobe/archive-editor direction.
- Shifted the editor from warm webpage-like surfaces to a neutral gray professional workspace.
- Converted the header into a compact command area and navigation into software-style tabs.
- Restyled buttons, fields, panels, status chips, image overview cards, import review cards, Gallery wall cards, overlays, and utility panels with a more compact production-tool treatment.
- Kept the editor technical behavior unchanged: no JavaScript behavior, data schema, public-site styling, Three.js runtime, gallery map placement, collision logic, plaque fallback, import behavior, or bulk/hide-show behavior was changed.
- Confirmed the editor still avoids the VCR/pixel font; technical readouts use only a normal system monospace stack.
- Bumped the local editor asset version to `v=53`.


---

## 2026-05-15 — Phase 4G v4 editor visual correction and dark mode

### Changed
- Corrected the Phase 4G v3 CSS overhaul after user review.
- Fixed Wall Finder layout overlap by separating heading copy from the filter-control grid.
- Removed decorative trim/baseboard/floor/label elements from gallery wall-preview thumbnails.
- Replaced the large `Select Image` overlay with a compact top-left selection square.
- Softened editor buttons away from the rigid rectangle treatment while keeping them compact and professional.
- Added a local light/dark editor theme toggle in the command header.
- Added dark-mode CSS variables and contrast overrides for panels, forms, cards, overlays, gallery previews, and map surfaces.
- Bumped local editor asset query strings to `v=54`.

### Files changed
- `local-editor/static/editor.css`
- `local-editor/static/js/dom.js`
- `local-editor/static/js/main.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4G_V4_EDITOR_VISUAL_CORRECTION_DARK_MODE.md`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/dom.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance check
- `npm ci --ignore-scripts`
- `npm run build`

### Notes
- No public-site behavior or styling was changed.
- No Three.js runtime, gallery schema, wall-placement math, collision logic, plaque fallback, import behavior, bulk behavior, or save behavior was changed.
- The only new JavaScript behavior is the local editor theme toggle, stored in browser `localStorage`.

---

## 2026-05-15 — Phase 4G v5 dark-mode contrast and selector correction

### Changed
- Corrected the Phase 4G v4 dark-mode pass after user review.
- Increased dark-mode contrast across editor workspace, panels, navigation, category tabs, cards, controls, labels, status areas, badges, and gallery preview surfaces.
- Reworked the bulk image selector so it appears as one coherent selectable square instead of a custom square with a nested native checkbox shape.
- Preserved the existing technical behavior and accessible checkbox input.
- Kept gallery wall-preview trim/baseboard/floor elements hidden.
- Bumped local editor asset query strings to `v=55`.

### Files changed
- `local-editor/static/editor.css`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4G_V5_DARK_MODE_CONTRAST_AND_SELECTOR_FIX.md`
- `PROJECT_CHANGELOG.md`

### Validation
- CSS brace-balance check
- `npm run build`
- `unzip -t`

### Notes
- No public-site styling or behavior was changed.
- No editor JavaScript behavior was changed.
- No image/gallery/category data or gallery runtime logic was changed.

## 2026-05-15 — Phase 4G v6 gallery curation stabilization

- Built a narrow stabilization pack after the Gallery curation page regressed during the Phase 4G visual editor passes.
- Preserved `galleryRoom` in frontend editor state when backend responses include it.
- Re-shipped the full set of local editor files involved in Gallery curation rendering, collection, API calls, Flask route data, and cache loading to avoid stale mixed-file states.
- Bumped local editor cache query strings to `v=56`.
- Did not change public-site behavior, Three.js runtime behavior, gallery placement math, collision logic, plaque fallback logic, or the gallery curation schema.



---

## 2026-05-15 — Phase 4H-I-J combined editor functionality pack

### Changed
- Added drag-and-drop image ordering on category-specific Images pages while keeping the All images view non-draggable.
- Kept existing Top / Up / Down category-order buttons and Save Category Order behavior.
- Added a header saved/unsaved indicator and clearer dirty-state tracking.
- Added confirmation before route changes, Reload Data, or Clear Import Review discards unsaved/pending editor work.
- Hardened import validation so duplicate import IDs, existing image IDs, invalid ID formatting, unsupported extensions, and existing rendition-file collisions are rejected before backend writes begin.
- Added duplicate-filename warnings to the import review.
- Added backend cleanup for newly created import files if optimization or JSON validation fails mid-import.
- Bumped local editor asset query strings to `v=57`.

### Files changed
- `local-editor/app/image_importer.py`
- `local-editor/static/editor.css`
- `local-editor/static/js/api.js`
- `local-editor/static/js/collect.js`
- `local-editor/static/js/dom.js`
- `local-editor/static/js/importValidation.js`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4H_I_J_EDITOR_FUNCTIONALITY_PACK.md`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- `node --check local-editor/static/js/collect.js`
- `node --check local-editor/static/js/api.js`
- `node --check local-editor/static/js/importValidation.js`
- `python3 -m py_compile local-editor/app/image_importer.py local-editor/app/data_store.py local-editor/app/routes.py`
- CSS brace-balance check
- `npm run build`

### Notes
- No public-site code or styling was changed.
- No Three.js runtime, gallery curation schema, wall placement, collision, or plaque fallback behavior was changed.
- This pack does not implement true backend-streamed per-file import progress.

## 2026-05-16 — Phase 4H-I-J v2 category drag smoothing

### Changed
- Replaced the handle-only category image drag interaction with direct card dragging on category-specific Images pages.
- Removed the visible drag-handle button from reorder cards.
- Kept buttons, checkboxes, selects, labels, and explicit no-drag regions interactive so they do not start a card drag.
- Replaced the native HTML5 drag/drop category reordering path with pointer-event handling and a row-aware grid insertion calculation.
- Updated category-order helper copy to describe card dragging instead of handle dragging.
- Bumped local editor asset query strings to `v=58`.

### Files changed
- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4H_I_J_V2_CATEGORY_DRAG_SMOOTHING.md`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance check
- `npm ci --ignore-scripts`
- `npm run build`
- `unzip -t`

### Notes
- No public-site code or styling was changed.
- No data schema, import behavior, dirty-state behavior, gallery curation behavior, Three.js runtime behavior, wall placement, collision, or plaque fallback behavior was changed.



---

## 2026-05-16 — Phase 4H-I-J v4 category drag interaction refinement

### Changed
- Refined category-specific image drag ordering so the drag can start from the photo preview without triggering native browser image dragging.
- Added a short hold threshold before custom drag activation so quick photo-preview clicks still open the individual image editor page.
- Kept the lifted ghost-card preview and neutral placeholder behavior from v3.
- Changed placeholder placement to calculate against real category cards only, preventing the extra empty side cell/offset behavior from the previous dynamic drag pass.
- Matched placeholder height more closely to the lifted card.
- Bumped local editor asset query strings to `v=60`.

### Files changed
- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4H_I_J_V4_CATEGORY_DRAG_INTERACTION_REFINEMENT.md`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance check
- `npm run build`
- `unzip -t`

### Notes
- No public-site code or styling was changed.
- No image data schema, import behavior, bulk editor behavior, gallery curation behavior, Three.js runtime behavior, wall placement, collision, or plaque fallback behavior was changed.

---

## 2026-05-16 — Phase 4H-I-J v5 category drag placeholder correction

### Changed
- Corrected the remaining category drag placeholder offset issue by removing the placeholder before measuring CSS Grid card positions, then reinserting it after calculating the intended insertion point.
- Kept placeholder placement based on real category cards only, preventing the visual extra blank card one position left or right of the intended drop location.
- Delayed pointer capture until the custom drag actually activates, making short-click image preview navigation more reliable.
- Kept the mouse cursor normal during hover and short-click states; the grabbing cursor now appears only while the drag is active.
- Added window-level pointerup/pointercancel cleanup for armed drag states.
- Updated the category ordering help text to describe short-click versus press-and-hold behavior.
- Bumped local editor asset query strings to `v=61`.

### Files changed
- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4H_I_J_V5_CATEGORY_DRAG_PLACEHOLDER_CORRECTION.md`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance check
- `npm run build`
- `unzip -t`

### Notes
- No public-site code or styling was changed.
- No image data schema, import behavior, bulk editor behavior, gallery curation behavior, Three.js runtime behavior, wall placement, collision, or plaque fallback behavior was changed.
---

## 2026-05-16 — Phase 4H-I-J v6 category drag single-placeholder fix

### Changed
- Reworked category-specific image drag ordering so the source card itself becomes the single grid placeholder during active drag.
- Kept the floating ghost-card preview, but removed the separate placeholder-node model that could create an extra adjacent blank cell in CSS Grid.
- Added window-level pointermove handling so live placeholder movement continues even when the pointer leaves the editor list area.
- Kept the mouse cursor normal until drag activation.
- Bumped local editor asset query strings to `v=62`.
- Moved this pack's notes and manifest into `docs/` instead of the project root, and added a PowerShell helper to move older root-level pack docs into docs folders.

### Files changed
- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4H_I_J_V6_CATEGORY_DRAG_SINGLE_PLACEHOLDER_FIX.md`
- `docs/PACK_NOTES_PHASE4H_I_J_V6.md`
- `docs/PACK_MANIFEST_PHASE4H_I_J_V6.txt`
- `scripts/Move-PackDocsIntoDocs.ps1`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance check
- `npm run build`
- `unzip -t`

### Notes
- No public-site code or styling was changed.
- No image data schema, import behavior, bulk editor behavior, gallery curation behavior, Three.js runtime behavior, wall placement, collision, or plaque fallback behavior was changed.


---

## 2026-05-16 — Phase 4H-I-J v7 category drag pacing refinement

### Changed
- Refined category-specific image drag ordering after v6 fixed the single-placeholder behavior.
- Added direction-aware insertion buffering so moving a dragged card to the right of another card feels less abrupt and closer to the leftward pacing.
- Kept the source card as the single live placeholder and preserved the floating ghost-card preview.
- Kept pointer movement through card gaps from immediately advancing the placeholder.
- Bumped local editor asset query strings to `v=63`.

### Files changed
- `local-editor/static/js/main.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4H_I_J_V7_CATEGORY_DRAG_PACING.md`
- `docs/PACK_NOTES_PHASE4H_I_J_V7.md`
- `docs/PACK_MANIFEST_PHASE4H_I_J_V7.txt`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- CSS brace-balance check
- `npm run build`
- `unzip -t`

### Notes
- No public-site code or styling was changed.
- No image data schema, import behavior, gallery curation behavior, Three.js runtime behavior, wall placement, collision, or plaque fallback behavior was changed.

---

## 2026-05-16 — Phase 4H-I-J v8 category drag left-threshold tuning

### Changed
- Refined category-specific image drag ordering after v7 pacing testing.
- Reduced the sensitivity for moving the placeholder to the left side of a neighboring card by requiring the pointer to move farther into the card's left side before the placeholder crosses.
- Preserved the v6 single-placeholder model, v7 rightward pacing buffer, floating ghost preview, short-click image navigation, and non-draggable All Images view.
- Bumped local editor asset query strings to `v=64`.

### Files changed
- `local-editor/static/js/main.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4H_I_J_V8_CATEGORY_DRAG_LEFT_THRESHOLD.md`
- `docs/PACK_NOTES_PHASE4H_I_J_V8.md`
- `docs/PACK_MANIFEST_PHASE4H_I_J_V8.txt`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- CSS brace-balance check
- `npm run build`
- `unzip -t`

### Notes
- No public-site code or styling was changed.
- No image data schema, import behavior, gallery curation behavior, Three.js runtime behavior, wall placement, collision, or plaque fallback behavior was changed.
---

## 2026-05-16 — Phase 4H-I-J v9 category drag symmetric threshold tuning

### Changed
- Tuned category-specific image drag ordering after v8 testing showed that right-side placement still felt more sensitive than left-side placement.
- Moved category drag before/after thresholds closer to the target card midpoint so the placeholder does not settle to the right side of a card after only a small overlap.
- Preserved the v6 single-placeholder model, floating ghost preview, press/hold drag activation, short-click image navigation, non-draggable All Images view, and existing save behavior.
- Bumped local editor asset query strings to `v=65`.

### Files changed
- `local-editor/static/js/main.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE4H_I_J_V9_CATEGORY_DRAG_SYMMETRIC_THRESHOLD.md`
- `docs/PACK_NOTES_PHASE4H_I_J_V9.md`
- `docs/PACK_MANIFEST_PHASE4H_I_J_V9.txt`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `npm run build`
- `unzip -t`

### Notes
- No public-site code or styling was changed.
- No image data schema, import behavior, gallery curation behavior, Three.js runtime behavior, wall placement, collision, or plaque fallback behavior was changed.


---

## 2026-05-16 — Phase 4K non-gallery editor closeout

### Changed
- Added a non-gallery editor closeout pass after the Phase 4H-I-J v9 category drag threshold was accepted.
- Added a Categories page summary strip for category count, total images, visible images, hidden images, and hero slide count.
- Added per-category usage chips for total, visible, hidden, and hero target counts.
- Added explicit category reassignment targets for category removal.
- Blocked removal of the final remaining category.
- Added duplicate category ID preflight before saving category settings.
- Updated the Add Category flow so newly added category IDs are unique.
- Improved Backups page restore clarity with a safety toolbar and restore readiness labels.
- Added unsaved-change protection before backup restore.
- Moved pack notes and manifests into `docs/pack-notes/` and `docs/pack-manifests/` inside the working tree.
- Bumped local editor asset query strings to `v=66`.

### Files changed
- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/NEXT_CHAT_STARTER_PROMPT.md`
- `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md`
- `docs/PHASE4K_NON_GALLERY_EDITOR_CLOSEOUT.md`
- `docs/pack-notes/PACK_NOTES_PHASE4K.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE4K.txt`
- `scripts/Move-PackDocsIntoDocs.ps1`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance check
- `npm run build`
- `unzip -t`

### Notes
- No gallery curation behavior, public-site behavior, Three.js runtime behavior, wall placement, collision, plaque fallback, or import writing behavior was changed.

## 2026-05-16 — Phase 5A About/contact separate image pipeline

- Started Phase 5 About/contact redesign.
- Added `src/data/aboutPhotos.json` and `src/data/aboutPhotos.ts`.
- Reworked the public About page into an editorial placeholder structure with cascading About images.
- Seeded temporary About images from current portfolio portrait/editorial records.
- Added a local editor About tab for About photo import, ordering, active/inactive state, and metadata edits.
- Added separate About-native import output folders under `public/images/about/{display,thumb,full}` and source storage under `source-images/about-editor-imports/`.
- Added backend `/api/about-photos/import` and About photo save/load/backup support.
- Kept final About copy as placeholder text because the user wants to write final public copy.

## 2026-05-16 — Phase 5B About vertical layout and portfolio-reference action

### Changed
- Reworked the public About/contact page into a taller editorial layout based on the user mockup.
- Added a top copy block beside an overlapping About photo cluster, a full-width copy band, and a lower split photo/copy section.
- Added low-opacity floating About photos and subtle scroll-linked movement for the About page.
- Added an **Add to About** action panel on normal portfolio image edit pages in the local editor.
- The action creates a `sourceType: "portfolio-reference"` About photo record that points at existing portfolio rendition paths.
- Kept native About imports separate under `public/images/about/`.
- Bumped local editor asset query strings to `v=68`.

### Files changed
- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `src/styles/global.css`
- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE5B_ABOUT_VERTICAL_LAYOUT_AND_PORTFOLIO_REFERENCE.md`
- `docs/pack-notes/PACK_NOTES_PHASE5B.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE5B.txt`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- `node --check local-editor/static/js/collect.js`
- `python3 -m py_compile local-editor/app/data_store.py local-editor/app/routes.py local-editor/app/about_importer.py`
- CSS brace-balance checks
- `npm run build`
- `unzip -t`

### Notes
- No gallery curation behavior, public portfolio behavior, Three.js runtime behavior, portfolio import writing behavior, wall placement, collision, or plaque fallback behavior was changed.
- Public About copy remains placeholder-only.


## 2026-05-16 — Phase 5C About three-layer collage controls

### Changed
- Refined the public About/contact page into a three-layer image model based on the user's updated mockup.
- Added About photo `placementRole` support for `upper-collage`, `lower-collage`, `background-float`, and `unused`.
- Updated the public About page so the upper collage renders only two foreground photos.
- Updated the lower About collage to use its own ordered photo group.
- Updated transparent background float photos to use a dedicated placement group and subtle scroll-linked horizontal/vertical drift.
- Added About placement controls to existing About photo cards in the local editor.
- Added default About placement and per-card placement controls to About import review.
- Made normal portfolio image **Add to About** records default to `lower-collage`.
- Added temporary portfolio-reference About photo records to populate the refined layout for visual testing.
- Bumped local editor asset query strings to `v=69`.

### Files changed
- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `src/data/aboutPhotos.json`
- `src/data/aboutPhotos.ts`
- `src/styles/global.css`
- `local-editor/app/about_importer.py`
- `local-editor/app/data_store.py`
- `local-editor/static/js/collect.js`
- `local-editor/static/js/dom.js`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE5C_ABOUT_THREE_LAYER_COLLAGE_CONTROLS.md`
- `docs/pack-notes/PACK_NOTES_PHASE5C.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE5C.txt`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- `node --check local-editor/static/js/collect.js`
- `node --check local-editor/static/js/dom.js`
- `python3 -m py_compile local-editor/app/data_store.py local-editor/app/about_importer.py`
- CSS brace-balance checks
- `npm run build`
- `unzip -t`

### Notes
- No gallery curation behavior, public portfolio behavior, Three.js runtime behavior, portfolio import writing behavior, wall placement, collision, or plaque fallback behavior was changed.
- Public About copy remains placeholder-only.

## Phase 5D — About collage and editor section refinement — 2026-05-16

### Summary
- Enlarged transparent About background-float images so they read as visible atmospheric page elements.
- Reworked the upper About collage into one large base photo with one smaller centered photo stacked on top.
- Removed foreground About collage hyperlinks so upper/lower About photos no longer open source image files in a new tab.
- Updated About photo rendering so inactive records are excluded from public foreground/background About image sets.
- Broke the About editor photo list into clear sections for Upper collage, Lower collage, Background floats, and Unused / staged records.
- Updated About photo Top/Up/Down controls to move within the current section.
- Bumped local editor cache strings to `v=70`.

### Files changed
- `src/app/sitePages.ts`
- `src/styles/global.css`
- `local-editor/static/editor.css`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE5D_ABOUT_COLLAGE_AND_EDITOR_SECTION_REFINEMENT.md`
- `docs/pack-notes/PACK_NOTES_PHASE5D.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE5D.txt`
- `PROJECT_CHANGELOG.md`

### Validation
- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance checks
- `npm ci --ignore-scripts`
- `npm run build`
- `unzip -t`

### Notes
- No gallery curation behavior, public portfolio behavior, Three.js runtime behavior, portfolio import writing behavior, wall placement, collision, or plaque fallback behavior was changed.
- Final About copy remains placeholder-only.

## Phase 5E — About background-float positioning refinement — 2026-05-16

### Summary
- Repositioned the public About/contact page background-float images so most of them intentionally spill 20-30% past the browser viewport edge.
- Kept one background float slightly off-center toward the middle of the page for atmospheric depth.
- Preserved the Phase 5D foreground upper/lower collage behavior.
- Preserved About editor controls and About image data schema.

### Files changed
- `src/styles/global.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE5E_ABOUT_BACKGROUND_FLOAT_POSITIONING.md`
- `docs/pack-notes/PACK_NOTES_PHASE5E.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE5E.txt`
- `PROJECT_CHANGELOG.md`

### Validation
- CSS brace-balance check
- `npm run build`
- `unzip -t`

### Notes
- No editor behavior, About data model, gallery curation behavior, public portfolio behavior, Three.js runtime behavior, portfolio import behavior, wall placement, collision, or plaque fallback behavior was changed.

## Phase 5F — About background-float viewport breakout — 2026-05-16

### Summary
- Moved the public About/contact background-float layer outside the centered About `main` element so it can span the full browser/page shell width.
- Updated About scroll-motion targeting so background floats still drift after moving outside `.modern-about-page`.
- Added viewport-level CSS positioning for edge-spilling floats and preserved one middle/off-center float.
- Added horizontal overflow clipping at the About site shell to prevent sideways scrolling from oversized atmospheric images.

### Files changed
- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `src/styles/global.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE5F_ABOUT_FLOAT_VIEWPORT_BREAKOUT.md`
- `docs/pack-notes/PACK_NOTES_PHASE5F.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE5F.txt`
- `PROJECT_CHANGELOG.md`

### Validation
- `npm ci --ignore-scripts`
- CSS brace-balance check
- `npm run build`
- Static About DOM/motion selector checks
- `unzip -t`

### Notes
- A headless Chromium visual check was attempted, but local/file navigation was blocked in the sandbox.
- No editor behavior, About data model, foreground collage behavior, gallery curation behavior, public portfolio behavior, Three.js runtime behavior, portfolio import behavior, wall placement, collision, or plaque fallback behavior was changed.

## Phase 5G — About lower-collage frame and bottom float margin — 2026-05-16

### Summary
- Removed the visible rectangular outline/background from the public About/contact lower-collage container.
- Preserved individual foreground photo frames, captions, About placement roles, and About editor behavior.
- Raised the two lowest background-float images to keep visible margin above the bottom edge of the page, including after scroll-linked drift.
- Preserved Phase 5F's viewport-wide background-float layer and horizontal edge-spill behavior.

### Files changed
- `src/styles/global.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE5G_ABOUT_LOWER_COLLAGE_AND_BOTTOM_FLOAT_MARGIN.md`
- `docs/pack-notes/PACK_NOTES_PHASE5G.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE5G.txt`
- `PROJECT_CHANGELOG.md`

### Validation
- CSS brace-balance check
- `npm run build`
- `unzip -t`

### Notes
- No editor behavior, About data model, gallery curation behavior, public portfolio behavior, Three.js runtime behavior, portfolio import behavior, wall placement, collision, or plaque fallback behavior was changed.

## Phase 5H — About background motion refinement — 2026-05-16

### Summary
- Reduced the public About/contact background-float scroll motion so the photos feel more like subtle page atmosphere.
- Removed the sine-wave horizontal wobble from the About scroll-motion controller.
- Reduced background-float movement speeds and tightened the maximum transform offsets.
- Preserved the Phase 5F viewport-wide float placement and the Phase 5G lower-collage/bottom-margin correction.

### Files changed
- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE5H_ABOUT_BACKGROUND_MOTION_REFINEMENT.md`
- `docs/pack-notes/PACK_NOTES_PHASE5H.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE5H.txt`
- `PROJECT_CHANGELOG.md`

### Validation
- `npm run build`
- Static source checks for reduced About motion constants and removed sine drift
- `unzip -t`

### Notes
- No editor behavior, About data model, foreground collage behavior, gallery curation behavior, public portfolio behavior, Three.js runtime behavior, portfolio import behavior, wall placement, collision, or plaque fallback behavior was changed.

## Phase 5I — About Copy Editor — 2026-05-16

### Summary
- Added `src/data/aboutCopy.json` and `src/data/aboutCopy.ts` for data-backed About/contact copy.
- Updated the public About/contact page to render copy from the new About copy data layer instead of hardcoded placeholder strings.
- Added a structured About Copy section to the local editor About tab.
- Updated Flask editor load/save/backup/restore flows to include `aboutCopy.json`.
- Added optional About contact links and minimal public/editor styling.
- Bumped local editor assets to `v=71`.

### Validation
- Python syntax check for edited Flask modules.
- JavaScript syntax check for edited local-editor modules.
- JSON parse check for `aboutCopy.json`.
- CSS brace-balance checks.
- `npm run build`.
- `unzip -t`.

### Notes
- This pack preserves the user's copy-authorship rule. Existing placeholder copy was moved into editable data; no final About copy was generated.
- Final About image curation and gallery curation remain deferred until closer to launch.

---

## 2026-05-16 — Phase 5J About editor page split

### Changed
- Split the local editor About workflow into two routes: `#/about` for copy and `#/about/photos` for image import/curation.
- Kept the main About nav item pointed at the copy editor by default.
- Added an About Photos navigation item and cross-links between the two About editor pages.
- Preserved the existing About copy and About photo data schemas.
- Added documentation for the route/presentation split.

### Files changed
- `local-editor/templates/editor.html`
- `local-editor/static/js/main.js`
- `local-editor/static/js/render.js`
- `local-editor/static/editor.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE5J_ABOUT_EDITOR_PAGE_SPLIT.md`
- `PROJECT_CHANGELOG.md`

### Notes
- `#/about` remains the default route when clicking About in the editor.
- `#/about/photos` is a presentation split only; `aboutPhotos.json` and native About imports remain unchanged.

## 2026-05-16 — Phase 5K About responsive/accessibility closeout

### Summary

- Closed Phase 5 About/contact redesign.
- Added responsive safeguards for tablet/mobile About page layouts.
- Reduced decorative About float/collage load on very narrow screens for readability.
- Added wrapping safeguards for long About copy, email addresses, and optional contact links.
- Added visible keyboard focus styling for About contact links.
- Added stronger reduced-motion handling for About parallax/collage elements.
- Added semantic section labels through `aria-labelledby` relationships.
- Hardened data-backed contact email/link rendering.
- Changed the upper About collage fallback to use active About records instead of inactive raw records.
- Added Phase 5 closeout documentation.

### Files changed

- `src/app/sitePages.ts`
- `src/styles/global.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_ACTIVE.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE5_CLOSEOUT.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PHASE5K_ABOUT_RESPONSIVE_ACCESSIBILITY_CLOSEOUT.md`
- `docs/pack-notes/PACK_NOTES_PHASE5K.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE5K.txt`
- `PROJECT_CHANGELOG.md`

### Notes

- Final About copy remains user-authored and deferred until closer to launch.
- Final About image curation and final gallery curation remain pre-launch tasks.
- Next recommended phase is Phase 6 mobile 3D gallery controls.

## 2026-05-16 — Phase 6A Mobile gallery touch controls

### Summary

- Started Phase 6 mobile 3D gallery controls.
- Removed the mobile/touch-device desktop-only fallback path for the public virtual gallery.
- Added desktop/touch input-mode selection when the gallery opens.
- Added a restrained touch-control layer with a left thumb movement pad.
- Added analog touch movement support to the existing collision-aware movement controller.
- Added touch drag-to-look support to the gallery look controller while preserving desktop pointer-lock mouse look.
- Exposed touch movement methods from the Three.js `GalleryScene` wrapper.
- Added touch-mode CSS for the movement pad, drag-to-look hint, canvas touch behavior, and artwork info panel placement.
- Added Phase 6 active handoff and Phase 6A implementation docs.

### Files changed

- `src/app/galleryController.ts`
- `src/app/renderSite.ts`
- `src/gallery/GalleryScene.ts`
- `src/gallery/controls/lookController.ts`
- `src/gallery/controls/movementController.ts`
- `src/styles/global.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md`
- `docs/PHASE6A_MOBILE_GALLERY_TOUCH_CONTROLS.md`
- `docs/pack-notes/PACK_NOTES_PHASE6A.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE6A.txt`
- `PROJECT_CHANGELOG.md`

### Validation

- `npm run build`
- CSS brace-balance check
- Static source checks for the Phase 6A touch-control hooks
- `unzip -t`

### Notes

- This is the first mobile-control baseline, not final Phase 6 closeout.
- Real-device phone/tablet testing is still needed to tune movement sensitivity, look sensitivity, safe-area placement, and info-panel/control overlap.
- No gallery curation data, wall placement, collision geometry, plaque fallback, image texture loading, lighting, or local editor behavior was changed.

## 2026-05-18 — Phase 6B Mobile gallery polish

### Summary

- Refined the Phase 6A mobile gallery touch-control baseline for dev-preview real-device testing.
- Updated touch hint copy to `Drag to look · left thumb to move`.
- Added touch-control state tracking so the hint fades after first touch look/move use.
- Reduced touch look sensitivity and clamped large touch deltas to avoid accidental camera jumps.
- Added touch analog movement shaping with a dead zone and response curve to reduce drift/jitter.
- Added a touch-only movement speed reduction while preserving desktop movement speed.
- Softened and slightly reduced the touch movement pad visual treatment.
- Improved safe-area-aware control placement, artwork info-panel clamping, touch-mode crosshair scale, and compact landscape-phone behavior.
- Added Phase 6B documentation, pack notes, and manifest.

### Files changed

- `src/app/galleryController.ts`
- `src/app/renderSite.ts`
- `src/gallery/controls/lookController.ts`
- `src/gallery/controls/movementController.ts`
- `src/styles/global.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md`
- `docs/PHASE6B_MOBILE_GALLERY_POLISH.md`
- `docs/pack-notes/PACK_NOTES_PHASE6B.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE6B.txt`
- `PROJECT_CHANGELOG.md`

### Validation

- `npm run build`
- CSS brace-balance check
- Static source checks for Phase 6B touch-state hooks and tuning constants
- `unzip -t`

### Notes

- Real-device QA should happen from the `dev` branch deployment instead of spending more time on local phone tunnel/firewall setup.
- No gallery curation data, wall placement, collision geometry, plaque fallback, image texture loading, lighting, About/contact work, or local editor behavior was changed.

## 2026-05-18 — Phase 6C Gallery metadata simplification

### Summary

- Removed internal wall type labels from public Three.js gallery plaque metadata.
- Removed internal wall type labels from the bottom-right public artwork info card.
- Added a shared public metadata formatter for plaques and info cards.
- Preserved display order/archive numbering, category, and year/archive status as the viewer-facing metadata line.
- Preserved wall type data and controls for layout, wall scale, editor filtering, and placement logic.
- Added Phase 6C documentation, pack notes, and manifest.

### Files changed

- `src/gallery/artwork/galleryLayout.ts`
- `src/gallery/GalleryScene.ts`
- `src/app/galleryController.ts`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md`
- `docs/PHASE6C_GALLERY_METADATA_SIMPLIFICATION.md`
- `docs/pack-notes/PACK_NOTES_PHASE6C.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE6C.txt`
- `PROJECT_CHANGELOG.md`

### Validation

- `npm run build`
- Static source checks for removed public `wallSection` metadata usage
- `unzip -t`

### Notes

- This is a public display cleanup only.
- No gallery curation data, wall placement, collision geometry, plaque placement fallback, image texture loading, lighting, mobile controls, About/contact work, or local editor behavior was changed.


## 2026-05-18 — Phase 6D Editor image-card Save JSON fix

### Summary

- Fixed the lower **Save JSON** button on individual image editor pages so it saves the currently open image card's edited metadata reliably.
- Added a card-scoped payload builder that replaces the open image record in the full image array instead of relying on the broad page-level save collector.
- Preserved categories, About photo data, About copy, and unrelated image records during the lower image-card save.
- Preserved/updates hero slide membership for the edited image based on the open card controls.
- Left the top global **Save Changes** button behavior unchanged.
- Bumped the local editor asset cache from `v=72` to `v=73`.
- Added Phase 6D documentation, pack notes, and manifest.

### Files changed

- `local-editor/static/js/collect.js`
- `local-editor/static/js/main.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md`
- `docs/PHASE6D_EDITOR_IMAGE_CARD_SAVE_FIX.md`
- `docs/pack-notes/PACK_NOTES_PHASE6D.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE6D.txt`
- `PROJECT_CHANGELOG.md`

### Validation

- `node --check local-editor/static/js/collect.js`
- `node --check local-editor/static/js/main.js`
- `python3 -m py_compile local-editor/app/*.py`
- `npm ci --ignore-scripts`
- `npm run build`
- targeted Node harness for `collectImageCardSavePayload`
- static source checks for the new image-card save path and editor cache bump
- `unzip -t`

### Notes

- This is a local-editor hotfix only.
- It does not change public gallery runtime behavior, mobile touch controls, gallery curation data, wall placement, plaque metadata, collision behavior, About layout, or the image rendition pipeline.
- Manual Flask editor validation is still recommended because the sandbox cannot run the local editor exactly as the user's Windows environment does.

## 2026-05-18 — Phase 6E Mobile gallery responsiveness tuning

### Summary

- Lightly increased touch drag-look sensitivity after real-phone testing found the mobile controls working but slightly under-sensitive.
- Slightly loosened touch-look delta clamping so intentional swipes can rotate the camera more quickly.
- Increased touch-only movement speed without affecting desktop WASD/arrow movement.
- Reduced the analog thumb dead zone so movement begins with less thumb travel.
- Made the analog thumb response curve closer to linear for a more immediate feel.
- Reduced the effective movement-pad vector radius so normal thumb movement produces a stronger movement vector.
- Added Phase 6E documentation, pack notes, and manifest.

### Files changed

- `src/app/galleryController.ts`
- `src/gallery/controls/lookController.ts`
- `src/gallery/controls/movementController.ts`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md`
- `docs/PHASE6E_MOBILE_GALLERY_RESPONSIVENESS_TUNING.md`
- `docs/pack-notes/PACK_NOTES_PHASE6E.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE6E.txt`
- `PROJECT_CHANGELOG.md`

### Validation

- `npm ci --ignore-scripts`
- `npm run build`
- Static source checks for Phase 6E touch sensitivity constants
- `unzip -t`

### Notes

- This is a mobile gallery touch-feel tuning pack only.
- It does not change desktop gallery controls, public site layout, gallery curation data, wall placement, collision geometry, plaque metadata, image texture loading, lighting, About/contact behavior, or local-editor save behavior.
- Real-device QA should continue from the `dev` deployment, then merge to `main` once the feel is acceptable.



## 2026-05-18 — Phase 6F Mobile camera and landscape homepage tuning

### Summary

- Reduced touch drag-look sensitivity from the Phase 6E value while keeping it above the Phase 6B restrained baseline.
- Reduced touch-look delta clamping from the Phase 6E value to lower the chance of accidental camera jumps.
- Preserved Phase 6E movement responsiveness because the reported issue was camera sensitivity, not movement speed.
- Added a targeted horizontal-phone homepage media query for short landscape mobile screens.
- In horizontal-phone homepage view, switched the hero to a compact image-first layout with a small index rail, hidden thumbnail strip, hidden meta panel, hidden statement/actions, and tighter header/nav spacing.
- Added Phase 6F documentation, pack notes, and manifest.

### Files changed

- `src/gallery/controls/lookController.ts`
- `src/styles/global.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md`
- `docs/PHASE6F_MOBILE_CAMERA_AND_LANDSCAPE_HOME_TUNING.md`
- `docs/pack-notes/PACK_NOTES_PHASE6F.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE6F.txt`
- `PROJECT_CHANGELOG.md`

### Validation

- `npm ci --ignore-scripts`
- `npm run build`
- CSS brace-balance check
- Static source checks for Phase 6F touch camera constants and horizontal-phone homepage CSS
- `unzip -t`

### Notes

- This is a focused mobile tuning pack.
- It does not change gallery curation data, wall placement, collision geometry, public plaque metadata, About/contact behavior, local-editor save behavior, or desktop gallery controls.
- Real-device QA should continue from the `dev` deployment before merging or treating Phase 6 as complete.


## 2026-05-18 — Phase 6G Horizontal-phone homepage hero fix

### Summary

- Refined the Phase 6F short landscape-phone homepage layout after real-device testing showed the hero image being visually cut by the compact copy-panel overlay.
- Let the horizontal-phone hero image shell fill the available stage width instead of rendering as a narrower 16:9 box aligned to the right.
- Set the horizontal-phone hero shell to a fixed short viewport-based height for a cleaner photo-first layout.
- Hid the copy panel only in this short landscape-phone homepage mode so the dark text overlay no longer covers the photo.
- Preserved the Phase 6F compact index rail, simplified header/nav, hidden thumbnails, hidden meta panel, hidden statement/actions, and all gallery touch-control tuning.

### Files changed

- `src/styles/global.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md`
- `docs/PHASE6G_HORIZONTAL_PHONE_HOMEPAGE_HERO_FIX.md`
- `docs/pack-notes/PACK_NOTES_PHASE6G.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE6G.txt`
- `PROJECT_CHANGELOG.md`

### Validation

- `npm ci --ignore-scripts`
- `npm run build`
- CSS brace-balance check
- Static source checks for Phase 6G horizontal-phone homepage CSS
- `unzip -t`

### Notes

- This is a scoped public homepage CSS fix for short landscape-phone viewports only.
- It does not change mobile gallery control sensitivity, movement tuning, desktop homepage behavior, portrait-phone homepage behavior, gallery curation data, plaque metadata, local-editor behavior, or About/contact behavior.

## 2026-05-18 — Phase 6H Pixel landscape homepage fix

### Summary

- Fixed the Pixel 9 Pro XL horizontal-phone homepage issue where the dense desktop hero metadata/thumbnail layout could still appear in landscape orientation.
- Added a broader short landscape-phone homepage media query up to `1080px` CSS width and `560px` CSS height.
- Kept the fix scoped to `.modern-site[data-page='home']` so other pages and the gallery runtime are unaffected.
- Preserved the compact image-first homepage direction from Phase 6F/6G but made it apply to wider CSS mobile viewports.
- Hid the metadata panel, thumbnail strip, copy panel, statement/actions, rail label, and grid marks in this mode.
- Tightened the header/nav and made the hero image fill the available stage with cover fitting.

### Files changed

- `src/styles/global.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md`
- `docs/PHASE6H_PIXEL_LANDSCAPE_HOME_FIX.md`
- `docs/pack-notes/PACK_NOTES_PHASE6H.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE6H.txt`
- `PROJECT_CHANGELOG.md`

### Validation

- `npm run build`
- CSS brace-balance check
- Static source checks for the Phase 6H landscape-phone breakpoint and scoped homepage selectors
- Inline headless CSS layout probe at a Pixel-class landscape viewport
- `unzip -t`

### Notes

- This is a scoped homepage CSS fix for short landscape-phone viewports.
- It does not change mobile gallery camera sensitivity, movement responsiveness, desktop homepage behavior, portrait-phone homepage behavior, gallery curation data, plaque metadata, local-editor behavior, or About/contact behavior.
- Real-device QA from the `dev` deployment is still the source of truth for the Pixel 9 Pro XL.

## 2026-05-18 — Phase 6I Mobile route and touch hardening

### Summary

- Extended the short landscape-phone public-shell treatment beyond the homepage to Portfolio and About routes.
- Made Portfolio use a compact horizontal category rail, tighter heading/metadata spacing, and tighter grid spacing on wide, short phone viewports.
- Made About use tighter spacing, smaller text scale, and less dominant background-float opacity on wide, short phone viewports.
- Added touch-callout and overscroll guards around the fullscreen gallery overlay.
- Added touch-interruption cleanup so active movement/look states clear on blur, page hide, document visibility loss, orientation change, touch-mode resize, and gallery teardown.
- Preserved Phase 6F camera sensitivity and Phase 6E movement responsiveness.

### Files changed

- `src/app/galleryController.ts`
- `src/gallery/GalleryScene.ts`
- `src/gallery/controls/lookController.ts`
- `src/styles/global.css`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md`
- `docs/PHASE6I_MOBILE_ROUTE_AND_TOUCH_HARDENING.md`
- `docs/pack-notes/PACK_NOTES_PHASE6I.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE6I.txt`
- `PROJECT_CHANGELOG.md`

### Validation

- `npm ci --ignore-scripts`
- `npm run build`
- CSS brace-balance check
- Static Phase 6I source checks
- `unzip -t`

### Notes

- This is a scoped mobile/landscape and input-hardening pack.
- It does not change gallery curation data, wall placement, collision geometry, public plaque metadata, local-editor behavior, desktop gallery controls, or the accepted About/contact data model.
- Real-device QA from the `dev` deployment remains the source of truth.

## 2026-05-18 — Phase 6J Mobile gallery closeout

### Summary

- Closed Phase 6 mobile 3D gallery controls after the Phase 6I route/touch hardening was confirmed working.
- Recorded the accepted mobile gallery baseline: Phase 6E movement responsiveness, Phase 6F touch-camera sensitivity, Phase 6H Pixel-class horizontal-phone homepage handling, and Phase 6I short-landscape route/touch-interruption hardening.
- Updated the current handoff, Phase 6 handoff, roadmap, transfer workflow, and dedicated closeout notes.
- Marked future mobile work as issue-driven rather than open Phase 6 scope.
- Pointed the next recommended phase toward Phase 7 SEO/discoverability and launch-readiness infrastructure while keeping final copy/image/gallery curation as user-authored pre-launch tasks.

### Files changed

- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md`
- `docs/PHASE6J_MOBILE_GALLERY_CLOSEOUT.md`
- `docs/pack-notes/PACK_NOTES_PHASE6J.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE6J.txt`
- `PROJECT_CHANGELOG.md`

### Validation

- Documentation marker checks
- Pack manifest check
- `unzip -t`

### Notes

- Phase 6J is documentation-only.
- No runtime TypeScript, CSS, editor code, data files, gallery curation data, image assets, touch sensitivity, movement speed, or public copy changed in this pack.
