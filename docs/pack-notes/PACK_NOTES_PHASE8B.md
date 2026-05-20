# Pack Notes — Phase 8B Materials and Lighting Foundation

## Purpose

Start the runtime side of Phase 8 with a restrained, performance-conscious gallery environment pass. The goal is to make the current 3D room feel more physical and refined without moving walls, changing controls, or adding expensive dynamic shadows.

## What changed

- Added seeded deterministic procedural texture helpers for gallery materials.
- Reworked the floor material so its subtle grain is stable between page loads.
- Added subtle wall, room-shell, ceiling, and paper/mat procedural textures.
- Refined material values for frames, trim, ceiling panels, plaque bodies, floor, walls, and ceiling.
- Adjusted gallery lighting toward lower global wash and warmer local ceiling-panel pools.
- Added per-artwork static contact-shadow planes behind frames to create a baked-shadow-style effect without runtime shadow maps.
- Updated Phase 8 handoff, roadmap, transfer workflow, changelog, and this pack documentation.
- Corrected the stale roadmap line that still said Phase 8 had not started.
- Reissued the pack in root-relative format so its contents can be copied directly into the repo root.
- Removed the top-level phase README pattern; all pack documentation now remains under `docs/`.
- Added the replacement pack formatting rule to the transfer workflow and current handoff docs.

## Pack format

This corrected Phase 8B zip is root-relative. Its top level contains project paths such as `src/`, `docs/`, and `PROJECT_CHANGELOG.md` directly. It should be copied or extracted into the project root. It does not contain a wrapper folder such as `01-source/`, and it does not contain a root-level README.

## What did not change

- No room footprint changes.
- No wall placement changes.
- No wall ID changes.
- No movement or collision changes.
- No plaque placement/fallback changes.
- No gallery curation data changes.
- No local editor changes.
- No mobile control changes.
- No hash-routing changes.
- No SEO file changes.
- No public copy changes.
- No favicon/logo/app-icon/social preview work.
- No image assets or external texture assets added.
- No dependencies added.
- No WebGL shadow maps or post-processing added.

## Validation

Completed:

```text
npm ci --ignore-scripts
npm run build
```

Build output summary:

```text
dist/assets/GalleryScene-*.js           26.21 kB │ gzip:   7.63 kB
dist/assets/galleryTextureLoader-*.js  512.85 kB │ gzip: 128.99 kB
```

Attempted a Playwright gallery smoke screenshot using local Chromium. Chromium launched, but sandbox policy blocked navigation to the local Vite server with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Build validation still completed successfully.

## Visual review notes

Review the gallery for:

- whether the wall/floor/ceiling texture feels refined rather than noisy;
- whether the contact shadows behind frames are visible enough to ground the artworks;
- whether the contact shadows are too strong or too stylized;
- whether the warmer light balance still preserves photo color and plaque readability;
- whether the room feels quieter and more physical without feeling game-like.

Phase 8C should only proceed after this visual review.
