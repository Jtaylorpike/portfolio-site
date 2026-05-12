# Editor pipeline contract

This local editor must follow the portfolio image pipeline documented in:

```text
docs/LOCAL_EDITOR_IMAGE_PIPELINE_CONTRACT.md
```

Core rules:

```text
Active data lives in src/data/
Portfolio image folders are organized by rendition, not category
The editor should not recreate public/data
The editor should not create category-named image folders
Imported images should go through source-images/inbox + Import-PortfolioImages.ps1
Validation should pass before committing editor changes
```
