# Gallery Architectural Wall Preview Editor

## Purpose

This update revises the local editor gallery wall preview so it reads as a simplified architectural wall elevation instead of a floating image-and-plaque composition.

The previous preview was technically useful, but the enlarged lightbox preview had too much empty grid space and did not clearly communicate that the frame and plaque were mounted to a gallery wall. This made the preview feel abstract rather than connected to the eventual museum/private-archive room direction.

## What changed

- The wall preview now includes a visible wall plane.
- The preview includes a baseboard and floor plane cue.
- The frame and plaque are grouped as a mounted installation on the wall.
- Side plaques now sit next to the frame inside the mounted installation group rather than at the far edge of the preview surface.
- Below-frame plaque fallback now sits directly below the frame, not at the bottom of the full preview surface.
- The enlarged lightbox preview uses the same architectural wall language at a larger scale.

## What did not change

- No 3D gallery runtime files were changed.
- No wall positions were changed.
- No collision logic was changed.
- No image data was changed.
- No gallery curation data was changed.

## Design note

This is still an editor approximation, not a photorealistic room render. The goal is to make the preview immediately legible as a wall-mounted artwork study: wall plane, baseboard/floor relationship, mounted frame, and associated plaque.
