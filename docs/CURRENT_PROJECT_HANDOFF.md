# Taylor Pike Portfolio - Current Handoff Snapshot

Generated: 2026-05-12 14:49:28

## Current branch state

- Active working branch: dev
- Current commit: 275c950
- main should remain the clean public WIP until dev is intentionally merged.
- Continue experimental/build-system/editor work on dev.

## Current project architecture

- Vite + TypeScript static portfolio site.
- Active editable data lives in src/data/.
- Stale deployed data under public/data/ should remain archived, not restored.
- Public image paths are resolved through import.meta.env.BASE_URL so GitHub Pages project-path deployment works.
- Portfolio image folders are organized by rendition/purpose, not by category.
- Local editor should follow the same rendition-based image contract.

## Active data files

- src/data/galleryImages.json
- src/data/categories.json
- src/data/heroSlides.json
- src/data/images.ts

## Runtime image structure

~~~text
public/images/portfolio/full/
public/images/portfolio/display/
public/images/portfolio/texture/
public/images/portfolio/thumb/
public/images/ui/cards/
public/images/logo/       # optional/future brand assets
~~~

Categories belong in JSON, not in image folder names.

## Local-only folders

These should not be committed:

~~~text
asset-archive/
asset-reports/
source-images/
assets-to-import/
node_modules/
dist/
~~~

## Major recent changes

- GitHub Pages image path issue fixed by resolving JSON-driven image paths with import.meta.env.BASE_URL.
- Public images migrated toward a rendition-based structure.
- Image optimizer pipeline added for full, display, texture, and thumb WebP renditions.
- Legacy public/data archived because active data now lives in src/data.
- Legacy public image folders archived after references were migrated.
- Card images migrated toward public/images/ui/cards/.
- Image import workflow added for future images.
- Image removal workflow added for safely removing test imports.
- Image data validation added and integrated into dev validation.
- Local editor import backend updated to use rendition folders.
- Editor fit-mode normalization fixed.
- Workspace root cleanup tooling added.

## Validation commands

Run these before considering a merge from dev into main:

~~~powershell
.\scripts\Validate-WorkspaceRootClean.ps1
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
npm run build
~~~

Optional strict image-data validation:

~~~powershell
.\scripts\Validate-PortfolioDevBranch.ps1 -ImageDataWarningsAsErrors
~~~

## Import workflow

~~~powershell
.\scripts\Audit-ImageImportInbox.ps1
.\scripts\Import-PortfolioImages.ps1 -Category personal
.\scripts\Import-PortfolioImages.ps1 -Category personal -Apply
.\scripts\Validate-PortfolioDevBranch.ps1
~~~

## Editor workflow

~~~powershell
.\scripts\Audit-LocalEditorCompatibility.ps1
.\scripts\Run-LocalEditor.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
~~~

## Removal workflow for test imports

~~~powershell
.\scripts\Remove-PortfolioImageRecord.ps1 -ImageId "example-id"
.\scripts\Remove-PortfolioImageRecord.ps1 -ImageId "example-id" -Apply
.\scripts\Validate-PortfolioDevBranch.ps1
~~~

## Git safety

Tracked archive files: 0

Tracked report files: 0

Tracked source image files: 0

These counts should remain 0.

## Working tree

Working tree had the following changes when this snapshot was generated:

~~~text
 M local-editor/app/data_store.py
 M local-editor/app/routes.py
 M local-editor/static/editor.css
 M local-editor/static/js/api.js
 M local-editor/static/js/importValidation.js
 M local-editor/static/js/main.js
 M local-editor/static/js/render.js
 M local-editor/templates/editor.html
 M src/data/galleryImages.json
?? docs/EDITOR_IMAGE_ID_RENAME_WORKFLOW.md
?? public/images/portfolio/display/landscape-201019-jtp6059.webp
?? public/images/portfolio/full/landscape-201019-jtp6059.webp
?? public/images/portfolio/texture/landscape-201019-jtp6059.webp
?? public/images/portfolio/thumb/landscape-201019-jtp6059.webp
~~~

