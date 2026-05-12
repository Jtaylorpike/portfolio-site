# Image data validation

## Purpose

This validation layer checks the image data model after the folder migration, optimizer pipeline, and import workflow.

It validates:

```text
src/data/galleryImages.json
src/data/categories.json
src/data/heroSlides.json
public/images/portfolio/*
```

## Run

```powershell
.\scripts\Validate-PortfolioImageData.ps1
```

To treat warnings as build-blocking failures:

```powershell
.\scripts\Validate-PortfolioImageData.ps1 -WarningsAsErrors
```

## Reports

```text
asset-reports/portfolio-image-data-validation-summary.txt
asset-reports/portfolio-image-data-issues.txt
asset-reports/portfolio-image-data-issues.csv
asset-reports/portfolio-image-data-paths.csv
asset-reports/portfolio-hero-slide-audit.csv
```

## What it checks

### Gallery image records

```text
Required fields exist
Image IDs are unique
Category values exist in categories.json
Runtime paths use the expected rendition folders
Runtime files exist locally
Runtime files are WebP
Width/height/aspect/orientation metadata is internally consistent
```

### Expected path prefixes

```text
src        -> /images/portfolio/display/
thumbSrc   -> /images/portfolio/thumb/
textureSrc -> /images/portfolio/texture/
fullSrc    -> /images/portfolio/full/
```

### Hero slides

```text
Hero image IDs exist
Hero image IDs are not duplicated
Hero slides use landscape images
Hero target categories exist
```

## Why this matters

The editor and import workflow are data-driven. This script catches broken references, stale categories, bad hero slide choices, and incorrect folder paths before they become visual bugs.
