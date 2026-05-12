# Gallery Wall Placement Controls

This update makes the Gallery tab move beyond pure artwork assignment. Each wall curation row can now carry a controlled physical placement override that the Three.js gallery reads at runtime.

## What changed

`src/data/galleryCuration.json` now supports these additional fields per wall slot:

```json
{
  "positionX": 0,
  "positionZ": 7.2,
  "rotationYDegrees": 0
}
```

These values are editor-facing placement controls:

- `positionX`: left/right position in the room.
- `positionZ`: front/back position in the room.
- `rotationYDegrees`: cardinal wall facing in degrees.

The current editor intentionally constrains rotation to cardinal gallery angles so wall movement stays predictable until a true drag/map editor exists.

## Runtime effect

The gallery still keeps its base architectural wall slots in `src/gallery/environment/galleryBlueprint.ts`, but `galleryCuration.json` can now override an existing wall slot's `position` and `rotationY`.

This means the editor can now affect:

- which artwork appears on a wall
- whether a wall is active/hidden
- wall block scale/type
- plaque state and side preference
- physical X/Z wall placement
- wall facing direction

It still does not create or delete walls. The current model edits the existing wall slots.

## Editor behavior

Each wall card now includes a **Wall placement** section with:

- X position
- Z position
- Facing

The Gallery tab summary also includes a top-down room placement map. This map is an orientation aid, not a drag editor. It should make it easier to understand where the current wall slots live in the room before the full visual placement editor exists.

## Preview cleanup

The small text label that said `scaled wall elevation` was removed from the wall preview. The preview should read as a wall object visually, not as a labeled technical diagram.

## Current limitations

- The editor cannot create new wall slots yet.
- The editor cannot delete wall slots yet.
- The top-down map is not draggable yet.
- Movement collision bounds are not automatically recalculated from edited wall placement yet.
- Wall placement changes should still be reviewed in the real 3D gallery after saving.

## Future direction

The next natural step is a true visual room map editor where wall slots can be selected, dragged, rotated, and checked against room/collision constraints before saving.
