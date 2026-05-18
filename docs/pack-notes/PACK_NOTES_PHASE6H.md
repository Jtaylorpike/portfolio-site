# Pack Notes — Phase 6H Pixel Landscape Homepage Fix

## Summary

This pack fixes the Pixel 9 Pro XL landscape homepage layout by broadening the short-landscape phone breakpoint used for the compact image-first homepage view.

## Replacement files

```text
src/styles/global.css
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE6H_PIXEL_LANDSCAPE_HOME_FIX.md
docs/pack-notes/PACK_NOTES_PHASE6H.md
docs/pack-manifests/PACK_MANIFEST_PHASE6H.txt
PROJECT_CHANGELOG.md
```

## Validation performed

- `npm run build`
- CSS brace-balance check
- Static source check for the Phase 6H landscape-phone breakpoint and scoped homepage selectors
- Headless CSS layout probe using an inline minimal homepage fixture at a Pixel-class landscape viewport
- `unzip -t`

## Notes

The sandbox blocks normal local browser navigation to Vite, so the visual check used a minimal inline HTML fixture with the real project CSS. Real-device QA should still happen from the `dev` deployment.
