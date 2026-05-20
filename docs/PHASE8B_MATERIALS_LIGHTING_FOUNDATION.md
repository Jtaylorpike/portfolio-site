# Phase 8B — Gallery Materials and Lighting Foundation

Date: 2026-05-18

## Summary

Phase 8B is the first runtime implementation pass for the 3D gallery environment phase. It follows the approved museum/private-archive direction while keeping the implementation restrained, reversible, and performance-conscious.

The pack improves room realism through deterministic procedural materials, a warmer lighting balance, and static baked-style artwork contact shadows. It does not use Three.js shadow maps, post-processing, external HDRI assets, or new image files.

Packaging note: this Phase 8B reissue is root-relative. The zip root contains changed project paths directly, so it can be copied into the project root without creating a nested `source/` or `01-source/` folder.

## Superseded runtime note

After Phase 8B, the user reported that the virtual gallery no longer loaded. Phase 8C supersedes the Phase 8B experimental static contact-shadow scene wiring by restoring the pre-Phase-8B `GalleryScene.ts` construction flow and removing the unused contact-shadow material helper. The deterministic material textures and warmer low-cost lighting balance remain part of the active Phase 8 direction.

## Implemented visual changes

- Replaced random floor grain with deterministic seeded procedural texture generation.
- Added subtle procedural wall and room-shell texture so vertical surfaces no longer read as perfectly flat digital color.
- Added subtle ceiling material texture so the room feels more enclosed without becoming visually heavy.
- Added a quiet paper-like texture to artwork mats.
- Refined frame, trim, ceiling panel, plaque-body, floor, wall, and ceiling material values.
- Adjusted lighting toward warmer ceiling-panel pools with a lower global hemisphere wash.
- Added static transparent contact-shadow planes behind framed artwork as a baked-shadow-style alternative to dynamic shadow rendering.

## Baked-shadow strategy

This pack intentionally avoids runtime shadow maps.

Instead, it uses static transparent planes behind artworks. These planes are generated once with a soft procedural shadow texture and sit nearly flush to the wall behind each frame. This gives the framed work a grounded, higher-quality contact shadow without requiring GPU shadow-map passes every frame.

This is not full lightmap baking. It is a lightweight baked-occlusion aesthetic that fits the current architecture and keeps the gallery streamlined.

## Files changed

```text
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
src/gallery/GalleryScene.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/CURRENT_PROJECT_HANDOFF_PHASE7_ACTIVE.md
docs/CURRENT_PROJECT_HANDOFF_PHASE7_CLOSEOUT.md
docs/PHASE7E_SEO_LIGHTHOUSE_CLOSEOUT.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8B_MATERIALS_LIGHTING_FOUNDATION.md
docs/pack-notes/PACK_NOTES_PHASE8B.md
docs/pack-manifests/PACK_MANIFEST_PHASE8B.txt
PROJECT_CHANGELOG.md
```

## Preserved scope

Phase 8B does not change:

- room footprint;
- wall placement;
- wall IDs;
- movement or collision behavior;
- plaque placement or collision fallback behavior;
- gallery curation data flow;
- local editor behavior;
- mobile controls;
- routing;
- SEO files;
- public copy;
- favicon/logo/social preview assets;
- image assets;
- dependencies.

## Validation

Completed:

```text
npm ci --ignore-scripts
npm run build
```

Production build output after Phase 8B:

```text
dist/index.html                                 3.55 kB │ gzip:   1.00 kB
dist/assets/index-*.css                        84.41 kB │ gzip:  15.06 kB
dist/assets/GalleryScene-*.js                  26.21 kB │ gzip:   7.63 kB
dist/assets/index-*.js                        135.88 kB │ gzip:  28.04 kB
dist/assets/galleryTextureLoader-*.js         512.85 kB │ gzip: 128.99 kB
```

Attempted gallery smoke screenshot with Playwright/Chromium, but local navigation to `127.0.0.1` was blocked by the sandbox administrator policy. This is an environment limitation, not a build failure.

## Next recommendation

Visually review Phase 8B before moving forward. If the direction feels too subtle or too strong, tune Phase 8B material/shadow intensity first.

After approval, Phase 8C should remain narrow and issue-driven. Good candidates are wall/floor transition grounding, ceiling/wall transition detail, or very controlled depth cues. Avoid room expansion, mobile-control changes, editor changes, real-time shadow maps, and intrusive fog unless separately approved.
