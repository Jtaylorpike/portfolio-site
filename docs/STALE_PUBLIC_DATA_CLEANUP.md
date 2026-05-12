# Stale public data cleanup

## Problem

The active portfolio data now lives in:

```text
src/data/
```

Old files under:

```text
public/data/
```

can still be deployed as public runtime files. If they reference old image paths, the image audit will correctly report those as missing references.

In the current audit, the missing references came from stale `public/data/projects.json`, not from the active app data.

## Rule

Do not keep stale JSON in `public/`.

If a public data snapshot is useful for historical reference, move it to:

```text
asset-archive/
```

`asset-archive/` is ignored by Git and should remain local.

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

Expected result:

```text
Missing referenced files: 0
```

After that, continue with legacy public image archiving.

## Git

After applying, Git should show deleted files under `public/data/`.

That is expected. The archived copies under `asset-archive/` should not be committed.
