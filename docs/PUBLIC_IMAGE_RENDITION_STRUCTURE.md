# Public image rendition structure

## Decision

Portfolio image folders should be organized by rendition/purpose, not by category.

Categories are editable data. The JSON editor can add, rename, or delete categories, but it should not need to create or delete filesystem folders.

## Target structure

```text
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/portfolio/texture/
public/images/portfolio/full/
public/images/ui/
public/images/logo/
```

## Meaning

```text
display/ = default image used by the portfolio grid and standard site views
thumb/ = small thumbnails for indexes, contact sheets, and fast UI previews
texture/ = 3D gallery texture-sized image when a lighter GPU texture is useful
full/ = large lightbox/detail image
ui/ = non-portfolio interface images
logo/ = brand assets only
```

## JSON example

```json
{
  "id": "climbing-workbook-05",
  "category": "climbing",
  "src": "/images/portfolio/display/climbing-workbook-05.webp",
  "thumbSrc": "/images/portfolio/thumb/climbing-workbook-05.webp",
  "textureSrc": "/images/portfolio/texture/climbing-workbook-05.webp",
  "fullSrc": "/images/portfolio/full/climbing-workbook-05.webp"
}
```

## Naming convention

Use the image record `id` as the file stem. This keeps the relationship stable even if title, category, location, year, or display order changes.

## Source image rule

Do not store unprocessed source images in `public/images`.

Use local ignored folders instead:

```text
source-images/
assets-to-import/
asset-archive/
```

Only optimized runtime files should live under `public/images`.

## Migration command

Dry run first:

```powershell
.\scripts\Migrate-PublicImagesToRenditions.ps1
```

Apply after reviewing the plan:

```powershell
.\scripts\Migrate-PublicImagesToRenditions.ps1 -Apply -UpdateJson
```

Then audit:

```powershell
.\scripts\Audit-PortfolioImages.ps1
.\scripts\Audit-PortfolioRenditionStructure.ps1
npm run build
```

## Git rule

Do this on `dev`, not directly on `main`, so the public WIP remains clean.
