# Taylor Pike Portfolio — Phase 6 Complete Handoff

Updated: 2026-05-18

## Closed phase

**Phase 6: Mobile 3D gallery controls is complete/closed as of Phase 6J.**

Phase 6A through Phase 6I implemented the mobile gallery controls, phone-specific homepage/route hardening, metadata cleanup, and one narrow editor save hotfix discovered during the phase. Phase 6J is a docs-only closeout pack. No runtime code was changed in Phase 6J.

Phase 5 About/contact redesign remains complete/closed with Phase 5K. Final About copy, final About image curation, final gallery curation, final public image count, and final launch copy are deferred pre-launch content tasks and should not be treated as missing Phase 6 work.

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



## Phase 6E mobile responsiveness tuning

Phase 6E lightly increases touch-control responsiveness after real-phone testing confirmed the controls work but feel slightly under-sensitive.

Implemented behavior:

- touch drag-look sensitivity is increased from the Phase 6B restrained baseline;
- touch look delta clamping is loosened slightly so intentional swipes can rotate the camera more quickly;
- touch-only movement speed is increased without affecting desktop WASD/arrow movement;
- the analog thumb dead zone is reduced so movement starts with less thumb travel;
- the analog response curve is made closer to linear for a more immediate feel;
- the movement pad's effective vector radius is slightly reduced so the same thumb travel produces a stronger movement vector.



## Phase 6F camera balance and horizontal-phone homepage guard

Phase 6F adjusts two issues found after Phase 6E phone testing.

Implemented behavior:

- touch camera sensitivity is reduced from the Phase 6E value while remaining more responsive than the Phase 6B baseline;
- touch camera delta clamping is pulled back slightly from Phase 6E to reduce accidental jumps;
- Phase 6E movement tuning is preserved because the movement feel was not the reported problem;
- the homepage gets a targeted short landscape-phone media query;
- horizontal phones use a compact, image-first hero layout with a small index rail, hidden thumbnails, hidden meta panel, and simplified header/nav spacing;
- the desktop homepage, normal portrait-phone homepage, portfolio pages, About page, editor, gallery curation data, plaques, and wall behavior are unchanged.


## Phase 6G horizontal-phone homepage hero correction

Phase 6G refines the Phase 6F landscape-phone homepage guard after real-device testing showed the hero image being partially covered by the copy-panel overlay on horizontal phones.

Implemented behavior:

- the short landscape-phone homepage hero image now fills the available hero stage width;
- the hero image shell uses a fixed short landscape height instead of recalculating a narrower 16:9 box inside the stage;
- the hero copy panel is hidden in this specific short landscape-phone mode so its dark overlay no longer cuts into the photo;
- the compact vertical index rail, simplified header/nav, hidden thumbnails, hidden meta panel, and hidden statement/actions from Phase 6F are preserved;
- desktop, tablet, portrait-phone homepage, mobile gallery controls, editor behavior, gallery curation data, plaques, and About/contact behavior are unchanged.

## Phase 6H Pixel-class horizontal-phone homepage guard

Phase 6H fixes the Pixel 9 Pro XL horizontal-phone homepage issue reported after Phase 6G. The previous short landscape-phone layout used a max-width breakpoint that can miss wide CSS mobile viewports, so the desktop homepage layout could still appear on a real phone held horizontally.

Implemented behavior:

- the compact landscape-phone homepage guard now covers wider short mobile viewports up to 1080px CSS width;
- Pixel-class horizontal phones use the same image-first home hero instead of the dense desktop metadata/thumbnail layout;
- the public homepage hides the meta panel, thumbnail strip, copy panel, statement/actions, and rail label in this specific short landscape mode;
- the hero image fills the available stage and uses cover fitting in this mode;
- the header/nav are tightened and the brand descriptor is hidden only for this short landscape-phone layout;
- mobile gallery controls, camera sensitivity, movement tuning, editor behavior, gallery data, About/contact behavior, desktop homepage, portrait-phone homepage, and normal tablet/desktop layouts are unchanged.


## Phase 6I mobile route and touch hardening

Phase 6I is a focused mobile follow-up after the Pixel 9 Pro XL horizontal homepage fix was confirmed functional.

Implemented behavior:

