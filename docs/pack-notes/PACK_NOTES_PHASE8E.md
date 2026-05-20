# Pack Notes — Phase 8E Gallery Surface Tone Correction

## Pack format

This is a root-relative replacement pack. Copy/extract the zip contents directly into the project root and overwrite matching paths.

The zip root contains changed project paths directly. It does not use `source/`, `01-source/`, `updated-files/`, or any other wrapper folder. It does not include a phase README at the zip root.

## Why this pack exists

After Phase 8C restored gallery access, the user provided a screenshot showing that the most visible Phase 8 runtime change was an unappealing darker tone across the top of the walls. Phase 8E removes the wall/ceiling texture-map treatment that caused the cap/banding issue.

## Changed files

```text
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8E_GALLERY_SURFACE_TONE_CORRECTION.md
docs/pack-notes/PACK_NOTES_PHASE8E.md
docs/pack-manifests/PACK_MANIFEST_PHASE8E.txt
PROJECT_CHANGELOG.md
```

## Runtime summary

- Removes procedural wall texture maps.
- Removes procedural ceiling texture maps.
- Keeps deterministic floor texture.
- Keeps deterministic paper/mat texture.
- Adjusts lighting balance slightly to reduce muddy upper-room tone.
- Keeps the gallery low-cost: no dynamic shadow maps, no post-processing, no dependencies, and no external image assets.

## Explicit non-changes

This pack does not change:

- `src/gallery/GalleryScene.ts`;
- room footprint;
- wall placement;
- collision behavior;
- plaque fallback logic;
- gallery curation/editor logic;
- mobile controls;
- image assets;
- routing;
- public copy;
- logo/favicon/social previews.

## Validation

Completed before packaging:

```text
npm run build
```

Static checks completed:

```text
No shadowMap, castShadow, or receiveShadow usage added.
No root wrapper folder in the zip.
No root-level phase README in the zip.
```
