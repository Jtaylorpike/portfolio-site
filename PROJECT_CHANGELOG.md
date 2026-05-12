# Taylor Pike Portfolio Project Changelog

This file records meaningful design, architecture, data, editor, and gallery changes made during development.

Current source files remain the source of truth. This changelog is a historical record.

---

## 2026-05-11 — GitHub Pages deployment foundation

### Changed
- Added a GitHub Actions workflow for deploying the built Vite site to GitHub Pages.
- Updated `vite.config.ts` so GitHub Pages builds use the `/portfolio-site/` base path while local development continues to use `/`.
- Configured the workflow to run on pushes to `main` and manual dispatch from the Actions tab.
- Configured the workflow to build with `npm ci` and `npm run build`, then upload `dist` to GitHub Pages.

### Files changed
- `.github/workflows/deploy-pages.yml`
- `vite.config.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- This assumes the repository will be published at `https://Jtaylorpike.github.io/portfolio-site/`.
- If a custom domain is added later, the Vite base path should be changed back to `/` for production.

---

## 2026-05-11 — Corrected plaque readability and Exit typography fix

### Changed
- Reverted the accidental plaque width increase from the previous pack.
- Increased only plaque height and plaque typography scale to improve readability.
- Preserved the accepted plaque width, right-side placement, spacing, and true flush wall alignment.
- Replaced the gallery Exit button CSS block directly so it no longer uses the VCR/interface font.
- Added a defensive CSS override to keep the Exit button on a normal system sans font.

### Files changed
- `src/gallery/GalleryScene.ts`
- `src/styles/global.css`
- `PROJECT_CHANGELOG.md`

### Notes
- The previous pack made the plaque physically too wide and did not actually patch the `.gallery-close` block. This pack corrects both issues directly.

---

## 2026-05-11 — Gallery plaque readability and Exit button typography fix

### Changed
- Increased plaque physical size, especially height, so the label has enough room to be read at normal gallery distance.
- Increased plaque texture resolution and significantly increased plaque text size.
- Strengthened plaque text and border contrast.
- Preserved the true flush wall alignment from the previous pass.
- Changed the gallery Exit button away from the VCR/interface font so the `X` no longer renders with the broken glyph shape.

### Files changed
- `src/gallery/GalleryScene.ts`
- `src/styles/global.css`
- `PROJECT_CHANGELOG.md`

### Notes
- This pass prioritizes actual legibility rather than only improving the texture. The plaque block is now physically larger because the prior world-space plaque was too small to read clearly even with larger texture text.

---

## 2026-05-11 — Gallery plaque readability pass

### Changed
- Increased plaque height slightly to create more room for the typography.
- Increased plaque texture height and text sizes for better legibility.
- Strengthened text contrast and slightly increased texture anisotropy for a crisper plaque face.
- Kept the true flush wall alignment and overall plaque form unchanged.

### Files changed
- `src/gallery/GalleryScene.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- This pass is strictly about readability. The flush wall behavior, plaque depth, spacing, and overall trim-like form remain intact.

---

## 2026-05-11 — Gallery plaque true flush alignment fix

### Changed
- Corrected plaque placement so the plaque rear face now sits directly on the wall plane instead of hovering slightly in front of it.
- Switched plaque depth positioning to derive from the wall-surface offset used by `galleryLayout` rather than from the artwork frame position.
- Preserved the improved plaque proportions, right-side placement, and landscape spacing from the previous pass.

### Files changed
- `src/gallery/GalleryScene.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- The previous pass made the plaque visually closer to the wall, but it was still inheriting part of the artwork/frame forward offset. This pass aligns the plaque directly to the wall surface itself, matching the intended trim-like behavior more closely.

---

## 2026-05-11 — Gallery plaque flush-wall pass and landscape spacing refinement

### Changed
- Reduced landscape frame sizing in the shared gallery framing rules to create more negative space around landscape pieces.
- Reduced plaque depth and moved the plaque back so its rear face sits almost flush with the wall, closer to how the trim behaves.
- Tightened plaque proportions so it reads more like a slim wall-mounted trim/detail element.
- Increased safe margins around plaques so there is more breathing room between the plaque, the frame, and the wall edge.
- Refined plaque typography and texture proportions for better readability without making the plaque visually heavier.

