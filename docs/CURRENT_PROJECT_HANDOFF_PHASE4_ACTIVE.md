# Current Project Handoff — Phase 4 Closeout

Updated: 2026-05-16

## Current status

The portfolio project is closing **Phase 4: editor curation controls and editor workflow fixes** with the Phase 4K non-gallery editor closeout pack.

The user marked Phase 3 complete on 2026-05-15. The portfolio image set may remain broad for now because the site is not close to public launch. Do not restart Phase 3 unless the user explicitly asks to return to content curation.

The public site design baseline is stable. Do not broadly redesign the public site unless the user requests it or reports a specific issue.

## Phase 4 goal

Make the local editor better at managing a growing portfolio image set without forcing destructive cleanup.

The main product direction is that the user should be able to keep images in the data/rendition system while controlling whether they appear publicly and while performing common curation tasks in batches.


## Phase 4K closeout baseline

Phase 4K finishes the remaining non-gallery editor items without changing gallery curation/runtime behavior. It adds category usage stats, safer category removal/reassignment, duplicate category preflight checks, clearer backup restore safety messaging, unsaved-change protection before restore, and pack-note/manifest organization under `docs/pack-notes/` and `docs/pack-manifests/`.

Accepted non-gallery editor baseline:

```text
Rename workflow: Phase 4A v2
Visibility/bulk editing: Phase 4B/C
Import review: Phase 4D-F
Editor visual system/dark mode: Phase 4G v6 plus later drag packs
Category image ordering: Phase 4H-I-J v9
Category/backups closeout: Phase 4K
```

Remaining editor ideas should be treated as deferred backlog unless the user reports a concrete issue. Gallery-specific future work should not be bundled into this closeout.

## Active architecture reminders

- Vite + TypeScript static portfolio site.
- Vanilla TypeScript modules, not React.
- Three.js-powered public 3D gallery.
- Local editor is Flask-backed under `local-editor/`.
- Active data lives in `src/data/`.
- Do not restore `public/data/` as active data.
- Active runtime images live under `public/images/portfolio/{display,thumb,texture,full}/`.
- There is no active `public/images/logo/` folder.

## Public design constraints

- Keep the public design stable during Phase 4.
- VCR/pixel font remains secondary/tertiary accent only.
- Do not apply the pixel font to the “Taylor Pike” header/wordmark.
- Do not generate final public website copy unless asked.
- Preserve the homepage hero-only desktop viewport behavior.
- Preserve the current portfolio/index simplification unless the user asks for a specific change.

## Completed Phase 4 work

### Phase 4A — Rename ID/title/suggestion refresh fix, v2

The corrected Phase 4A pack updates the controlled image ID rename workflow so the request carries a whitelisted snapshot of the currently visible image metadata. The frontend now renders from the successful rename response instead of doing an immediate post-rename `/api/data` reload, and normal data loads are cache-busted/no-store. This prevents the ID, title, suggested title-based ID, and rendition URL fields from falling out of sync after a controlled rename.

Changed files:

```text
local-editor/app/data_store.py
local-editor/app/routes.py
local-editor/static/js/api.js
local-editor/static/js/main.js
local-editor/templates/editor.html
docs/PHASE4A_EDITOR_RENAME_METADATA_REFRESH_FIX.md
```

Manual test focus: edit an image title, refresh the title-based ID suggestion, run Rename ID + Rendition Files, and confirm the current ID panel, hidden ID field, title field, suggested ID field, and four rendition URL fields remain aligned immediately and after reload.

### Phase 4B — Bulk editor visibility and curation controls

Phase 4B adds the public visibility model and bulk editor controls.

Completed:

```text
Public hide/show data model using optional isPublic: false
Single-image Show on public website checkbox
Public filtering through src/data/images.ts
All-images and category-page bulk toolbar
Bulk select visible / clear selection / selected count
Bulk show/hide selected images
Bulk category reassignment
Bulk hero add/remove, limited to public landscape images for add
Overview status badges for Visible on site / Hidden from site / Homepage hero
```

