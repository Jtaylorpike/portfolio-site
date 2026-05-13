# Gallery Map Controls Height Fix

## Purpose

This update tightens the gallery floor-map controls panel after the drag-direction and rectangle-wall update. The previous CSS still allowed the controls row to stretch vertically inside the map column when the map/editor column had extra height, which made the controls container appear as a large empty panel above the grid.

## Changes

- Keeps `.gallery-map-controls` at natural content height.
- Changes `.gallery-placement-map-main` to a vertical flex column so the controls remain compact and the map consumes remaining vertical space.
- Keeps the map room at the intended large editor height.
- Bumps the local editor cache version to `v=40`.

## Scope

This is an editor layout-only fix. It does not change gallery data, 3D runtime files, wall placement math, collision detection, image data, backend routes, lighting, fog, plaques, or camera behavior.