### Files changed
- `src/gallery/artwork/galleryFraming.ts`
- `src/gallery/GalleryScene.ts`
- `src/gallery/environment/galleryMaterials.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- This pass prioritizes form and physical behavior first: flush wall mounting, better spacing, and calmer proportions. Readability was improved, but it remains secondary to getting the plaque block to behave correctly in the room.

---

## 2026-05-11 — Gallery plaque flush-mount and readability refinement

### Changed
- Converted plaques from flat cards to shallow box geometry so they read more like a rectangular trim/detail element.
- Repositioned plaques so they sit much closer to the wall surface instead of floating outward.
- Increased plaque width and texture resolution for readability.
- Strengthened plaque text contrast and typography.
- Added a dedicated plaque body material so the label has visible physical edges without looking detached from the wall.

### Files changed
- `src/gallery/GalleryScene.ts`
- `src/gallery/environment/galleryMaterials.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- The goal of this pass is not realism yet. It is to make the plaque feel like an intentional wall-mounted detail, readable at normal viewing distance, and less visually broken in oblique views.

---

## 2026-05-11 — Gallery plaque wall-integration pass

### Changed
- Returned plaques to the right side of the artwork, but made them flush-mounted within the wall presentation instead of floating outward.
- Added `wallWidth` to resolved gallery artwork metadata so plaque placement can be clamped within the available wall face.
- Increased plaque readability with a slightly larger plaque size and stronger text contrast.
- Kept plaques aligned to the wall plane to prevent the worst clipping behavior seen in the previous side-mounted pass.

### Files changed
- `src/gallery/artwork/galleryLayout.ts`
- `src/gallery/GalleryScene.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- This preserves the more logical right-side plaque placement while making the plaque behave like a wall-integrated label rather than a floating card. Future editor work can keep using this metadata foundation.

---

## 2026-05-11 — Gallery plaque placement correction

### Changed
- Moved artwork plaques from side-mounted placement to centered-under-artwork placement.
- Reduced plaque size and visual brightness.
- Kept plaque geometry in the same wall plane as the artwork to prevent labels from clipping through nearby wall/corner geometry.
- Kept `plaqueSide` as an editor-facing field, but the current renderer ignores side placement until the gallery layout supports it cleanly.

### Files changed
- `src/gallery/GalleryScene.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- The first plaque pass proved that side-mounted labels are too likely to intersect nearby wall geometry in the current modular room layout. Under-artwork plaques are a safer exhibition pattern until the future editor can validate available wall clearance.

---

## 2026-05-11 — Gallery plaque and metadata foundation

### Changed
- Added subtle data-driven artwork plaques beside gallery photos.
- Added future editor-facing gallery metadata fields: `showInGallery`, `displayOrder`, `wallSection`, `plaqueEnabled`, and `plaqueSide`.
- Added deterministic wall-section and plaque-side inference so existing wall blocks do not need to be manually rewritten.
- Updated the gallery metadata panel to include display order and wall section.
- Kept plaques lightweight and texture-based without fake shadow planes or new lighting tricks.

### Files changed
- `src/gallery/environment/galleryBlueprint.ts`
- `src/gallery/artwork/galleryLayout.ts`
- `src/gallery/environment/galleryMaterials.ts`
- `src/gallery/GalleryScene.ts`
- `src/app/galleryController.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- This creates a practical bridge between the current hand-authored gallery layout and the future local/server-side editor. The editor can later expose these same fields instead of requiring hardcoded scene changes.

---

## 2026-05-11 — Hero scroll-wheel hit-test fix

### Changed
- Changed hero carousel wheel handling from document-level target matching to window-level capture handling.
- Added composed-path and cursor-coordinate hit testing so wheel zones are recognized even when child layers or overlay geometry receive the event target.
- Removed the controller-bound gate from wheel-zone detection so the wheel handler can resolve the slideshow directly from the DOM.
- Normalized wheel deltas across mouse wheels and trackpads so slide changes should trigger reliably.
- Preserved normal page scrolling outside the hero wheel zones.
- Re-included the current homepage markup with `Scroll wheel or use arrow keys` and the explicit hero wheel-zone attributes.

### Files changed
- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `src/styles/global.css`
- `PROJECT_CHANGELOG.md`

### Notes
- This should correct the prior state where wheel events still behaved like normal page scrolls and did not advance the hero carousel.

---

## 2026-05-11 — Hero scroll-wheel prevention fix

### Changed
- Moved hero carousel wheel handling to a document-level capture listener with `passive: false`.
- Prevented default page scrolling before wheel events inside hero wheel zones can propagate into normal browser scrolling.
- Kept wheel-zone behavior limited to the visual index rail, main hero image, and thumbnail strip.
- Left wheel events outside those zones available for normal page scrolling.

### Files changed
- `src/app/siteInteractionsController.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- This corrects the previous implementation where wheel navigation could change slides but still allow the page to scroll.