Hidden images remain in `src/data/galleryImages.json` and keep all rendition file paths. They are filtered out of public-facing `galleryImages`, public hero resolution, and 3D gallery artwork lookup.

Manual test focus: select images on the Images page, hide/show them, bulk change category, bulk add/remove eligible landscape images from hero, reload the editor, and confirm the JSON state persists.

### Phase 4C — Bulk editor UX/readability polish

Phase 4C keeps the Phase 4B functionality intact and improves the local editor interface around bulk curation. It adds higher-contrast visibility badges, selected-card visual states, clearer bulk toolbar copy, and a disabled apply state until the user has both selected images and chosen a bulk update.

Completed:

```text
Higher-contrast Visible on site / Hidden from site / Homepage hero chips
Hidden thumbnail overlay
Selected-card state for bulk selection
Bulk apply disabled until there is a valid selection and update
Improved single-image public visibility explanation
Editor asset version bumped to v=47
```

Manual test focus: confirm the overview labels are readable, selected cards are visually obvious, hidden thumbnails have a clear hidden overlay, and the bulk apply button only enables when both a selection and a chosen update exist.

## Phase 4 backlog

### Phase 4D — Import review workflow polish

Completed:

```text
Remove button on each import review card
Clearer dynamic Import X photo(s) button label
Import progress panel with upload percentage, progress bar, and log text
Category creation controls from the import workflow
Backend support for saving reviewed categories with an import transaction
Editor asset version bumped to v=48
```

The progress bar uses real browser upload progress. The backend still processes rendition creation as a single Flask request, so backend-processing status is stage-based rather than true per-file streaming.

Manual test focus: prepare a multi-image import review, remove one item, create a new category from the import workflow, assign an image to that category, import the remaining reviewed photos, and confirm both imported images and the new category persist after reload.


### Phase 4E — Archive editor visual rehaul

Phase 4E improves the editor UI after the import page exposed severe visual/layout issues. It keeps the editor bare-bones, but gives the tool a more consistent archive-editor design system and fixes the import review card structure.

Completed:

```text
Archive-editor design token refresh for the Flask local editor
More consistent card, panel, button, form, and status styling
Import review cards now use compact thumbnails instead of oversized images
Import card toolbar now spans the full card width
Clickable import thumbnail opens a full-size preview lightbox
Escape, backdrop, and Close button close the import preview lightbox
Duplicate Home hero eligibility eyebrow removed from import cards
Editor asset version bumped to v=49
```

Manual test focus: prepare an import review with portrait and landscape images, confirm compact thumbnail layout, open/close the thumbnail lightbox, remove one import item, create a category during import, and complete the reviewed import.


### Phase 4F — Editor import and gallery cleanup

Phase 4F is a focused follow-up to the archive-editor visual rehaul.

Completed:

```text
Removed the white inner bevel/inset artifact from editor buttons
Removed import-card crop/framing tools from the import review screen
Kept hidden default crop/framing values so imports still create valid image records
Added galleryCurationStatus diagnostics to editor API responses
Changed the gallery curation empty state so it does not falsely claim galleryCuration.json is missing when the file exists
Editor asset version bumped to v=50
```

Manual test focus: confirm buttons render flat with no white inner rim, import review cards show metadata plus compact thumbnails/lightbox only, and the Gallery page loads existing wall cards without a false missing-file warning.


### Phase 4G / 4G v2 — Gallery editor UX professionalization and correction

Phase 4G brings the Gallery page into the same archive-editor visual system as the rest of the local editor. Phase 4G v2 corrects the first pass by removing the oversized green checkbox treatment and tightening the direction to an Adobe-inspired archive editor: neutral, compact, panel-based, visually quiet, image-first, and free of VCR/pixel typography.

Completed:

```text
Archive Room Editor summary header
Top-level Save All Gallery Curation action
Cleaner wall-card header and status-chip language
Clearer artwork assignment and preview actions
Precise artwork ID fallback moved into an advanced details block
Room behavior controls grouped together
Improved map-position/footprint readouts
Gallery overlays and picker restyled to match the archive-editor system
Editor asset version bumped to v=51
```

