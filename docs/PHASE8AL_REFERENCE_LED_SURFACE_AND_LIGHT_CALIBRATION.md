# Phase 8AL — Reference-Led Surface and Light Calibration

Status: current runtime baseline pending local visual review.

## Reason

Phase 8AJ was rejected because it added visible architectural geometry that did not match the provided dramatic gallery reference. Phase 8AK restored the accepted baseline. Phase 8AL continues from that restored state and deliberately avoids new room-shell geometry, furniture, end caps, ceiling fields, or decorative fixture structures.

The goal is to move the existing room closer to the reference through restrained material and lighting calibration only: warmer floor and wall tone, darker smoother ceiling atmosphere, less dominant existing ceiling fixtures, and more localized artwork illumination.

## Runtime changes

- Keeps the Phase 8AK room geometry baseline and does not reintroduce the rejected Phase 8AJ additions.
- Warms and darkens the floor material so it reads less like a flat gray game plane and more like quiet concrete/stone.
- Adds very subtle floor-slab/reveal lines inside the existing procedural floor texture, not as geometry.
- Warms and restrains the sand/plaster wall texture so the wall surfaces stay clean while still having material depth.
- Darkens and smooths the ceiling material so the ceiling reads more atmospheric without becoming a flat black slab.
- Reduces the visual mass of the existing ceiling light panels by making their diffuser and frame geometry thinner, closer to the ceiling, and less oversized.
- Slightly lowers broad fill values while preserving warm artwork pools and the accepted dramatic lighting architecture.

## Out of scope

- No new gallery architecture geometry.
- No benches, plinths, freestanding end caps, ceiling fields, or room partitions.
- No room footprint changes.
- No wall placement, movement, collision, or plaque fallback changes.
- No editor or gallery curation data changes.
- No mobile control changes.
- No public copy, routing, SEO, logo, favicon, or social preview changes.
- No image asset changes.
- No package/dependency changes.
- No fog, post-processing, transparent shadow planes, or external texture assets.

## Review guidance

Review with the same three screenshot types used after Phase 8AK: a main hero-artwork view, a corridor/depth view, and a close frame/artwork/fixture view. The specific things to judge are whether the floor is now too dark or appropriately warmer, whether the ceiling feels more reference-like without disappearing, whether the fixtures are less distracting, and whether the artwork pools still feel like the liked Phase 8AI/8AK lighting direction.

If this pass is directionally better, the next refinement should be based on screenshots and should stay in small calibration steps unless a specific piece of reference-matched geometry is designed and approved first.
