# Pack Notes — Phase 5I About Copy Editor

## Apply

Copy the replacement files into the existing project, preserving folder structure.

## Main behavior

The public About/contact page now reads user-editable copy from `src/data/aboutCopy.json` through `src/data/aboutCopy.ts`. The local editor About tab has a new structured copy editor above the existing About image import/archive controls.

## Important constraints

- Final About/contact copy remains user-authored.
- This pack intentionally keeps current placeholder text as editable data, not final prose.
- About image curation remains deferred until pre-launch content curation.
- Gallery curation remains deferred until pre-launch content curation.

## Validation run

- Python syntax check for edited Flask modules.
- JavaScript syntax check for edited editor modules.
- JSON parse check for the new copy data file.
- CSS brace-balance checks.
- `npm run build`.
- Zip integrity check.