---

## 2026-05-11 — Hero scroll-wheel zone refinement

### Changed
- Changed the homepage hero rail hint from `Wheel or use arrow keys` to `Scroll wheel or use arrow keys`.
- Scoped scroll-wheel hero navigation to explicit carousel zones only: the visual index rail, the main hero image shell, and the thumbnail strip.
- Allowed normal page scrolling when the pointer is outside those hero carousel zones, including over the copy/actions area, metadata panel, or general page background.
- Prevented page scroll while the pointer is inside a carousel wheel zone so wheel input cleanly changes hero images instead of half-scrolling the page.

### Files changed
- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- This keeps the scroll-wheel carousel behavior, but makes it location-aware so the page still scrolls naturally when the cursor is not over the image/index/thumbnail controls.

---

## 2026-05-11 — Homepage hero interaction and metadata polish

### Changed
- Added wheel navigation to the homepage hero carousel so the left-side instruction now describes a real supported input.
- Changed the left-side hero instruction from `Scroll or use arrow keys` to `Wheel or use arrow keys`.
- Updated hero metadata so missing image years no longer render as `Year / Archive`; missing years now render as `Status / Archive`.
- Preserved the direct hero image swap behavior, fixed 16:9 landscape hero frame, and thumbnail-matched brightness treatment.

### Files changed
- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- Wheel input is only bound to the hero slideshow region and uses a small accumulation threshold so minor trackpad movement does not immediately fire repeated slide changes.

---

## 2026-05-11 — Hero image brightness parity and gallery shadow removal

### Changed
- Matched the main homepage hero image treatment to the active thumbnail treatment by removing the image-wide dark overlay and using the same image filter.
- Added text-shadow support to the hero copy so text remains readable without darkening the entire photograph.
- Removed the artificial artwork shadow planes and their generated shadow texture/material from the virtual gallery.
- Cleaned up the controls-card fade CSS so the controls panel uses one slower, softer opacity/translate transition.
- Kept the controls-card dismissal rule requiring mouse movement plus at least two distinct movement directions.

### Files changed
- `src/styles/global.css`
- `src/app/galleryController.ts`
- `src/gallery/GalleryScene.ts`
- `src/gallery/environment/galleryMaterials.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- The gallery should stay free of fake shadow/backdrop planes until a real lighting/material pass is ready.
- The hero image should now visually match the brightness of the active thumbnail more closely.

---

## 2026-05-11 — Gallery fake-shadow rollback, control fade, and hero brightness adjustment

### Changed
- Removed the artificial artwork shadow/backdrop treatment because it did not match the current gallery lighting model.
- Kept the bottom-left controls panel but changed its dismissal rule to require mouse movement plus at least two distinct movement directions from forward, backward, left, and right.
- Added a slower staged fade/blur dismissal for the controls panel.
- Brightened the homepage hero image treatment by reducing the dark overlay and increasing hero image brightness.
- Preserved the simpler gallery UI rollback direction.

### Files changed
- `src/app/renderSite.ts`
- `src/app/galleryController.ts`
- `src/styles/global.css`
- `src/gallery/GalleryScene.ts`
- `src/gallery/environment/galleryMaterials.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- Real artwork shadows should wait until the gallery has a better physical lighting/material strategy, likely with proper light placement, texture work, and a more intentional shadow model.

---

## 2026-05-11 — Virtual gallery controls and artwork presentation polish

