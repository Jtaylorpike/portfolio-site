# Pack Notes — Phase 8C Gallery Load Recovery Hotfix

Date: 2026-05-18

## Purpose

Recover from the reported Phase 8B regression where the virtual gallery no longer loaded.

## Pack format

This pack is root-relative. Copy or extract the zip contents directly into the project root and overwrite matching paths.

The zip root intentionally contains project paths directly, such as:

```text
src/
docs/
PROJECT_CHANGELOG.md
```

It does not contain `source/`, `01-source/`, `updated-files/`, or a root-level README/phase document.

## Runtime changes

- Replaces `src/gallery/GalleryScene.ts` with the pre-Phase-8B scene-construction flow.
- Removes the Phase 8B experimental per-artwork contact-shadow mesh wiring.
- Removes the now-unused contact-shadow material helper from `src/gallery/environment/galleryMaterials.ts`.
- Keeps Phase 8B deterministic procedural materials and warmer lower-cost lighting balance.

## Non-changes

No changes to:

- room footprint;
- wall placement;
- collision behavior;
- plaque fallback behavior;
- gallery curation/editor logic;
- mobile controls;
- image assets;
- data schemas;
- routing;
- public copy;
- favicon/logo/social previews;
- dependencies.

## Validation

- `npm run build`
- static check that `GalleryScene.ts` no longer contains `contactShadow` wiring
- static check that `galleryMaterials.ts` no longer exports `createArtworkContactShadowMaterial`
- root-relative pack structure check
- `unzip -t`

## Manual test after applying

Open the site locally and confirm that the virtual gallery opens from the normal gallery entry trigger. Because this sandbox blocks Chromium navigation to local server URLs, the local browser smoke test could not be completed here.