## Latest public image structure summary

~~~text
Public image structure summary

Total files: 65
Total size bytes: 25567386

By section:
  portfolio: 60 files, 24799852 bytes
  ui: 5 files, 767534 bytes

Portfolio renditions:
  display: 15 files, 5649420 bytes
  full: 15 files, 16908416 bytes
  texture: 15 files, 1795496 bytes
  thumb: 15 files, 446520 bytes
~~~

## Latest image data validation summary

~~~text
Portfolio image data validation summary

Image records:        15
Categories:           3
Hero slides:          6
Path rows:            60
Errors:               0
Warnings:             0
Warnings as errors:   false

Reports:
asset-reports/portfolio-image-data-issues.txt
asset-reports/portfolio-image-data-issues.csv
asset-reports/portfolio-image-data-paths.csv
asset-reports/portfolio-hero-slide-audit.csv
~~~

## Latest dev validation summary

~~~text
Taylor Pike Portfolio dev branch validation
Generated: 20260512-143143
Project root: C:\Users\jtayl\portfolio-site

## Git branch check
Current branch: dev
PASS: Git branch check

## Git safety check
Working tree has changes:
   M local-editor/app/data_store.py
   M local-editor/app/routes.py
   M local-editor/static/editor.css
   M local-editor/static/js/api.js
   M local-editor/static/js/importValidation.js
   M local-editor/static/js/main.js
   M local-editor/static/js/render.js
   M local-editor/templates/editor.html
  ?? docs/EDITOR_IMAGE_ID_RENAME_WORKFLOW.md
  ?? public/images/portfolio/display/landscape-201019-jtp6059.webp
  ?? public/images/portfolio/full/landscape-201019-jtp6059.webp
  ?? public/images/portfolio/texture/landscape-201019-jtp6059.webp
  ?? public/images/portfolio/thumb/landscape-201019-jtp6059.webp
asset-archive and asset-reports are not tracked.
PASS: Git safety check

## Public image reference audit

  Public image reference audit
  Referenced existing files: 65
  Missing referenced files:  0
  Unreferenced files:       0
  
  Reports:
  asset-reports\public-image-reference-locations.csv
  asset-reports\public-image-referenced-existing.txt
  asset-reports\public-image-missing.txt
  asset-reports\public-image-unreferenced.txt
PASS: Public image reference audit

## Optimized portfolio image audit

  Optimized portfolio image audit
  Image records scanned:    15
  Image field rows scanned: 60
  Missing files:            0
  Prefix violations:        0
  
  Expected prefixes:
  src        -> /images/portfolio/display/
  thumbSrc   -> /images/portfolio/thumb/
  textureSrc -> /images/portfolio/texture/
  fullSrc    -> /images/portfolio/full/
PASS: Optimized portfolio image audit

## Portfolio image data validation

  Portfolio image data validation summary
  
  Image records:        15
  Categories:           3
  Hero slides:          6
  Path rows:            60
  Errors:               0
  Warnings:             0
  Warnings as errors:   false
  
  Reports:
  asset-reports/portfolio-image-data-issues.txt
  asset-reports/portfolio-image-data-issues.csv
  asset-reports/portfolio-image-data-paths.csv
  asset-reports/portfolio-hero-slide-audit.csv
PASS: Portfolio image data validation

## Public image structure summary

  Public image structure summary
  
  Total files: 65
  Total size bytes: 25567386
  
  By section:
    portfolio: 60 files, 24799852 bytes
    ui: 5 files, 767534 bytes
  
  Portfolio renditions:
    display: 15 files, 5649420 bytes
    full: 15 files, 16908416 bytes
    texture: 15 files, 1795496 bytes
    thumb: 15 files, 446520 bytes
PASS: Public image structure summary

## Production build
PASS: Production build

## Result
VALIDATION PASSED
~~~

## Next recommended work

1. Commit the current dev work in logical chunks if not already committed.
2. Run full validation.
3. Test local editor import and removal once more.
4. Decide whether to merge dev into main or continue feature work on dev.
5. Keep main public-facing and stable.

