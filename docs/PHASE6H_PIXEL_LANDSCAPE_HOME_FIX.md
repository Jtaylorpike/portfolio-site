# Phase 6H — Pixel-Class Horizontal-Phone Homepage Fix

Date: 2026-05-18

## Purpose

Phase 6H fixes the horizontal-phone homepage layout reported from a Pixel 9 Pro XL real-device screenshot.

The Phase 6F/6G compact landscape-phone homepage guard was scoped to `max-width: 900px`. On the Pixel 9 Pro XL in landscape, the browser can expose a CSS viewport wider than that breakpoint. That allowed the dense desktop homepage layout to render on a real phone, including the metadata panel and thumbnail strip, which created overlap and visual clutter.

## What changed

- Added a broader short-landscape homepage media query for viewports up to `1080px` wide and `560px` tall.
- Kept this scoped to the public homepage only through `.modern-site[data-page='home']` selectors.
- Switched wide horizontal-phone homepage viewports into the compact image-first layout.
- Hid the homepage metadata panel, thumbnail strip, copy panel, statement/actions, rail label, and decorative grid marks in this mode.
- Tightened the header/nav and hides the brand descriptor only in this short landscape-phone layout.
- Makes the hero image fill the available stage and use `object-fit: cover` in this mode.

## What did not change

- Mobile gallery movement tuning.
- Mobile gallery camera sensitivity.
- Desktop homepage layout.
- Portrait-phone homepage layout.
- Portfolio, About/contact, or entry-page behavior.
- Gallery curation data, wall placement, collision, plaques, or artwork metadata.
- Local editor behavior.

## Manual QA

After applying and deploying to `dev`, test the homepage on the Pixel 9 Pro XL in landscape orientation.

Expected result:

- The homepage should no longer show the dense desktop hero metadata/thumbnail layout in horizontal phone orientation.
- The home hero should render as a compact image-first stage with a small left slide-number rail.
- The image should fill the available stage instead of appearing boxed, covered, or split by text/metadata layers.
- The nav should remain usable.
