# Gallery Interactive Floor Grid Map Editor

Date: 2026-05-12

## Purpose

This update makes the gallery floor-grid placement system more usable by letting the editor map act as a placement control instead of only a passive diagram.

The prior grid/collision pack made wall placement safer, but it still required typing `Grid X` and `Grid Z` values. That worked technically, but it was not intuitive enough for arranging a physical room. This update keeps the same data model and collision rules while adding a click-to-place map workflow.

## What changed

- The wall footprint map now contains selectable wall markers.
- Each wall card has a **Select on map** button.
- Clicking a wall footprint on the map selects that wall and scrolls to its card.
- Once a wall is selected, clicking an open map position moves that wall to the clicked grid cell.
- The card's `Grid X`, `Grid Z`, meter readouts, collision warnings, and save-button state update immediately.
- The map marker updates immediately from the unsaved card state.
- Selected wall cards and selected map markers now have visible styling.

## Data model

This update does not add new persisted fields. It continues using the existing placement data:

```json
{
  "positionX": 0,
  "positionZ": 0,
  "rotationYDegrees": 0,
  "wallType": "standard-display-wall"
}
```

The editor still presents `positionX` and `positionZ` through 0.5m grid controls. The map writes into those same controls, so the saved JSON shape is unchanged.

## Collision behavior

The collision behavior from the previous grid pack remains intact:

- wall block type determines the footprint size
- facing determines whether the footprint extends horizontally or vertically on the top-down map
- overlapping footprints disable Save Wall for affected cards
- overlapping footprints disable Save All Gallery Curation
- backend validation still blocks overlapping placements before writing `galleryCuration.json`

## What this does not do

This is not yet a full room-layout editor.

It does not:

- create new wall slots
- delete wall slots
- drag walls continuously
- resize custom wall dimensions
- add diagonal walls
- solve room circulation automatically
- change the public gallery runtime beyond whatever saved placement values already control

## Next likely step

The next useful step is probably a more deliberate layout mode:

- add nudge buttons or keyboard arrow movement for the selected wall
- allow selected-wall rotation directly from the map
- eventually add create/delete wall-slot controls after the current slot model feels stable
