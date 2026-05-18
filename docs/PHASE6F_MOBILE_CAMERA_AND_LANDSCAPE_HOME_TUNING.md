# Phase 6F — Mobile Camera + Landscape Home Tuning

Updated: 2026-05-18

## Purpose

Tune the Phase 6E mobile controls after phone testing found the camera slightly too sensitive, and address homepage formatting on horizontal phone screens.

## Changes

- Reduced touch drag-look sensitivity from the Phase 6E value while keeping it above the Phase 6B restrained baseline.
- Reduced the maximum per-event touch camera delta from the Phase 6E value while keeping it above the Phase 6B clamp.
- Preserved Phase 6E movement tuning because movement responsiveness was not the reported issue.
- Added a targeted homepage-only media query for short landscape phone screens.
- In horizontal-phone homepage view, the hero now uses a compact image-first layout with a small index rail, hidden thumbnails/meta panel, hidden hero statement/actions, and tighter header/nav spacing.

## Files changed

```text
src/gallery/controls/lookController.ts
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6F_MOBILE_CAMERA_AND_LANDSCAPE_HOME_TUNING.md
docs/pack-notes/PACK_NOTES_PHASE6F.md
docs/pack-manifests/PACK_MANIFEST_PHASE6F.txt
PROJECT_CHANGELOG.md
```

## Validation

- `npm ci --ignore-scripts`
- `npm run build`
- CSS brace-balance check
- Static source checks for Phase 6F camera constants and horizontal-phone CSS guard
- `unzip -t`

## Manual QA

After applying, push to `dev` and test on a real phone:

1. Open the 3D gallery.
2. Confirm movement still feels responsive.
3. Confirm drag-look camera sensitivity feels between Phase 6B and Phase 6E.
4. Open the homepage in portrait and confirm the normal portrait-phone layout is unchanged.
5. Rotate the phone horizontally and confirm the homepage hero does not stack awkwardly or require excessive scrolling.
