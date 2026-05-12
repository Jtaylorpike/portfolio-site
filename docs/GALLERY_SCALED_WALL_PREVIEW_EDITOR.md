# Gallery Scaled Wall Preview Editor Update

Date: 2026-05-12

## Purpose

This update revises the Gallery tab wall preview so it reads as a scaled wall elevation instead of an abstract image/plaque composition floating over a decorative grid.

The previous preview was useful as a rough relationship check, but it created two problems:

- the grid implied scale while not matching the actual 3D wall dimensions
- the compact thumbnail preview could visually crowd the frame, plaque, wall plane, and floor cues

## Change

The preview now uses the same wall-block dimensions and artwork-size presets used by the 3D gallery model:

| Wall block type | Preview wall dimensions | Artwork-size preset |
| --- | ---: | --- |
| Feature wall | 6.25m x 3.60m | hero |
| Wide display wall | 4.90m x 3.30m | large |
| Standard display wall | 3.55m x 3.30m | medium |
| Compact display wall | 2.70m x 3.25m | small |
| Narrow transition wall | 2.15m x 3.15m | small |

The preview calculates frame dimensions using the editor's local copy of the shared gallery framing rules. It then places the frame and plaque inside the wall plane using percentage positions derived from the physical wall dimensions.

## Design notes

The preview is now an orthographic wall elevation, not a perspective room view. The light floor cue remains only as a soft orientation cue below the wall plane.

The decorative grid was removed because it looked like a measurement grid but did not represent actual gallery scale.

The compact card preview keeps plaque text minimally legible, so the plaque is not a perfect pixel-for-pixel scale drawing. The wall, frame placement, and plaque placement are the important scale relationships.

## Tested

A representative browser-rendered test was run with the actual editor CSS and wall-preview markup. The test checked both the compact card preview and the enlarged preview state. It confirmed that the scaled wall plane renders, and that the frame and plaque stay inside the wall plane for the compact-wall / below-plaque case that was causing visual confusion.