- short landscape-phone public shell styling now applies to Portfolio and About routes instead of only the homepage;
- Portfolio route switches to a compact horizontal category rail and tighter heading/grid spacing on wide, short phone viewports;
- About route uses tighter vertical spacing, smaller heading/copy scale, and less dominant background-float opacity on wide, short phone viewports;
- fullscreen gallery overlay gets additional touch-callout and overscroll guards;
- active touch movement/look state is cleared on window blur, page hide, document visibility loss, orientation change, touch-mode resize, and gallery destroy;
- Phase 6F camera sensitivity and Phase 6E movement responsiveness remain unchanged.

## Phase 6J closeout

Phase 6J closes the mobile gallery phase after the user confirmed the Phase 6I route/touch hardening was working.

Closeout state:

- mobile gallery controls are considered accepted unless a specific device issue appears later;
- Phase 6E movement responsiveness remains the accepted touch movement baseline;
- Phase 6F camera sensitivity remains the accepted touch camera baseline;
- Phase 6H is the accepted Pixel-class horizontal-phone homepage guard;
- Phase 6I is the accepted short-landscape route/touch-interruption hardening baseline;
- future mobile changes should be issue-driven rather than treated as open Phase 6 scope;
- next recommended phase is Phase 7 SEO/discoverability and launch-readiness infrastructure.


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

## Files touched in Phase 6E

```text
src/app/galleryController.ts
src/gallery/controls/lookController.ts
src/gallery/controls/movementController.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6E_MOBILE_GALLERY_RESPONSIVENESS_TUNING.md
docs/pack-notes/PACK_NOTES_PHASE6E.md
docs/pack-manifests/PACK_MANIFEST_PHASE6E.txt
PROJECT_CHANGELOG.md
```


## Files touched in Phase 6F

```text
src/gallery/controls/lookController.ts
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6F_MOBILE_CAMERA_AND_LANDSCAPE_HOME_TUNING.md
docs/pack-notes/PACK_NOTES_PHASE6F.md
docs/pack-manifests/PACK_MANIFEST_PHASE6F.txt
PROJECT_CHANGELOG.md
```

## Files touched in Phase 6G

```text
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6G_HORIZONTAL_PHONE_HOMEPAGE_HERO_FIX.md
docs/pack-notes/PACK_NOTES_PHASE6G.md
docs/pack-manifests/PACK_MANIFEST_PHASE6G.txt
PROJECT_CHANGELOG.md
```

## Files touched in Phase 6H

```text
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6H_PIXEL_LANDSCAPE_HOME_FIX.md
docs/pack-notes/PACK_NOTES_PHASE6H.md
docs/pack-manifests/PACK_MANIFEST_PHASE6H.txt
PROJECT_CHANGELOG.md
```

## Important constraints

- Do not redesign the public site broadly after Phase 6 closeout unless the user identifies a specific issue.
- Preserve existing gallery curation data, artwork placement, wall collision, plaque fallback, lighting, and material behavior unless the user explicitly asks to modify them.
- Treat Phase 6E movement responsiveness, Phase 6F camera sensitivity, Phase 6H Pixel-class homepage landscape guard, and Phase 6I public-route/touch-interruption hardening as the accepted mobile baseline.
- Treat Phase 6D as a local-editor hotfix only; it should not be confused with mobile gallery runtime work.
- Keep internal wall type labels out of public gallery plaques and artwork info cards unless the user later asks to expose them again.
- Keep controls restrained and professional. Avoid game-like decorative UI beyond what is required for touch usability.

## Post-closeout maintenance checklist

If a future mobile issue is reported, check these first:

1. Device and browser.
2. Portrait vs. landscape orientation.
3. Current route: Home, Portfolio, Gallery, or About.
4. Whether the issue is runtime control feel, safe-area spacing, overlay placement, or public-page layout.
5. Whether active movement/look state persists after orientation changes, app switching, lock/unlock, or browser tab changes.
6. Whether the issue reproduces on the deployed `dev` preview and on `main`.

## Files touched in Phase 6I

```text
src/app/galleryController.ts
src/gallery/GalleryScene.ts
src/gallery/controls/lookController.ts
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6I_MOBILE_ROUTE_AND_TOUCH_HARDENING.md
docs/pack-notes/PACK_NOTES_PHASE6I.md
docs/pack-manifests/PACK_MANIFEST_PHASE6I.txt
PROJECT_CHANGELOG.md
```

## Files touched in Phase 6J

```text
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6J_MOBILE_GALLERY_CLOSEOUT.md
docs/pack-notes/PACK_NOTES_PHASE6J.md
docs/pack-manifests/PACK_MANIFEST_PHASE6J.txt
PROJECT_CHANGELOG.md
```
