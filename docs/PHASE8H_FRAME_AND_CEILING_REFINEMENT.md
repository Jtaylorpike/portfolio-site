# Phase 8H — Frame and Ceiling Refinement

## Summary

Phase 8H continues from the accepted Phase 8G visual baseline. The user confirmed Phase 8G appeared to be working and asked to refine the artwork frames so they feel deeper and closer to wood with a small amount of sheen, add ceiling texture, and polish the existing room without reopening the artifact-prone material experiments.

This pack deliberately keeps the successful Phase 8G constraints:

- no procedural wall, ceiling, floor, or paper texture maps;
- no transparent per-artwork shadow planes;
- no dynamic WebGL shadow maps;
- no post-processing;
- no HDRI/environment assets;
- no new dependencies;
- no image assets.

The ceiling texture is implemented as a small amount of simple opaque architectural geometry rather than a texture map. This is intentional because the earlier procedural texture-map approach caused visible banding and motion artifacts.

## Runtime changes

- Refines `src/gallery/environment/galleryMaterials.ts` frame materials from flat black standard material to dark walnut/black `MeshPhysicalMaterial` values with modest clearcoat response.
- Adds a separate frame-rail material so the visible frame front can read slightly richer and more wood-like than the backing frame.
- Slightly increases frame depth and frame border in `src/gallery/GalleryScene.ts` so artwork frames have more physical presence.
- Adds four-piece frame rail geometry around each artwork. These rails sit on the existing frame plane and give the frames more dimensionality without changing artwork placement, wall placement, collision, or focus targeting.
- Updates frame-rail geometry when a higher-resolution artwork texture changes resolved frame dimensions.
- Adds subtle ceiling relief strips as low-profile opaque geometry under the ceiling plane instead of using a ceiling texture map.
- Slightly warms/cleans the mat and ceiling material values while preserving the Phase 8G room palette.

## Preserved boundaries

No changes were made to:

- room footprint;
- wall placement;
- wall IDs;
- movement bounds;
- collision behavior;
- movement controls;
- mobile controls;
- plaque placement/fallback logic;
- gallery curation data;
- editor behavior;
- image assets;
- routing;
- SEO files;
- public copy;
- favicon/logo/social-preview deferrals;
- dependencies.

## Manual check

After applying, hard refresh and open the virtual gallery. Check that:

1. the greenish-grey movement tracer remains gone;
2. the darker top-wall/cap band remains gone;
3. the frames read deeper and slightly more physical without looking glossy, plastic, or game-like;
4. the ceiling relief is visible enough to prevent total flatness but subtle enough not to look like a decorative grid;
5. plaques still fall back below frames correctly where side placement would fit poorly;
6. artwork focus behavior still targets the photograph, not the new frame rail geometry.

If the frames feel too heavy after visual review, the next correction should reduce `artworkFrameBorder`, `artworkFrameDepth`, or the frame-rail clearcoat values rather than reintroducing shadow maps or texture maps.
