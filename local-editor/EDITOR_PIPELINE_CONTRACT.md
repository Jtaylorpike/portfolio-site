# Editor pipeline contract

This local editor must follow the active data, image, and editor contract documented in:

```text
docs/CURRENT_PROJECT_HANDOFF.md
```

Core rules:

```text
Active data lives in src/data/
Portfolio image folders are organized by rendition, not category
The editor should not recreate public/data
The editor should not create category-named image folders
Imported images should go through source-images/inbox + Import-PortfolioImages.ps1
Validation should pass before committing editor changes
Historical pipeline details remain searchable by original filename in docs/PROJECT_HISTORY_ARCHIVE.md
```
