# Phase 7D — Navigation Font-Size Cleanup

Date: 2026-05-18

## Purpose

Phase 7D applies a narrow Lighthouse readability cleanup after the post-Phase 7C report showed that the remaining small-font warning included the primary site navigation.

The goal is to improve core navigation legibility without changing the broader editorial microtype system, gallery plaque/card typography, favicon/logo scope, social preview scope, hash routing, or thumbnail rendition pipeline.

## Changes

- Raised `.modern-nav a` and `.modern-nav button` to the existing 12px interface size token.
- Preserved the quiet uppercase editorial navigation style by tightening letter spacing instead of making the nav visually heavier.
- Kept mobile nav touch targets at or above the prior accessible target size.
- Added explicit mobile and very-small-phone overrides so the older 9px mobile nav rule no longer wins.
- Added short-landscape phone overrides for Home and non-Home routes so the Pixel-class landscape guards also use the 12px navigation baseline.

## Scope boundaries

No changes were made to:

- gallery plaque typography;
- gallery bottom-right card typography;
- homepage metadata microtype;
- homepage thumbnail microtype;
- favicon/logo/app-icon assets;
- social preview image assets;
- route architecture or hash routing;
- thumbnail rendition sizes or the image pipeline;
- public copy/content.

## Follow-up

After applying the pack, rerun:

```powershell
.\scripts\Run-LighthouseBaseline.ps1
```

Expected result: the navigation should no longer be part of the lowest-size group in the Lighthouse font-size warning. Other intentional microtype may still be reported and should remain deferred unless the user decides to broaden the visual/UI scope.
