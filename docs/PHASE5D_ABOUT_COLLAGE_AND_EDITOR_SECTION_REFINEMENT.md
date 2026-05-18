# Phase 5D — About Collage and Editor Section Refinement

Date: 2026-05-16

## Purpose

Refine the About/contact page after visual review and make the About editor easier to use now that About images have separate placement roles.

## Public About page changes

- Enlarged the transparent background-float images so they are visible as an atmospheric background layer.
- Kept the background images low-opacity and pointer-inert.
- Changed the top foreground collage to a two-photo stack: a large base image with a smaller centered image on top.
- Removed foreground collage image hyperlinks so upper/lower collage photos do not open source image files in new tabs.
- Updated About photo placement helpers so inactive About records do not render in public collage/floating sets.

## Editor changes

- Broke the About tab image list into four sections:
  - Upper collage;
  - Lower collage;
  - Background floats;
  - Unused / staged.
- Added section counts and role-specific usage notes.
- Updated About photo movement controls so Top/Up/Down moves within the current section.
- Bumped editor cache version to `v=70`.

## Not changed

- No portfolio image pipeline behavior changed.
- No gallery curation behavior changed.
- No Three.js runtime behavior changed.
- No final About copy was written.
