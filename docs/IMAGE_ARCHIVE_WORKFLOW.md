# Image archive workflow

## Rule

Do not delete `asset-archive/` until every image inside it has either been intentionally imported into the portfolio or intentionally rejected.

The archive is a local preservation area, not trash.

## Why `asset-archive/` is ignored

`asset-archive/` may contain source images, old exports, imports that are not yet in the site data, or images that need to be processed later. It should not be deployed to GitHub Pages unless the site actually references those files.

The live site should only commit runtime image assets inside `public/images/` that are referenced by the current source data.

## Safe workflow

1. Keep `asset-archive/` locally.
2. Commit only the current runtime assets:

```powershell
git add public/images public/fonts
git commit -m "Add portfolio runtime image assets"
git push origin main
```

3. Do not use `git add .` until `.gitignore` includes:

```text
asset-archive/
asset-reports/
```

4. When ready to import archived images later, copy selected files out of `asset-archive/`, process them, and add them to the correct runtime folders.

## Suggested future import structure

Use `assets-to-import/` or `source-images/` as a local-only staging area for images that still need review, processing, resizing, metadata, or editor import.

These folders are ignored by Git so they remain local.

## Important

If an archived image is not anywhere else locally, treat `asset-archive/` as your only copy. Back it up outside the repo before doing any destructive cleanup.
