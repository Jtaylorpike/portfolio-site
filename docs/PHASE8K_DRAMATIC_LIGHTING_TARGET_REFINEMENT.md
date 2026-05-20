# Phase 8K — Dramatic Lighting Target Refinement

Date: 2026-05-19

## Purpose

Phase 8K supersedes Phase 8J before user acceptance and pushes the 3D gallery closer to the approved dramatic museum/private-archive mockup: warmer focused artwork lighting, darker ceiling atmosphere, more controlled contrast, and dark stained-wood frames with visible depth and restrained lacquered highlights.

This pass remains conservative because earlier Phase 8 experiments showed that procedural texture maps and transparent shadow geometry can create visible artifacts in the gallery.

## Temporary visual-test attempt

A temporary Three.js harness was attempted outside the project source so lighting/material values could be screenshot-tested without using Vite or local URL navigation.

The attempted approach was:

```text
Three.js harness source
→ Vite bundle into a single browser JS asset
→ inline the JS into Playwright page.set_content()
→ avoid localhost, file://, and Vite dev-server navigation entirely
→ render a fixed gallery-like scene and screenshot it
```

Chromium could execute inline browser code, but it could not create a WebGL context in the sandbox. The browser reported that `THREE.WebGLRenderer` could not create a WebGL context. Because of that, exact screenshot iteration against the mockup was not available here.

The final Phase 8K values were therefore guided by:

- the approved generated dramatic gallery mockup;
- the user-provided current-gallery screenshot;
- luminance comparison between the mockup and screenshot;
- conservative source-level Three.js changes that avoid the previously artifact-prone approaches.

## Runtime scope

Changed files:

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
```

## Visual changes

- Darkens the scene background and renderer clear color.
- Lowers tone-mapping exposure to support the darker cinematic balance.
- Darkens the floor, shell walls, ceiling, ceiling detail, and wall trim toward the mockup's lower-luminance room atmosphere.
- Keeps the walls warm rather than grey/green.
- Adds focused non-shadow-casting accent spotlights from curated artwork positions, capped at eight artworks.
- Keeps the Phase 8J non-shadowing ceiling-panel spotlights and warms/tightens their falloff.
- Refines dark stained-wood/walnut frame and rail material values.
- Adds narrow angled opaque lacquer-edge bevel geometry so frames catch light through geometry rather than transparent planes or dynamic shadows.
- Makes ceiling relief thinner and more restrained.

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

## Manual visual review checklist

After applying and hard refreshing, check:

1. The gallery still opens and movement remains stable.
2. The previous greenish-grey movement tracer does not return.
3. The dark top-wall/cap band does not return.
4. The room feels closer to the approved dramatic mockup: darker ceiling, warmer lighting, stronger artwork emphasis, and richer contrast.
5. The room does not become muddy, green, or too dim to navigate.
6. The frames feel more like dark stained wood with depth and restrained sheen, not orange, black-flat, metallic, or plastic.
7. The ceiling relief remains subtle and architectural.
