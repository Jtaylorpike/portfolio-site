# Public image rendition structure

## Problem

The current `public/images` tree mixes categories, old source folders, imported files, original files, optimized files, thumbnails, textures, and manifests.

That is not a good long-term structure because categories are editable data. The JSON editor can add, rename, or delete categories, but it should not need to create or delete filesystem folders.

## Recommended structure

Use folders by rendition/purpose, not by category.

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
display/ = default portfolio image used by the traditional site
thumb/ = small thumbnails for index/contact sheets
texture/ = lower-size 3D gallery texture if needed
full/ = large lightbox/detail version
ui/ = non-portfolio interface images
logo/ = brand assets only
```

## Naming

Use the image record id as the filename stem.

Example:

```text
public/images/portfolio/display/climbing-workbook-05.webp
public/images/portfolio/thumb/climbing-workbook-05.webp
public/images/portfolio/texture/climbing-workbook-05.webp
public/images/portfolio/full/climbing-workbook-05.webp
```

The JSON should carry category data:

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

## Source image rule

Do not store unprocessed source images in `public/images`.

Use local ignored folders instead:

```text
source-images/
assets-to-import/
asset-archive/
```

Only optimized runtime files should live under `public/images`.

## GitHub Pages path rule

The site uses Vite. When deployed under a repository path like `/portfolio-site/`, runtime-generated public asset URLs need to be prefixed with `import.meta.env.BASE_URL`.

The replacement `src/data/images.ts` handles this for image paths from JSON.
