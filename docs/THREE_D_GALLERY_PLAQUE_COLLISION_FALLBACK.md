# 3D Gallery Plaque Collision Fallback

Date: 2026-05-12

## Purpose

This update improves plaque placement in the 3D gallery so landscape frames and plaques do not visually collide when a wall is too narrow for side-by-side placement.

The gallery previously clamped side plaques to the available wall width. On tighter wall blocks, that could push the plaque inward until it overlapped the framed artwork. This was especially visible on wider landscape works.

## Behavior

Plaques still respect the editor-facing plaque side setting when there is enough horizontal room:

```text
left  -> plaque appears to the left of the frame
right -> plaque appears to the right of the frame
auto  -> resolves to left/right from galleryLayout.ts, then uses that side if it fits
```

If the selected side would collide with the frame, the plaque is automatically centered below the frame instead.

This is a runtime placement fallback only. It does not rewrite gallery curation data, wall block data, or plaque side values in the editor.

## What changed

Updated:

```text
src/gallery/GalleryScene.ts
```

The plaque placement logic now calculates whether a plaque can fit beside the frame using:

```text
wall width
frame width
frame border
plaque width
plaque gap
safe wall margin
```

If the side placement requires more horizontal space than the wall provides, the plaque moves below the artwork.

## Design intent

This keeps plaques from feeling like broken geometry while preserving the current museum/private-archive direction. Side plaques are still preferred where they fit because they feel more like gallery wall labels. Below-frame plaques are a fallback for tight walls and wide landscape frames.

## Future improvement

A later gallery polish pass could expose plaque placement as:

```text
auto
left
right
below
hidden
```

For now, `below` is an automatic collision fallback rather than an editor option.
