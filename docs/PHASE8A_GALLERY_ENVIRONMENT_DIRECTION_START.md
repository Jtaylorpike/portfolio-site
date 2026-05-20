# Phase 8A — Gallery Environment Direction Start

Date: 2026-05-18

## Summary

Phase 8A starts the advanced 3D gallery environment phase and records the proposed direction before major visible Three.js changes are made.

This is a documentation-only pack. It intentionally avoids runtime visual changes until the user approves the direction.

## Proposed direction

The 3D gallery should move toward a restrained museum/private-archive room:

- warm neutral plaster/off-white wall surfaces;
- subtle floor material detail for scale and realism;
- restrained frame, mat, plaque, and trim materials;
- soft but intentional lighting pools near artwork;
- modest visible ceiling fixtures;
- quiet spatial grounding through trim, transitions, and shadow cues;
- no heavy fog or overly stylized atmosphere;
- later potential for a larger, less-square archive room with corridors or alcoves.

## Why this should come before room expansion

Current room geometry, wall placement, collision, mobile controls, and editor curation are stable enough to build on. Moving directly into a larger or non-rectangular room would risk breaking several systems at once.

A safer order is:

1. improve materials and lighting inside the current room;
2. verify gallery readability and performance;
3. add atmosphere/grounding cues;
4. only then evaluate larger or non-square room geometry.

## Not changed in Phase 8A

- No runtime TypeScript changes.
- No CSS changes.
- No data/schema changes.
- No image asset changes.
- No editor behavior changes.
- No public copy changes.
- No routing changes.
- No favicon/logo/social preview work.
- No wall movement.
- No collision changes.
- No mobile-control changes.

## Initial technical read

Current environment files already separate the major gallery environment responsibilities:

```text
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
src/gallery/environment/galleryBlueprint.ts
src/gallery/GalleryScene.ts
src/data/galleryRoom.json
src/data/galleryRoom.ts
```

The current material system already uses a procedural floor texture and separate factories for floor, wall, shell wall, ceiling, light panel, frame, wall trim, mat, fallback artwork, plaque texture, and plaque body materials.

The current lighting system uses a HemisphereLight, several DirectionalLights, and data-driven PointLights aligned to ceiling light panels.

The current room settings already live in `src/data/galleryRoom.json`, with future notes for larger, L-shaped, alcove, corridor, or archive-room layouts.

## Recommended Phase 8B scope

Phase 8B should be a reversible material and lighting foundation pack:

- tune material colors/roughness for room realism;
- improve generated floor texture discipline;
- adjust ceiling fixture opacity/material so it feels more architectural;
- tune light temperature and intensity distribution;
- optionally add small helper constants for environment palette values;
- update docs and changelog;
- run `npm run build`.

Phase 8B should not:

- move walls;
- change `galleryCuration.json`;
- change movement bounds;
- change collision radius or wall collision math;
- change plaque side/fallback logic;
- change accepted mobile controls;
- add large external texture assets;
- touch public copy, favicon/logo, social previews, hash routing, or SEO files except docs.