Completed in Phase 4G v2:

```text
Oversized green checkbox treatment removed
Gallery boolean controls standardized as compact neutral checkboxes
Gallery status chips made more restrained and less success-color-driven
Editor technical/coordinate readouts use a standard system monospace stack, not VCR/pixel typography
Future drag-and-drop category ordering documented as backlog
Editor asset version bumped to v=52
```

Manual test focus: open Gallery, confirm existing wall cards render, use filters, open artwork and wall previews, assign artwork with the visual picker, change wall type/status/plaque controls, move cards, save one wall, save all gallery curation, reload, and confirm state persists. Also confirm `Show plaque` and other checkbox controls render as compact neutral controls, not large green blocks.


### Phase 4H-I-J — Combined editor functionality pack

Phase 4H-I-J implements the remaining core editor workflow items in one pack.

Completed:

```text
Drag-and-drop ordering for category-specific Images views
All images view intentionally remains non-draggable
Saved/Unsaved changes header indicator
Discard warning before route changes with unsaved edits
Discard warning before Reload Data
Discard warning before clearing an Import Review
Frontend duplicate-filename import warnings
Backend import preflight before any file writes
Backend duplicate ID, existing ID, invalid ID, unsupported extension, and rendition collision rejection
Backend cleanup for newly created import files after mid-import failures
Editor asset version bumped to v=57
```

Manual test focus: open a category Images page, drag cards with the handle, save the order, reload, and confirm persistence. Also test unsaved edit route/reload warnings and import duplicate/existing ID blocking.

## Remaining Phase 4 backlog

```text
Optional gallery-specific bulk eligibility controls if gallery curation starts needing them
Potential true backend-streamed per-file import progress if larger imports make stage-based feedback insufficient
Final Phase 4 closeout/handoff pack when the user is ready to move into Phase 5
```

## Suggested implementation sequence

```text
1. Test Phase 4H-I-J in the real local editor.
2. Confirm category drag ordering persists after reload.
3. Confirm unsaved-change warnings do not interrupt normal saved workflows.
4. Confirm import duplicate/existing ID errors are readable.
5. Decide whether optional gallery-specific bulk eligibility controls are still needed.
6. Otherwise prepare a Phase 4 closeout pack and move to Phase 5 About/contact redesign.
```

## Validation guidance

For editor/image-pipeline changes, validate more carefully than for documentation-only work.

Use as appropriate from repo root:

```powershell
npm run build
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
```

For local editor changes, also run:

```powershell
.\scripts\Run-LocalEditor.ps1
```

Manual checks should cover the exact workflow being touched. For rename and visibility work, include before/after state checks in both the editor and public site.

## Documentation requirement

After meaningful Phase 4 changes, update:

```text
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE4_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
PROJECT_CHANGELOG.md
```

Only update additional docs when the change affects that specific workflow.

## Phase 4G v3 — Adobe archive editor CSS overhaul

Phase 4G v5 is the current visual correction after the Phase 4G v3 CSS overhaul exposed several rough edges. The approved direction remains an Adobe-inspired archive editor: neutral, compact, professional, panel-based, visually quiet, image-first, and free of decorative status icons.

Completed through v4:

```text
CSS-forward visual overhaul of the local editor
Neutral gray workspace and compact command header
Software-tab navigation
Softer compact editor buttons after the v3 rectangle treatment felt too rigid
Tighter inputs and form controls
Asset-browser treatment for image overview cards
Thumbnail-led import review records
Inspector-panel treatment for gallery wall cards
Restrained gray/amber status chips
Dark professional overlay treatment
Wall Finder layout overlap corrected
Wall preview baseboard/floor/trim elements removed from editor thumbnails
Large Select Image overlays replaced with compact selection-square controls
Local light/dark editor theme toggle added
Editor asset version bumped to v=54
```

The pack intentionally does not change data schemas, public-site styling, Three.js runtime behavior, gallery map placement, collision logic, plaque fallback logic, import behavior, or save behavior. The only JavaScript behavior added is the local editor theme toggle.

