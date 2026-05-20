# Phase 8D — Gallery Runtime Recovery Rollback

Date: 2026-05-18

## Purpose

Phase 8D responds to the user report that the virtual gallery still could not be accessed after Phase 8C.

Phase 8B introduced runtime materials, lighting, and static baked-style contact-shadow geometry. Phase 8C removed the contact-shadow scene wiring, but the gallery still failed to open. Phase 8D therefore stops trying to preserve the Phase 8B runtime implementation and restores the gallery runtime environment files to the last known working Phase 8A baseline.

## Runtime files restored from the uploaded Phase 8A source

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
```

## Intentional non-scope

Phase 8D does not change:

- room footprint;
- wall placement;
- movement or collision behavior;
- plaque placement or fallback logic;
- gallery curation data;
- local editor behavior;
- mobile gallery controls;
- hash routing;
- SEO files;
- public copy;
- favicon, logo, app icon, or social preview assets;
- image assets;
- dependencies.

## Phase 8 implementation rule after this rollback

Do not reintroduce material, lighting, shadow, occlusion, renderer, or scene-construction changes until the user confirms the gallery opens after Phase 8D.

Once confirmed, restart Phase 8 implementation with smaller isolated steps. The next safest runtime implementation should be lighting-only first, followed by separate material-only changes. Avoid baked/contact-shadow geometry until the load baseline is proven stable.
