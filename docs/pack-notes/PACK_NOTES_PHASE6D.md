# Pack Notes — Phase 6D Editor Image Card Save Fix

## Summary

Fixes the lower **Save JSON** button on individual image editor pages so it persists the currently open image card's metadata edits.

## Files changed

- `local-editor/static/js/collect.js`
- `local-editor/static/js/main.js`
- `local-editor/templates/editor.html`
- `docs/CURRENT_PROJECT_HANDOFF.md`
- `docs/CURRENT_PROJECT_HANDOFF_PHASE6_ACTIVE.md`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md`
- `docs/PHASE6D_EDITOR_IMAGE_CARD_SAVE_FIX.md`
- `docs/pack-notes/PACK_NOTES_PHASE6D.md`
- `docs/pack-manifests/PACK_MANIFEST_PHASE6D.txt`
- `PROJECT_CHANGELOG.md`

## Validation performed

- `node --check local-editor/static/js/collect.js`
- `node --check local-editor/static/js/main.js`
- `python3 -m py_compile local-editor/app/*.py`
- `npm ci --ignore-scripts`
- `npm run build`
- targeted Node harness for `collectImageCardSavePayload`
- static source checks for the new image-card save path and editor cache bump
- `unzip -t`

## Manual validation still needed

Run the local Flask editor and confirm that editing a field on an individual image page, then clicking the lower **Save JSON** button, persists the field after reload.
