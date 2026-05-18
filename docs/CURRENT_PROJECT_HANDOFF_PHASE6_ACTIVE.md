# Taylor Pike Portfolio — Phase 6 Active Handoff

Updated: 2026-05-18

## Active phase

**Phase 6: Mobile 3D gallery controls is active.**

Phase 5 About/contact redesign is complete/closed with Phase 5K. Final About copy, final About image curation, and final gallery curation are deferred pre-launch content tasks and should not block Phase 6.

## Phase 6A baseline

Phase 6A adds the first functional mobile/touch-control baseline for the public Three.js gallery.

Implemented behavior:

- touch/coarse devices now open the real virtual gallery instead of the old desktop-only fallback message;
- the gallery chooses `desktop` or `touch` input mode when opened;
- touch mode displays a restrained left thumb movement pad;
- the movement pad feeds analog local X/Z movement into the existing collision-aware movement controller;
- touch mode supports drag-to-look directly on the gallery canvas;
- desktop pointer-lock mouse look and WASD/arrow movement remain intact;
- touch-mode CSS keeps the controls quiet, archive-like, and separate from public site typography changes;
- the artwork info panel is repositioned in touch mode to reduce conflict with bottom controls.



## Phase 6B polish baseline

Phase 6B refines the mobile/touch-control baseline for dev-preview real-device testing.

Implemented behavior:

- touch hint wording is simplified to `Drag to look · left thumb to move`;
- touch UI tracks first look/move use and fades the instructional hint after interaction;
- movement pad sizing and visual weight are reduced slightly;
- touch controls use safer safe-area-aware spacing;
- artwork info panel height is capped in touch mode and long notes are clamped;
- touch-mode crosshair is less dominant;
- compact landscape-phone safeguards are added;
- touch look sensitivity is reduced and large deltas are clamped to avoid camera jumps;
- touch analog movement uses a dead zone and response curve to reduce drift/jitter;
- touch movement speed is slightly reduced without affecting desktop movement.



## Phase 6C gallery metadata cleanup

Phase 6C simplifies viewer-facing metadata in the public Three.js gallery.

Implemented behavior:

- plaques no longer show internal wall type labels such as `Standard display wall`;
- bottom-right artwork info cards no longer show internal wall type labels;
- plaques and info cards now share the same public metadata formatter;
- public metadata uses curated display order, category, and year/archive status;
- wall type data remains intact for layout, scale, editor filtering, and placement logic.



## Phase 6D local editor image-card save hotfix

Phase 6D fixes a local-editor regression/UX mismatch reported during Phase 6: the lower **Save JSON** button at the bottom of an individual image editor page did not reliably persist metadata edits, while the top **Save Changes** button did.

Implemented behavior:

- the lower image-card **Save JSON** button now uses a dedicated card-scoped payload builder;
- the save payload replaces only the open image record in the current image array;
- hero-slide membership for that image is preserved, added, or removed based on the open card controls;
- categories, About photos, and About copy are preserved from current editor state/current page collectors;
- the top global **Save Changes** behavior remains unchanged;
- the editor cache version is bumped to `v=73`.

## Files touched in Phase 6A

```text
src/app/galleryController.ts
src/app/renderSite.ts
src/gallery/GalleryScene.ts
src/gallery/controls/lookController.ts
src/gallery/controls/movementController.ts
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6A_MOBILE_GALLERY_TOUCH_CONTROLS.md
docs/pack-notes/PACK_NOTES_PHASE6A.md
docs/pack-manifests/PACK_MANIFEST_PHASE6A.txt
PROJECT_CHANGELOG.md
```

## Files touched in Phase 6B

```text
src/app/galleryController.ts
src/app/renderSite.ts
src/gallery/controls/lookController.ts
src/gallery/controls/movementController.ts
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6B_MOBILE_GALLERY_POLISH.md
docs/pack-notes/PACK_NOTES_PHASE6B.md
docs/pack-manifests/PACK_MANIFEST_PHASE6B.txt
PROJECT_CHANGELOG.md
```



## Files touched in Phase 6C

```text
src/gallery/artwork/galleryLayout.ts
src/gallery/GalleryScene.ts
src/app/galleryController.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6C_GALLERY_METADATA_SIMPLIFICATION.md
docs/pack-notes/PACK_NOTES_PHASE6C.md
docs/pack-manifests/PACK_MANIFEST_PHASE6C.txt
PROJECT_CHANGELOG.md
```



## Files touched in Phase 6D

```text
local-editor/static/js/collect.js
local-editor/static/js/main.js
local-editor/templates/editor.html
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6D_EDITOR_IMAGE_CARD_SAVE_FIX.md
docs/pack-notes/PACK_NOTES_PHASE6D.md
docs/pack-manifests/PACK_MANIFEST_PHASE6D.txt
PROJECT_CHANGELOG.md
```

## Important constraints

- Do not redesign the public site broadly while tuning mobile gallery controls.
- Preserve existing gallery curation data, artwork placement, wall collision, plaque fallback, lighting, and material behavior unless the user explicitly asks to modify them.
- Treat Phase 6A/6B as the current mobile interaction baseline. Real-device review from a dev preview is still expected before considering Phase 6 complete.
- Treat Phase 6D as a local-editor hotfix only; it should not change public gallery runtime behavior.
- Keep internal wall type labels out of public gallery plaques and artwork info cards unless the user later asks to expose them again.
- Keep controls restrained and professional. Avoid game-like decorative UI beyond what is required for touch usability.

## Recommended next QA

After applying Phase 6A, Phase 6B, and Phase 6C, push to the `dev` branch and test on a real phone or tablet:

1. Open the virtual gallery from the nav or homepage CTA.
2. Confirm the old desktop-only fallback does not appear.
3. Use the left thumb pad to move forward/backward/strafe.
4. Drag on the main gallery canvas to look around.
5. Confirm the Exit button remains usable.
6. Confirm the artwork info panel does not sit under the thumb control.
7. Confirm public gallery plaques and bottom-right cards do not show wall type labels.
8. Note whether movement speed, look sensitivity, landscape behavior, or control placement needs tuning.
9. In the local editor, open one image, edit a metadata field, click the lower image-card **Save JSON** button, reload data, and confirm the change persisted.
