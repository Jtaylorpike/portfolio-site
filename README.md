# Photography Portfolio Site

A Vite + TypeScript photography portfolio with a traditional responsive portfolio as the primary experience and a desktop-only Three.js virtual gallery as an enhanced viewing mode.

The current project is plain TypeScript. It is not a React project.

## Current architecture

```text
index.html
src/
  app/                 Site routing, page rendering, interactions, and gallery overlay controller
  data/                Editable portfolio/category/hero data imported at build time
  gallery/             Three.js virtual gallery scene, movement, layout, materials, and textures
  styles/              Global site styles
local-editor/          Local Flask-based image/data editor
scripts/               Utility scripts for image download and optimization
public/                Static runtime assets served by Vite
```


## Visual direction

The active visual direction is a dark editorial/gallery-index system rather than a generic photography template. The homepage should feel like the entry point to the virtual gallery: large cinematic imagery, a vertical numbered slide index, a contact-sheet thumbnail strip, small metadata panels, thin guide lines, and restrained interface details.

The design should stay photography-first. Photographs should render cleanly and should not be pixelated or stylized by default. Experimental/game-like cues should live in the interface system, gallery environment, navigation, loading states, map/index patterns, and future theme modes.

The current logo image is intentionally not used in the public header or entry page. The active header uses a text lockup so the logo can be reintroduced later without blocking the current visual direction.

Future design work should allow alternate creative presentation modes. A planned later project is a full-site late-1990s/early-2000s theme toggle. Do not hardcode visual decisions in a way that prevents future theme switching; prefer reusable design tokens, route/page classes, and mode-friendly UI structure.


## Homepage hero rules

The homepage hero is locked to a landscape 16:9 editorial frame. Hero images always use cover/crop behavior, and the only image-specific hero composition control should be crop position (`heroPosition`). Portrait and square images should not be added to `src/data/heroSlides.json` through the editor.

The hero should prioritize the image over large branding text. The header already identifies the site, so the hero copy should behave like a compact editorial caption or archive statement. The current preferred statement is: `A visual archive of movement, space, and imagination.`

The secondary interface typeface uses the optional local VCR-style font path:

```text
public/fonts/VCR_OSD_MONO_1.001.ttf
```

The font file is not included in replacement packs. Add the licensed font file locally at that path when you want the secondary interface typography to render. The VCR face should be used for small labels, counters, metadata, index rails, gallery HUD text, and editor/status UI, while the primary sans-serif remains responsible for body copy and major headings. Without the font file, the site falls back to system monospace.

VCR-style pixel fonts have rough optical metrics at small sizes. Interface labels using the VCR face should use conservative tracking, controlled line-height, and restrained sizing. If a long text label still looks uneven, keep VCR for the surrounding counters/interface elements and move that specific long label back to the primary sans-serif instead of forcing the pixel face everywhere.

## Runtime behavior

The traditional portfolio is the stable public-facing site. It supports these hash routes:

```text
#/home
#/portfolio
#/portfolio/:category
#/about
#/editor
```

The virtual gallery is loaded only when opened. The controller lazy-loads Three.js scene code, preloads gallery textures, blocks mobile/touch devices with a fallback message, and keeps the traditional portfolio as the accessible baseline.

The gallery currently supports:

- Desktop-only fullscreen overlay.
- Enclosed architectural room shell with perimeter walls, ceiling, room base trim, and ceiling light-panel geometry.
- Subtle procedural floor texture and perimeter floor-shadow strips to reduce the blank-platform feeling without adding external texture assets.
- Pointer-lock mouse look.
- WASD and arrow-key movement.
- Escape-to-exit behavior.
- Wall collision and boundary clamping, with movement bounds set close to the inner room-shell faces.
- Center-ray artwork focus with metadata panel updates, image counters, and a restrained HUD.
- Preview-to-high-resolution texture replacement.
- Orientation-aware artwork framing with shallow frame depth so images read more like mounted work than flat decals.

## Data model

Primary editable data lives in:

```text
src/data/categories.json
src/data/galleryImages.json
src/data/heroSlides.json
src/data/images.ts
```

`src/data/images.ts` imports the JSON records and exposes shared types and runtime image data for the traditional portfolio, hero slideshow, and virtual gallery.

`public/data/gallery.json` and `public/data/projects.json` are legacy or secondary exported data unless active source code is changed to consume them directly.

## Virtual gallery source files

```text
src/gallery/GalleryScene.ts
src/gallery/artwork/galleryFraming.ts
src/gallery/artwork/galleryLayout.ts
src/gallery/artwork/galleryTextureLoader.ts
src/gallery/environment/galleryBlueprint.ts
src/gallery/environment/galleryLighting.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/controls/lookController.ts
src/gallery/controls/movementController.ts
```

`galleryBlueprint.ts` is the top-down layout source for floor size, room shell dimensions, ceiling light-panel placement, wall blocks, artwork sizes, start position, and movement bounds.

`galleryLayout.ts` resolves the blueprint into scene-ready walls and artwork placements.

`GalleryScene.ts` owns renderer setup, camera setup, scene composition, focus raycasting, animation, resize handling, and cleanup.


### Virtual gallery direction

The gallery should continue moving toward a realistic architectural room rather than a floating platform. Room-scale elements such as perimeter walls, ceiling, trim, lighting tracks, surface materials, and movement bounds should remain data-driven where possible so the future local/server-side gallery editor can expose them as editable settings instead of hardcoded scene decoration. Visual realism should come from quiet architectural detail, material scale, and better lighting rather than novelty effects that compete with the images. Fog is intentionally off by default; if performance-constrained clients eventually need a lower-quality rendering mode, atmospheric masking should be added as an explicit quality setting rather than as permanent gallery styling. The gallery HUD should stay quiet and editorial: minimal top bar, compact control reference, center reticle, and metadata only when the viewer is focused on an artwork.

## Local editor

The local editor is a Flask tool under `local-editor/`. It is intended for local content management and image metadata work, not public production hosting.

Typical use:

```bash
cd local-editor
python editor.py
```

Use the editor only against a local working copy. Commit or back up data files after meaningful content changes.

## Development commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Packaging for future handoff

Use the chat upload script to create a clean project package before moving work into another chat.

Recommended upload order:

1. Transfer kit or latest handoff summary.
2. The generated `TaylorPikePortfolio-ChatUpload-[timestamp].zip`.
3. Original/full image pack only when image reprocessing is required.

Do not upload `node_modules`, `dist`, browser profiles, generated old replacement packs, Python cache folders, or backup artifacts unless they are specifically relevant to the task.

## Source-of-truth rule

Current uploaded project files override older summaries and handoffs. Handoff documents are project memory backups, not proof of the active implementation. When there is a conflict, inspect the active source files first.
