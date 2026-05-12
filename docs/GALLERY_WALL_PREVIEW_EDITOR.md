# Gallery Wall Preview Editor Pack

This update adds an editor-side wall preview to each Gallery curation card.

## Purpose

The Gallery tab now controls assigned artwork, wall block type, plaque side, plaque visibility, and display status. Those fields affect the runtime gallery, but the editor previously did not show how those choices relate visually. That made it too easy to choose a wide landscape image and a side plaque without realizing the runtime gallery would need to fall back below the frame.

The preview is not a full Three.js render. It is a fast 2D approximation that shows:

- the selected artwork thumbnail
- wall block scale/type
- active versus hidden state
- side plaque preference
- plaque fallback below the frame when the image/wall combination is too tight

## What the preview does

Each wall card now includes a small simulated wall surface. It updates when the user changes:

- Assigned artwork
- Wall block type
- Plaque side
- Plaque enabled
- Display status

The plaque preview follows the same design principle as the runtime gallery: side placement is conditional. If the wall/image combination is likely too tight, the preview shows the plaque below the frame.

## What the preview does not do

The preview does not move real 3D walls, change collision, change lighting, or replace the actual Three.js gallery. It is an editor affordance only.

The real wall positions still come from the gallery blueprint. The preview helps make curation decisions easier before opening the public 3D gallery.