### Changed
- Updated the bottom-left controls card so it now dismisses only after the user has moved the mouse and used at least two distinct movement directions from the four-direction movement set.
- Softened the controls-card fade-out timing so it disappears less abruptly once the viewer understands the controls.
- Added a subtle procedural wall shadow behind framed artwork so mounted images feel more physically attached to the wall.
- Slightly tightened the frame and mat proportions so the artwork presentation reads more refined and less blocky.

### Files changed
- `src/app/renderSite.ts`
- `src/app/galleryController.ts`
- `src/styles/global.css`
- `src/gallery/GalleryScene.ts`
- `src/gallery/environment/galleryMaterials.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- This keeps the successful gallery UI rollback direction. It preserves the simple top-right Exit button and the simpler metadata panel while improving onboarding behavior and artwork mounting polish.

---

## 2026-05-11 — Virtual gallery HUD rollback and controls auto-dismiss

### Changed
- Rolled back the top-left gallery brand bar and the expanded HUD framing introduced in the previous gallery UI pass.
- Restored a cleaner top-right Exit button and a simpler bottom-right metadata panel.
- Kept the bottom-left controls card, but added logic so it automatically dismisses only after the viewer has both moved the mouse and pressed one movement key.
- Cleared metadata text when focus is lost so the panel remains empty while hidden.

### Files changed
- `src/app/renderSite.ts`
- `src/app/galleryController.ts`
- `src/styles/global.css`
- `PROJECT_CHANGELOG.md`

### Notes
- This intentionally rolls back the UI-only gallery changes while preserving the underlying architectural shell, lighting, collision tuning, and artwork placement work.

---

## 2026-05-11 — Virtual gallery haze and collision clearance correction

### Changed
- Removed the perimeter floor-edge shadow overlay strips because they were reading as lingering fog/haze near room edges.
- Kept scene fog disabled in `GalleryScene.ts`; atmospheric fog should not be part of the default gallery experience.
- Increased exterior room-shell camera clearance by tightening movement bounds from `+/-16.50` to `+/-16.30`.
- Increased interior gallery wall-block collision radius from `0.44` to `0.52` so mounted artwork and editable wall panels have more breathing room.

### Files changed
- `src/gallery/GalleryScene.ts`
- `src/gallery/environment/galleryBlueprint.ts`
- `src/gallery/controls/movementController.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- This separates three different concepts: scene fog, decorative edge shading, and collision clearance. The first two are visual rendering choices; the third is navigation safety. Fog and edge haze are now removed by default, while both exterior and interior movement buffers are more conservative.

## 2026-05-11 — Virtual gallery interior wall clearance refinement

### Changed
- Increased the collision radius around interior gallery wall blocks so the viewer maintains a little more breathing room when walking near mounted artwork and editable wall panels.
- Kept exterior room-shell movement bounds unchanged so perimeter-wall/corner clearance remains at the most recent tested value.
- Preserved the separation between exterior room bounds and future editor-controlled interior wall-block collision behavior.

### Files changed
- `src/gallery/controls/movementController.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- Interior wall clearance is controlled by `wallCollisionRadius` in `movementController.ts` and was changed from `0.36` to `0.44`. If this feels too restrictive, the next tuning value should be `0.40` or `0.42` rather than reverting the exterior room bounds.

---
## 2026-05-11 — Virtual gallery exterior wall clearance refinement

### Changed
- Tightened the exterior room-shell movement bounds slightly so the viewer cannot get quite as close to perimeter walls, corners, base trim, and shadow-strip geometry.
- Kept the exterior walls closer than the original conservative bounds, but restored enough camera clearance to avoid near-plane/clipping discomfort.
- Left interior editable wall-block collision unchanged.

### Files changed
- `src/gallery/environment/galleryBlueprint.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- This only tunes perimeter room-shell clearance. Interior gallery wall blocks remain controlled by `wallCollisionRadius` in `movementController.ts` because those blocks are part of the future editable gallery layout system.

---

## 2026-05-11 — Virtual gallery exterior-boundary separation

### Changed
- Tightened the exterior room-shell movement bounds only, moving the camera boundary slightly closer to the visible perimeter wall faces.
- Left interior gallery wall-block collision behavior unchanged.
- Added comments clarifying that perimeter-room movement bounds and editable gallery wall-block collision are separate systems.

### Files changed
- `src/gallery/environment/galleryBlueprint.ts`
- `src/gallery/controls/movementController.ts`
- `PROJECT_CHANGELOG.md`

