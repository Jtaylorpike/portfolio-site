# Phase 6G — Horizontal-Phone Homepage Hero Fix

Updated: 2026-05-18

## Purpose

Correct the Phase 6F horizontal-phone homepage layout after real-device testing showed a wide hero image being visually cut by the compact copy-panel overlay.

## Changes

- Kept the Phase 6F short landscape-phone media query as the scoped target.
- Changed the short landscape-phone hero image shell to fill the available stage width.
- Set the short landscape-phone hero image shell to a fixed short viewport-based height instead of a narrower 16:9 width calculation.
- Hid the hero copy panel only in short landscape-phone mode so its dark overlay no longer covers the left side of the image.
- Preserved the compact vertical index rail, simplified header/nav, hidden thumbnails, hidden meta panel, and hidden statement/actions from Phase 6F.

## Files changed

```text
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6G_HORIZONTAL_PHONE_HOMEPAGE_HERO_FIX.md
docs/pack-notes/PACK_NOTES_PHASE6G.md
docs/pack-manifests/PACK_MANIFEST_PHASE6G.txt
PROJECT_CHANGELOG.md
```

## Validation

- `npm ci --ignore-scripts`
- `npm run build`
- CSS brace-balance check
- Static source checks for the Phase 6G horizontal-phone hero rules
- `unzip -t`

## Manual QA

After applying, push to `dev` and test on the phone again:

1. Open the homepage in portrait and confirm the normal portrait-phone layout is unchanged.
2. Rotate the phone horizontally.
3. Confirm the hero image fills the available stage instead of sitting as a narrow box to the right.
4. Confirm the dark copy-panel overlay no longer cuts into the photo.
5. Confirm the small vertical index rail remains usable.
6. Confirm the gallery mobile controls are unchanged from Phase 6F.
