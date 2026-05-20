# Phase 8AE — Surface Detail Visibility and Ceiling Finish

## Summary

Phase 8AE continues from Phase 8AD. Local review showed that the room balance was more stable and the ceiling was more integrated, but normal-distance wall and ceiling texture still felt too restrained. This pass keeps the restrained floor direction and makes wall/ceiling surface detail more readable without returning to the heavy mottled or broad-brown ceiling states from earlier attempts.

## Changes

- increases organic sand/plaster wall readability through more small-scale texture detail;
- increases wall bump response modestly while preserving a quiet gallery-plaster look;
- makes ceiling knockdown texture more visible using texture-modulated material response instead of a broad uniform brightness lift;
- keeps the ceiling in a dark warm-charcoal range rather than making it a large brown plane;
- slightly strengthens localized fixture pools so the ceiling texture can register near lights;
- keeps the current floor material direction mostly unchanged.

## Out of scope

This pack does not change room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, dependencies, post-processing, fog, transparent shadow planes, logo/favicon/social-preview work, or external texture assets.

## Validation

```text
npm run build
unzip -t
```
