# Phase 4 Editor Fixes Start

Date: 2026-05-15

## Phase intent

Phase 4 is an editor-focused phase. It should improve the local editor so the user can manage a larger portfolio without needing destructive cleanup or one-image-at-a-time curation.

The public site design should remain stable during this phase unless the user reports a specific public-facing issue.

## First priority

Fix the rename ID + rendition workflow bug:

```text
The file ID updates correctly, but the title and suggested title/ID fields can revert back to the original ID/title after rename.
```

This should be handled before larger curation tools because it affects trust in the editor state after image identity changes.

## Second priority

Add hide/show controls so images can remain in the project while being excluded from the public website.

This is important because the current 67-image set may be intentionally broad during development, but the final public site may need to feel more curated.

## Later Phase 4 priorities

- Bulk selection.
- Bulk hide/show.
- Bulk category changes.
- Bulk hero-candidate or hero-slide workflows.
- Import review remove buttons.
- Clearer import button wording.
- Import progress bar and log/status text.
- Category creation from import dropdown.

## Implementation caution

Prefer durable data model changes and editor/public validation over quick UI-only toggles. Hidden images must not disappear from the editor, and bulk actions must not accidentally overwrite curated hero or 3D gallery state.