## Phase 4G v6 gallery curation stabilization — 2026-05-15

The Phase 4G visual editor work was followed by a Gallery curation regression report. Phase 4G v6 is a narrow stabilization pack that re-ships the full Gallery editor frontend/API file set, preserves `galleryRoom` in editor state, bumps the editor cache to `v=56`, and avoids any public-site, Three.js, placement-math, collision, plaque-fallback, or schema changes.



## Phase 4H-I-J v2 category drag smoothing — 2026-05-16

After real editor testing, the first category drag-and-drop implementation was confirmed functional but too clunky. The v2 follow-up changes category-specific Images pages so cards can be dragged from any non-control part of the card instead of only from a small handle. The All images view remains non-draggable. Buttons, selects, checkboxes, labels, and explicit no-drag regions remain normal controls. Thumbnail/title links still open when clicked, but accidental link clicks are suppressed after a drag.

The drag path now uses pointer events and a row-aware grid insertion calculation instead of native HTML5 drag/drop plus a vertical-only insertion calculation. Editor asset version is `v=58`.


### Phase 4H-I-J v4 — Category drag interaction refinement

- Refines category-specific image drag ordering after the dynamic drag preview pass.
- Custom drag can start from photo previews without triggering native browser image drag.
- Short photo-preview clicks still open the individual image editor page, while a brief hold activates drag.
- Placeholder placement is calculated against real cards only to avoid the extra empty side cell/offset issue.
- All Images remains read-only for ordering.

## Phase 4H-I-J v5 category drag placeholder correction — 2026-05-16

After the dynamic category drag interaction was tested, a remaining placeholder offset issue was reported where dragging could appear to create an extra blank card one position left or right of the intended placeholder. Phase 4H-I-J v5 corrects this by removing the placeholder before measuring CSS Grid card positions, then reinserting it after calculating the intended insertion point from real category cards only.

The same pack keeps the mouse cursor normal until custom drag activation, delays pointer capture until drag activation so short-click preview navigation is more reliable, and bumps editor assets to `v=61`.

### Phase 4H-I-J v6 — Category drag single-placeholder fix

Phase 4H-I-J v6 supersedes the v5 category drag placeholder model. The source card now becomes the single grid placeholder while a cloned ghost card floats above the grid. This is intended to remove the extra adjacent blank-cell artifact that could appear during drag activation or movement. Window-level pointermove handling keeps the placeholder updating outside the immediate editor list area. Pack notes and manifests are now stored under `docs/` for this pack and future packs; `scripts/Move-PackDocsIntoDocs.ps1` can move older root-level pack docs into docs folders. Editor asset version is `v=62`.


## Phase 4H-I-J v7 — Category drag pacing refinement

Phase 4H-I-J v7 keeps the v6 single-placeholder drag model but refines the insertion pacing. Rightward movement now uses a direction-aware buffer before advancing the placeholder after a target card, which should make moving right feel less abrupt and closer to the steadier leftward pacing. Editor asset version is `v=63`.

## Phase 4H-I-J v8 category drag left-threshold tuning — 2026-05-16

Category-specific image ordering keeps the current v6/v7 drag baseline: source-card-as-placeholder, floating ghost preview, short-click photo navigation, press/hold drag activation, and non-draggable All Images. This v8 tuning lowers the left-side insertion threshold so the placeholder requires a more intentional move into a neighboring card's left side before crossing to that card's leading edge. Editor assets are at `v=64`.

## Phase 4H-I-J v9 category drag symmetric threshold tuning — 2026-05-16

Category-specific image ordering keeps the v6 single-placeholder drag model and the later press/hold, ghost-card, and short-click navigation behavior. After v8 testing, right-side placement still felt more sensitive than left-side placement because the placeholder could remain or move to the right side of a target card with only a small overlap. Phase 4H-I-J v9 moves the before/after thresholds closer to the visual midpoint of the target card so left and right placement feel more symmetrical. Editor assets are at `v=65`.

