# Phase 5A — About/contact structure and separate image pipeline

Date: 2026-05-16

## Summary

This pack starts Phase 5 by creating the public About/contact page structure and adding a separate About photo pipeline.

## Public site

- Reworked the About page into an editorial hero with cascading image cards.
- Added structured placeholder copy blocks for About Me, Photography, Career, Project, and Contact.
- Kept copy as placeholders because the user wants to write final public copy.
- Added `src/data/aboutPhotos.json` and `src/data/aboutPhotos.ts`.
- Seeded temporary About images from current portrait/editorial portfolio images.

## Editor

- Added an About tab to the local editor.
- Added About image import review.
- About imports write into `public/images/about/`, not `public/images/portfolio/`.
- About records save to `src/data/aboutPhotos.json`, not `galleryImages.json`.
- Added About photo ordering, activation, metadata editing, and remove controls.

## Backend

- Added About photo normalization and backup coverage.
- Added `/api/about-photos/import`.
- Added `aboutPhotos` to `/api/data` and `/api/save`.
- Backups now include `aboutPhotos.json` when present.

## Not included

- Final About copy.
- Final personal/About image selection.
- Drag-and-drop ordering for About photos.
- Broad homepage/portfolio/gallery redesign.
