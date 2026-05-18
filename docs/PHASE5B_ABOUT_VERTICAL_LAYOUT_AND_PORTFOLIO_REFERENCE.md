# Phase 5B — About Vertical Layout + Portfolio Reference Controls

Updated: 2026-05-16

## Purpose

Phase 5B continues the About/contact redesign without changing the portfolio archive image pipeline. It keeps About imagery separate while making it easier to reuse an existing portfolio image as an About-page reference record.

## Public About page changes

- Reworked the About/contact page toward a more vertical editorial structure based on the user mockup.
- Added a top section with a large copy block and overlapping photo cluster.
- Added a full-width copy band beneath the hero area.
- Added a lower split section with a secondary photo stack and a large copy block.
- Added low-opacity floating background photos.
- Added subtle scroll-linked movement for About-page floating/photo elements.
- Kept all public About copy as placeholder copy for the user to replace later.

## Editor changes

Normal portfolio image edit pages now include an About-page action panel. The panel allows the user to add the current portfolio image to `aboutPhotos.json` as a `portfolio-reference` record.

This action:

- does not copy rendition files;
- does not write into `public/images/about/`;
- does not add the image to the About native import pipeline;
- does create a separate About photo record that points to the existing portfolio image paths;
- requires the normal editor save flow to persist the new About record.

Native About imports remain separate and continue to write to:

```text
public/images/about/display/
public/images/about/thumb/
public/images/about/full/
source-images/about-editor-imports/
```

## Notes

This pack does not change gallery curation behavior, Three.js runtime behavior, portfolio image import behavior, or public portfolio/gallery pages. The public About page still uses placeholder copy only.
