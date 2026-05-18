# Pack Notes — Phase 4K Non-Gallery Editor Closeout

## Summary

This pack closes remaining non-gallery editor work by polishing category management, backup restore safety, and pack-document organization. It uses the accepted Phase 4H-I-J v9 drag behavior as the baseline and avoids gallery function changes.

## Included changes

- Category summary strip on the Categories page.
- Per-category visible/hidden/hero usage counts.
- Safer category removal with explicit reassignment target.
- Duplicate category ID preflight before saving category settings.
- Unique category IDs when adding categories from the Categories page.
- Backup restore safety copy and restore readiness labels.
- Unsaved-change warning before backup restore.
- Pack notes/manifests moved into `docs/pack-notes/` and `docs/pack-manifests/`.
- Editor cache version bumped to `v=66`.

## Not changed

- Gallery curation behavior.
- Gallery runtime behavior.
- Three.js code.
- Wall placement, collision, plaque fallback, or map behavior.
- Public-site styling or public-site behavior.
- Image import writing behavior.
- Image data schema.

## Validation

- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance check
- `npm run build`
- `unzip -t`

## Manual testing recommended

- Verify category stats render.
- Verify duplicate category IDs are blocked before save.
- Verify category removal reassigns image and hero target categories to the selected category.
- Verify backup restore warns when unsaved changes are present.