### Notes
- This corrects the boundary refinement direction after testing: the exterior room shell needed closer camera access, but the interior gallery wall blocks should retain their existing collision feel.

---

## 2026-05-11 — Virtual gallery bounds and fog correction

### Changed
- Removed default scene fog from the virtual gallery so the room no longer visibly fades when looking across the full space.
- Expanded gallery movement bounds closer to the room-shell inner walls so the perimeter walls do not feel blocked from too far away.
- Added explanatory comments to the movement-bound values so future gallery/editor work understands how the room shell and camera buffer relate.

### Files changed
- `src/gallery/GalleryScene.ts`
- `src/gallery/environment/galleryBlueprint.ts`
- `README.md`
- `PROJECT_CHANGELOG.md`

### Notes
- Fog should stay off by default on normal-performance clients. If low-end-device support eventually needs atmospheric distance masking, it should be introduced as an explicit performance/quality setting rather than a permanent scene effect.

## 2026-05-11 — Virtual gallery material and mounting realism pass

### Changed
- Added a subtle procedural floor texture so the gallery floor has architectural material scale without requiring external texture assets.
- Added low-opacity perimeter floor-shadow strips to reduce the blank-platform feeling at the room edges.
- Added room-shell base trim around the perimeter walls to better connect the floor and walls visually.
- Changed artwork frames from flat planes to shallow box geometry so mounted images have physical depth.
- Updated cleanup logic to dispose material texture maps generated by the gallery scene.
- Documented the material/mounting direction in the README.

### Files changed
- `src/gallery/GalleryScene.ts`
- `src/gallery/environment/galleryMaterials.ts`
- `README.md`
- `PROJECT_CHANGELOG.md`

### Notes
- This is a visual realism pass only. It preserves gallery layout, artwork placement, image data, movement controls, raycast metadata behavior, homepage behavior, portfolio behavior, editor behavior, routing, and the upload workflow.

---

## 2026-05-11 — Virtual gallery lighting and metadata cleanup

### Changed
- Replaced oversized ceiling light strips with smaller recessed-style ceiling panels distributed across gallery zones.
- Reduced gallery point-light intensity and spread so lighting feels softer and less like one harsh source.
- Removed the visible placeholder metadata copy that could flash when the viewer looked away from artwork.
- Shortened the permanent gallery movement instructions so they no longer duplicate the metadata-panel behavior.
- Slightly reduced the visual weight of the gallery instruction card.

### Files changed
- `src/gallery/GalleryScene.ts`
- `src/gallery/environment/galleryBlueprint.ts`
- `src/gallery/environment/galleryLighting.ts`
- `src/gallery/environment/galleryMaterials.ts`
- `src/app/galleryController.ts`
- `src/app/renderSite.ts`
- `src/styles/global.css`
- `PROJECT_CHANGELOG.md`

### Notes
- This is a focused correction pass after the architectural shell was introduced. It does not alter artwork placement, movement controls, gallery routing, homepage behavior, portfolio lightbox behavior, editor rules, or the gallery data model.

## 2026-05-11 — Virtual gallery architectural shell pass

### Changed
- Added a data-driven gallery room shell with perimeter walls and a ceiling so the virtual gallery reads as an enclosed architectural space instead of a platform in a blank void.
- Added ceiling light-panel geometry and matching point-light placement from the gallery blueprint.
- Split gallery room shell, ceiling, and light-panel materials into dedicated material factories.
- Adjusted gallery lighting toward a softer room-based system while keeping artwork image planes unlit for clean photographic rendering.
- Documented the gallery-room direction and future editor compatibility expectations in the README.

### Files changed
- `src/gallery/GalleryScene.ts`
- `src/gallery/artwork/galleryLayout.ts`
- `src/gallery/environment/galleryBlueprint.ts`
- `src/gallery/environment/galleryLighting.ts`
- `src/gallery/environment/galleryMaterials.ts`
- `README.md`
- `PROJECT_CHANGELOG.md`

### Notes
- This is a structural gallery-environment pass, not a wall-layout redesign. Interior wall blocks, artwork placement, movement controls, routing, homepage behavior, editor hero restrictions, and portfolio lightbox behavior are unchanged.

---

