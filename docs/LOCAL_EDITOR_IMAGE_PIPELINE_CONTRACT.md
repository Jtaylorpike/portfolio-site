# Local editor image pipeline contract

## Purpose

The local editor needs to follow the cleaned portfolio image system. It should not create category folders, stale `public/data` files, or one-off image paths.

## Active data files

The editor should read and write:

```text
src/data/galleryImages.json
src/data/categories.json
src/data/heroSlides.json
```

The editor should not write active runtime data to:

```text
public/data/
```

`public/data/` is treated as stale deployable data and should remain archived unless a future server-side architecture intentionally reintroduces public API JSON.

## Runtime image folders

The editor/importer should use folders by rendition and purpose:

```text
public/images/portfolio/full/
public/images/portfolio/display/
public/images/portfolio/texture/
public/images/portfolio/thumb/
public/images/ui/cards/
public/images/logo/
```

The editor should not create folders based on category names.

Category belongs in JSON:

```json
{
  "id": "personal-desert-light-01",
  "category": "personal"
}
```

## Image record path contract

Each portfolio image record should use:

```json
{
  "src": "/images/portfolio/display/<id>.webp",
  "thumbSrc": "/images/portfolio/thumb/<id>.webp",
  "textureSrc": "/images/portfolio/texture/<id>.webp",
  "fullSrc": "/images/portfolio/full/<id>.webp"
}
```

## Import flow

Future image imports should use:

```text
source-images/inbox/
```

then run:

```powershell
.\scripts\Import-PortfolioImages.ps1 -Category personal -Apply
```

The editor can eventually wrap this workflow, but the underlying contract should remain the same.

## Validation flow

Before and after editor changes:

```powershell
.\scripts\Audit-LocalEditorCompatibility.ps1
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
```

## Why this matters

The editor is the most likely place for old folder assumptions to creep back in. This contract keeps the public site, import pipeline, optimizer, and editor working from the same data model.
