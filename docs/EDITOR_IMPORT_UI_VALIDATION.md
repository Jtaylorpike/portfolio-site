# Editor import UI validation

## Purpose

This update brings the browser-side import review UI in line with the cleaned portfolio image pipeline.

The backend already normalizes and validates imported image records, but the editor UI should prevent obvious bad values before the request reaches Flask.

## What changed

The import review now:

```text
reads selected image dimensions in the browser
shows detected orientation, dimensions, and aspect ratio
shows whether the image is eligible for the landscape-only homepage hero
shows the exact future rendition output paths
allows gallery frame style selection during import
allows gallery fit mode selection during import
allows gallery size selection during import
allows thumbnail crop and virtual gallery crop during import
validates IDs, duplicate IDs, fit modes, frame styles, and required text fields before saving
disables Save Reviewed Import when the review has blocking errors
```

## Output path contract

Imported images should write to:

```text
public/images/portfolio/display/<image-id>.webp
public/images/portfolio/thumb/<image-id>.webp
public/images/portfolio/texture/<image-id>.webp
public/images/portfolio/full/<image-id>.webp
```

The import review displays these paths before saving so path issues are easier to catch.

## Hero rule

The homepage hero remains locked to landscape images only.

Portrait and square images still import normally, but the review UI now labels them as not hero eligible.

## Validation

After applying this pack:

```powershell
npm run build
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
```

Then start the editor:

```powershell
.\scripts\Run-LocalEditor.ps1
```

Test one import review without saving, then save a real import only if the output paths and metadata look correct.
