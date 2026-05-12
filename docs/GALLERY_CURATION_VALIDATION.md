# Gallery Curation Validation

`src/data/galleryCuration.json` is now included in the portfolio image data validator.

The validator checks:

- `galleryCuration.json` is an array when present.
- Each row has a unique `wallId`.
- `artworkId` references an image in `galleryImages.json` when assigned.
- `wallType` is one of the supported wall block types.
- `plaqueSide` is one of `auto`, `left`, `right`, or `none`.
- `displayOrder` is a positive integer.
- duplicate display orders are reported as warnings.
- active walls without assigned artwork are reported as warnings.

The validator now writes:

```text
asset-reports/portfolio-gallery-curation-audit.csv
```

This report gives a compact wall-by-wall audit of curation state without needing to open the editor.
