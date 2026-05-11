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
- Pointer-lock mouse look.
- WASD and arrow-key movement.
- Escape-to-exit behavior.
- Wall collision and boundary clamping.
- Center-ray artwork focus with metadata panel updates.
- Preview-to-high-resolution texture replacement.
- Orientation-aware artwork framing.

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

`galleryBlueprint.ts` is the top-down layout source for floor size, wall blocks, artwork sizes, start position, and movement bounds.

`galleryLayout.ts` resolves the blueprint into scene-ready walls and artwork placements.

`GalleryScene.ts` owns renderer setup, camera setup, scene composition, focus raycasting, animation, resize handling, and cleanup.

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
