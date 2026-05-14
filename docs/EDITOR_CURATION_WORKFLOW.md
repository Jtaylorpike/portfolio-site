# Editor Curation Workflow

Date: 2026-05-14
Scope: Phase 3 content and metadata curation

## Before opening the editor

Start on the development branch:

```powershell
cd C:\Users\jtayl\portfolio-site
git checkout dev
git status
```

If there are unrelated local changes, decide whether to commit, stash, or discard them before curation work. Image curation can touch data and runtime image files, so it is easier to reason about when the working tree is clean.

## Run the local editor

```powershell
.\scripts\Audit-LocalEditorCompatibility.ps1
.\scripts\Run-LocalEditor.ps1
```

Open the local URL printed by the script.

## Recommended curation sessions

### Session 1 — Selection only

Goal: decide what belongs on the site.

Actions:

- Review every current image record.
- Mark obvious non-public/test images for hiding or removal.
- Identify strong portfolio candidates.
- Identify strong hero candidates.
- Identify strong 3D gallery candidates.

Do not try to perfect all metadata in this session.

### Session 2 — Metadata baseline

Goal: make selected images presentable.

Actions:

- Confirm titles.
- Confirm categories.
- Add known location/year where useful.
- Add alt text/descriptive text where supported.
- Confirm hero eligibility.
- Confirm gallery eligibility.

### Session 3 — Hero curation

Goal: make the homepage feel intentional.

Actions:

- Limit hero slides to the strongest landscape/crop-safe work.
- Check mobile hero behavior after changes.
- Check desktop hero no-scroll behavior remains intact.
- Confirm hero transitions still feel fast.

### Session 4 — Portfolio index curation

Goal: make the archive feel coherent.

Actions:

- Check category balance.
- Remove weak/test thumbnails.
- Confirm category rail behavior.
- Open several images in the lightbox and confirm caption/metadata hierarchy works.

### Session 5 — 3D gallery curation

Goal: make the current gallery room feel intentional.

Actions:

- Assign only strong images to wall slots.
- Avoid filling every slot just because it exists.
- Check plaque readability and fallback behavior.
- Check movement/approach spacing.
- Save and validate.

## After each meaningful curation session

Run:

```powershell
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
npm run build
```

If validation passes, commit a logical checkpoint:

```powershell
git status
git add src/data public/images/portfolio docs PROJECT_CHANGELOG.md
git commit -m "Curate portfolio image metadata"
git push origin dev
```

Adjust the commit message to match the actual curation work.

## If importing new images

Use the established import workflow rather than manually placing files:

```powershell
.\scripts\Audit-ImageImportInbox.ps1
.\scripts\Import-PortfolioImages.ps1 -Category personal
.\scripts\Import-PortfolioImages.ps1 -Category personal -Apply
.\scripts\Validate-PortfolioDevBranch.ps1
```

Replace `personal` with the intended category when appropriate.

## If removing images

Use the established removal workflow rather than manually deleting records and files:

```powershell
.\scripts\Remove-PortfolioImageRecord.ps1 -ImageId "example-id"
.\scripts\Remove-PortfolioImageRecord.ps1 -ImageId "example-id" -Apply
.\scripts\Validate-PortfolioDevBranch.ps1
```

## Documentation responsibility

As this project continues, update the `docs/` folder when curation decisions materially affect the project direction, content model, launch readiness, or future handoff state.

The docs folder should remain readable for both future ChatGPT sessions and humans reviewing the project.
