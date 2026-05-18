# Phase 4K — Non-Gallery Editor Closeout

Updated: 2026-05-16

## Purpose

Phase 4K closes the remaining non-gallery editor work after the Phase 4H-I-J v9 drag-ordering threshold was accepted.

This pack intentionally does **not** change gallery curation behavior, public-site behavior, Three.js runtime code, wall placement, collision, plaque fallback logic, import file writing, or image data schemas.

## Changes

### Category manager closeout

- Adds a category summary strip with total categories, total images, visible images, hidden images, and hero slide count.
- Adds per-category usage chips for total, visible, hidden, and hero target counts.
- Adds an explicit reassignment target selector for category removal.
- Blocks removal of the final remaining category.
- Uses a clearer removal confirmation that states how many image records and hero slide targets will be reassigned.
- Uses unique category IDs when adding categories from the Categories page.
- Blocks saving category settings when duplicate category IDs are present.

### Backup restore polish

- Adds a backup toolbar explaining what restore affects and that the current state is backed up first.
- Adds a restore readiness label to backup cards.
- Warns before restoring if the editor has unsaved changes.
- Improves the restore confirmation copy so the destructive step is clearer.

### Pack documentation organization

- Pack notes now live under `docs/pack-notes/`.
- Pack manifests now live under `docs/pack-manifests/`.
- Existing root-level pack notes/manifests were moved into those folders inside this working tree.
- `scripts/Move-PackDocsIntoDocs.ps1` remains available to move older root-level files in a local checkout after applying the pack.

## Accepted Phase 4 endpoint

```text
Rename workflow: Phase 4A v2
Visibility and bulk editing: Phase 4B/C
Import workflow: Phase 4D-F
Editor visual system and dark mode: Phase 4G v6 and later local-editor CSS corrections
Category image drag ordering: Phase 4H-I-J v9
Non-gallery category/backup closeout: Phase 4K
```

## Deferred work

These are not blockers for Phase 4 closeout:

- optional gallery-specific eligibility controls;
- true backend-streamed per-file import progress;
- further editor visual polish unless a specific issue is identified;
- broader public-site or About/contact redesign, which belongs to Phase 5.

## Manual test notes

After applying the pack:

1. Open the local editor and hard refresh.
2. Open **Categories**.
3. Confirm the category summary and per-category counts render.
4. Add a category and confirm the generated ID is unique.
5. Try duplicate category IDs and confirm saving is blocked clearly.
6. Remove a non-final category and confirm the reassignment warning names the selected target.
7. Open **Backups**.
8. Confirm backup cards show restore readiness.
9. Make an unsaved edit, then try restore and confirm the unsaved-change warning appears.
