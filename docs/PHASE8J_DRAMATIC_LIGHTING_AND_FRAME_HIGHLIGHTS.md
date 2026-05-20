# Phase 8J — Dramatic Lighting and Frame Highlights

Date: 2026-05-19

## Purpose

Phase 8J moves the gallery closer to the approved visual target: a quiet museum/private archive room with warmer, more dramatic lighting, darker ceiling atmosphere, stronger artwork emphasis, and frames that read more like dark stained wood with restrained lacquered sheen.

This pass builds on Phase 8I, which the user reported felt slightly better than Phase 8H but still did not fully resolve frame sheen or the broader dramatic-lighting goal.

## Runtime scope

Changed files:

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
```

## Visual changes

- Darkens the ceiling plane and ceiling detail material so the room has more overhead atmosphere.
- Keeps walls warm and restrained rather than reverting to grey or creating the earlier top-wall band artifact.
- Lowers broad ambient fill and adds focused, non-shadow-casting spotlights from the existing ceiling-panel positions.
- Keeps the existing point-light fixture model but tunes it warmer and less globally flat.
- Adds a low warm room fill so the gallery does not collapse into black shadows.
- Tunes frame and rail material values toward dark stained wood/walnut with higher clearcoat response.
- Adds narrow opaque catchlight and depth-edge frame rail strips so frames can catch light through geometry rather than relying on material gloss alone.
- Keeps the Phase 8H ceiling relief geometry, but makes it thinner and less decorative.

## Deliberate non-goals

This pack does not add:

- runtime shadow maps;
- `castShadow` or `receiveShadow`;
- procedural wall/floor/ceiling/paper texture maps;
- transparent per-artwork shadow geometry;
- post-processing;
- fog;
- new dependencies;
- new image assets;
- room footprint changes;
- wall placement changes;
- collision changes;
- plaque fallback changes;
- gallery curation/editor changes;
- mobile control changes;
- routing or SEO changes;
- public copy changes;
- favicon/logo/social-preview work.

## Testing note

The production build passes. Vite can run in this sandbox, but Chromium navigation to local or file URLs is blocked by the environment policy, so direct browser screenshot iteration is not available here. The Phase 8J changes are therefore constrained to build-safe, source-level-validated Three.js changes and should still be judged by manual hard-refresh visual review after applying the pack locally.

## Manual visual review checklist

After applying and hard refreshing, check:

1. The gallery still opens and movement remains stable.
2. The previous greenish-grey movement tracer does not return.
3. The dark top-wall/cap band does not return.
4. The ceiling feels darker and more atmospheric without making the room muddy.
5. The artworks feel more intentionally lit.
6. The frames feel more wood-like and catch highlights without becoming orange, metallic, plastic, or too dominant.
7. The ceiling relief remains subtle and architectural.