## 2026-05-11 — Portfolio index and lightbox refinement

### Changed
- Added archive-style index numbers and hover/open markers to portfolio grid images.
- Tightened the portfolio heading copy around the broader creative/archive direction.
- Added previous/next navigation inside the fullscreen image lightbox.
- Added left/right keyboard navigation inside the lightbox while preserving Escape-to-close behavior.
- Added full-image fallback behavior so the lightbox can fall back to the optimized image if a `fullSrc` asset is missing.
- Escaped portfolio-grid rendered text and image attributes more consistently.

### Files changed
- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `src/styles/global.css`
- `PROJECT_CHANGELOG.md`

### Notes
- This extends the dark editorial/gallery-index visual system beyond the homepage into the traditional portfolio browsing experience without changing data, routing, hero behavior, gallery architecture, or editor rules.

---

## 2026-05-11 — Hero selected-work vertical refinement

### Changed
- Raised the `Selected Work` hero label closer to the top-left corner of the 16:9 hero image.
- Preserved the lower-left hero statement and action anchoring.
- Preserved the fixed 16:9 landscape hero system, VCR interface font scale, carousel behavior, editor hero restrictions, routing, and gallery logic.

### Files changed
- `src/styles/global.css`

### Notes
- This is a small visual alignment correction after the broader corner-anchoring pass.

---

## 2026-05-11 — Hero corner anchoring refinement

### Changed
- Moved the homepage hero copy system closer to the interior top-left and bottom-left corners of the 16:9 hero image.
- Kept `Selected Work` in the upper-left hero position.
- Kept the hero statement and action row in the lower-left position, but reduced the bottom gap so they feel more intentionally anchored to the image frame.
- Preserved the fixed 16:9 landscape hero system, VCR interface font scale, carousel behavior, editor hero restrictions, routing, and gallery logic.

### Files changed
- `src/styles/global.css`

### Notes
- This corrects the previous state where the hero copy was moving in the right direction but still felt too centered/floating inside the image.

---

## 2026-05-11 — Hero selected-work anchor refinement

### Changed
- Restored `Selected Work` to the upper-left hero position.
- Kept the hero statement lower-left to avoid crowding the top label.
- Preserved the fixed 16:9 hero system and VCR interface font scale.

### Files changed
- `src/styles/global.css`

---

## 2026-05-11 — VCR interface scale refinement

### Changed
- Standardized VCR OSD Mono as the secondary interface font.
- Increased minimum VCR label size to avoid optical misalignment.
- Reduced letter spacing for longer labels.

### Files changed
- `src/styles/global.css`
- `README.md`

---

## 2026-05-11 — Hero typography focus refinement

### Changed
- Removed the large `Taylor Pike` title from the homepage hero.
- Changed the hero statement to `A visual archive of movement, space, and imagination.`
- Kept the compact `Selected Work` label and secondary VCR interface typography.

### Files changed
- `src/app/sitePages.ts`
- `src/styles/global.css`
- `README.md`

---

## 2026-05-11 — Dark editorial homepage direction

### Changed
- Rebuilt the homepage hero around a dark editorial/gallery-index direction.
- Added a left vertical numbered slide index, bottom contact-sheet thumbnail strip, right-side metadata panel, and technical guide-line accents.
- Removed the active logo image from the header/entry experience in favor of a text lockup.
- Restyled the portfolio category navigation away from pill buttons toward an editorial index rail.

### Files changed
- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `src/styles/global.css`
- `README.md`

---

## 2026-05-11 — Gallery polish and upload tooling

### Changed
- Refined the virtual gallery layout, movement feel, materials, lighting, and metadata focus behavior.
- Added a `.cmd` launcher for the upload script to avoid Windows PowerShell signing-policy blocks.
- Updated packaging behavior to include useful runtime image folders while excluding generated/stale files.

### Files changed
- `src/gallery/environment/galleryBlueprint.ts`
- `src/gallery/GalleryScene.ts`
- `src/gallery/environment/galleryMaterials.ts`
- `src/gallery/environment/galleryLighting.ts`
- `src/gallery/controls/movementController.ts`
- `src/styles/global.css`
- `scripts/New-TaylorPikePortfolioChatUpload.ps1`
- `scripts/New-TaylorPikePortfolioChatUpload.cmd`
