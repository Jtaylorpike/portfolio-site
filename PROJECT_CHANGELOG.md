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


---

## Appended changelog fragments - 20260512-132415


## 2026-05-12 — Dev to main release readiness

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


## 2026-05-12 â€” Editor image ID rename backend fix

- Added the missing backend helper functions used by `rename_image_id()` in `local-editor/app/data_store.py`.
- Added safe title/slug-based ID de-duplication on the backend.
- Added canonical portfolio rendition URL generation for image ID renames.
- Added safe public path resolution so rename operations stay inside `public/`.
- Added all-four-rendition file planning with missing-file and target-collision checks.
- Added rollback behavior if a multi-file rename fails partway through.
- Kept the prior authoritative editor reload behavior and bumped editor asset cache version to `v=19`.


# Changelog append â€” Editor image ID rename UI refresh fix

Date: 2026-05-12

## Changed

- Updated the local editor image ID rename flow so successful renames render the new image-detail route directly instead of rendering against the old image hash first.
- Added a defensive check that the rename API response includes `updatedImage.id` before the UI updates the route.
- Extended `applyLoadedState()` so callers can pass an explicit route when the current hash route is no longer valid after a data mutation.
- Bumped the local editor CSS/JS cache-bust query from `v=16` to `v=17`.

## Reason

The previous rename flow could leave the visible Image identity panel stale after `Rename ID + Rendition Files` because the editor state updated before the browser hash moved from the old image ID to the new image ID.


## 2026-05-12 — Editor image ID rename workflow

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


## 2026-05-12 — Editor import UI validation

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


# Changelog Append â€” 2026-05-12 â€” Gallery Curation Visual Assignment and Wall Types

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


# Changelog Append â€” Gallery Wall Type Display Status Cleanup

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


## 2026-05-12 â€” Gallery floor-grid placement and collision prevention

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


# Changelog Append â€” Gallery Preview Lightbox Editor

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


## 2026-05-12 â€” Gallery wall placement controls

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


## 2026-05-13 â€” Gallery Map Controls Height Fix

- Fixed the gallery floor-map controls panel stretching into a large empty box above the grid.
- Updated the map column layout so controls remain compact while the grid fills the available space.
- Bumped the Flask editor CSS/JS cache version to `v=40`.


## 2026-05-13 â€” Gallery Map Drag Direction and Rectangle Wall Refinement

- Fixed the editor map drag/drop preview so its X-axis mapping matches the resting wall marker orientation.
- Made wall blocks render as simple continuous square-ended rectangles in both resting and drag-preview states.
- Tightened the map controls bar and removed excess helper text from the compact control container.
- Bumped local editor cache version to `v=39`.


# Changelog Append â€” Gallery Map Drag Preview Cleanup

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


# Changelog Append â€” Gallery Map Orientation, Boundary, and Runtime Visibility Fix

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


## 2026-05-13 â€” Gallery Map Visible Voxel Walls and Icon Controls

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


## 2026-05-13 â€” Gallery Map Final Viewport and Grid Fix

- Restored the gallery placement map to a true square board so X/Z cells render with equal visual scale.
- Replaced the vertically condensed map sizing with a viewport-aware square clamp.
- Disabled the legacy center-axis pseudo-elements that caused doubled/uneven-looking grid lines.
- Removed fixed-pixel wall thickness from map markers so every wall block renders at a consistent one-cell thickness.
- Kept wall block types visually differentiated by length rather than thickness/volume.
- Bumped the local editor cache version to `v=42`.


## 2026-05-13 â€” Gallery map height, grid, and wall thickness fix

- Constrained the local editor gallery floor map height so the full map is easier to see without excessive page scrolling.
- Replaced the layered/repeating grid background with a uniform cell grid to remove visually uneven center-line spacing.
- Standardized editor map wall-block thickness so wall types differ by length, not visual volume.
- Kept hidden editor map walls subdued but visible.
- Bumped the local editor cache version to `v=41`.


---

## Appended changelog fragments - 20260513-173046


# Changelog Append â€” 2026-05-13 â€” Phase 0 Gallery Map Whitespace Closure

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


# Changelog Append â€” Phase 1 Public Site Audit

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


# Changelog Append â€” 2026-05-13 â€” Phase 2A Public Interface Font Restoration

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


# Changelog Append â€” 2026-05-13 â€” Phase 2A Typography Scope Correction

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


# Changelog Append â€” 2026-05-13 â€” Phase 2B Homepage Polish

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


# Changelog Append â€” 2026-05-13 â€” Phase 2C Portfolio Index Polish

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


# Changelog append â€” 2026-05-13 â€” Phase 2D Gallery Entry CTA Polish

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


# Changelog Append â€” 2026-05-13 â€” Phase 2D Gallery Entry Scope Correction

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


# Changelog Append â€” 2026-05-13 â€” Phase 2D Homepage Below-Hero Simplification

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


# Changelog Append â€” 2026-05-13 â€” Phase 2E Home Hero-Only Simplification

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


# Changelog append â€” 2026-05-13 â€” Room model baseline and site roadmap

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

