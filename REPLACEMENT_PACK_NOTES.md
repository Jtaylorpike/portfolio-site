# TaylorPikePortfolio-StalePublicDataArchivePack-20260512

## Included files
- `scripts/Archive-StalePublicData.ps1`
- `scripts/Audit-PublicImageReferences.ps1`
- `docs/STALE_PUBLIC_DATA_CLEANUP.md`
- `PROJECT_CHANGELOG.md`
- `REPLACEMENT_PACK_NOTES.md`

## Purpose
Fix public image audit failures caused by stale `public/data` files.

## Why this pack exists
The current audit found four missing image references:

```text
/images/climbing/climbing-01.webp
/images/commercial/commercial-01.webp
/images/personal/personal-01.webp
/images/portraits/portrait-01.webp
```

Those references come from `public/data/projects.json`, not the active app data.

## Workflow
Dry run:

```powershell
.\scripts\Archive-StalePublicData.ps1
```

Review:

```text
asset-reports\archive-stale-public-data-plan.txt
```

Apply:

```powershell
.\scripts\Archive-StalePublicData.ps1 -Apply
```

Then re-run:

```powershell
.\scripts\Audit-PublicImageReferences.ps1
```

Expected:

```text
Missing referenced files: 0
```

## Safety
- `public/data` files are moved into `asset-archive/`.
- Nothing is permanently deleted.
- Do not commit `asset-archive/`.
