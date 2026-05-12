# Image removal workflow

## Purpose

Use this when you need to remove a test import or retire an image from the portfolio.

It removes the image record from:

```text
src/data/galleryImages.json
```

and also removes any matching hero slide from:

```text
src/data/heroSlides.json
```

The image files are not deleted. They are moved to:

```text
asset-archive/removed-images-YYYYMMDD-HHMMSS/
```

unless you use `-KeepFiles`.

## Dry run

```powershell
.\scripts\Remove-PortfolioImageRecord.ps1 -ImageId "landscape-201019-jtp6059"
```

Review:

```text
asset-reports/remove-portfolio-image-record-plan.txt
asset-reports/remove-portfolio-image-record-files.csv
```

## Apply

```powershell
.\scripts\Remove-PortfolioImageRecord.ps1 -ImageId "landscape-201019-jtp6059" -Apply
```

## Remove only the JSON record and keep files in place

```powershell
.\scripts\Remove-PortfolioImageRecord.ps1 -ImageId "landscape-201019-jtp6059" -Apply -KeepFiles
```

## Validation

After removal:

```powershell
.\scripts\Audit-PublicImageReferences.ps1
.\scripts\Audit-OptimizedPortfolioImages.ps1
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
```

## Safety

Before writing JSON, the script backs up:

```text
src/data/galleryImages.json
src/data/heroSlides.json
```

to:

```text
asset-archive/json-backups/
```

Do not commit:

```text
asset-archive/
asset-reports/
```
