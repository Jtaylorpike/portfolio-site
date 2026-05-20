# Phase 8L — Dramatic Lighting Rollback to Phase 8J

Date: 2026-05-19

## Status

Current corrective rollback pack.

Phase 8K is rejected/superseded before acceptance. User visual review found that Phase 8K made the virtual gallery much too dark and left basically no visible lighting.

Phase 8L restores the Phase 8J runtime files while keeping the Phase 8 documentation trail accurate.

## Source restored

Runtime files restored from the Phase 8J root-format pack:

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
```

## Reason

Phase 8J was a controlled dramatic-lighting/frame-highlight pass. Phase 8K pushed the room toward the approved dramatic mockup more aggressively, but the result locally overshot the lighting target. This rollback returns to the safer Phase 8J baseline before further lighting work continues.

## Preserved constraints

This pack does not change:

```text
room footprint
wall placement
wall IDs
collision
movement controls
mobile controls
plaque fallback logic
gallery curation/editor logic
image assets
routing
SEO files
public copy
logo/favicon/social-preview work
dependencies
```

This pack does not add:

```text
dynamic shadow maps
castShadow / receiveShadow
procedural surface texture maps
transparent shadow geometry
post-processing
fog
new dependencies
new image assets
```

## External visual-tool note

External tools such as the Three.js Editor or CodePen can be useful for isolated lighting experiments or reference sketches, but they should not be treated as authoritative for this project because they do not mirror the site's data flow, camera behavior, controls, wall placement, frame geometry, plaque fallback, deployment/build behavior, or prior artifact constraints. The real implementation still needs to be validated in the actual project after applying a root-format pack.

The sandbox visual-testing limitation remains that Chromium can load inline scripts but cannot create a WebGL context, so browser screenshot iteration is not reliable here.

## Next recommendation

After applying Phase 8L, hard refresh and confirm the gallery returns to the Phase 8J visual/runtime baseline. The next lighting attempt should be narrower than Phase 8K and should brighten artwork emphasis without lowering the room's base visibility so far.
