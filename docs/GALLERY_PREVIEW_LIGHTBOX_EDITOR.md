# Gallery Preview Lightbox Editor Update

Date: 2026-05-12

## Purpose

The Gallery tab already shows two visual previews on each wall card:

- the assigned artwork thumbnail
- the compact wall preview showing wall scale, frame, plaque behavior, and display status

Those previews were useful but too small for practical inspection. This update makes both previews clickable so the editor can show them at a larger scale in an overlay.

## What changed

- The assigned artwork thumbnail now opens a large artwork preview overlay.
- The compact wall preview now opens a larger wall-preview overlay.
- The wall-preview overlay uses the wall card's current unsaved controls, including:
  - assigned artwork
  - wall block type
  - plaque side
  - plaque enabled/disabled state
  - active/hidden display status
- The overlay can be closed with the close button, backdrop click, or Escape.
- The previews are keyboard-accessible with Enter or Space.

## What did not change

- No 3D gallery runtime files were changed.
- No gallery room geometry was changed.
- No wall placement, collision, lighting, fog, camera, or plaque runtime behavior was changed.
- No image data or curation data was changed.
- No backend behavior was changed.

## Design intent

This is an editor usability improvement. It helps the Gallery tab feel more like a visual curation tool instead of a data form. The user can inspect whether an image, wall block type, and plaque arrangement make visual sense before saving and checking the actual 3D room.
