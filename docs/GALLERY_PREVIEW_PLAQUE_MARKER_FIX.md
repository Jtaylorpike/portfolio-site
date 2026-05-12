# Gallery Preview Plaque Marker Fix

Date: 2026-05-12

## Purpose

The scaled wall preview previously used live artwork text inside the plaque rectangle. In compact previews and narrow wall states, that text clipped into unreadable fragments, which made the plaque look like broken UI rather than a scale/placement marker.

The preview does not need to display the real plaque copy. Its purpose is to show plaque position, scale, and fallback behavior relative to the mounted frame.

## Change

- Replaced preview plaque text with three abstract marker lines.
- Removed the dynamic plaque-title sync from the editor preview update path.
- Kept the plaque rectangle, placement logic, and side/below fallback behavior unchanged.
- Preserved accessibility with an `aria-label` on the plaque preview element.
- Bumped the local editor cache version to `v=28`.

## Scope

This is an editor-preview-only change. It does not affect the runtime Three.js gallery plaque text, gallery wall placement, image data, curation data, collision logic, lighting, fog, or public site behavior.
