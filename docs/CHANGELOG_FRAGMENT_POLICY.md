# Changelog fragment policy

## What changelog append files are

Files named like this are temporary replacement-pack fragments:

```text
PROJECT_CHANGELOG_APPEND_*.md
```

They exist so a replacement pack can describe its changes without replacing the current `PROJECT_CHANGELOG.md`, which may already have newer local edits.

## What should happen to them

After a pack has been applied and validated:

1. Append the fragment contents into `PROJECT_CHANGELOG.md`.
2. Move the fragment files into `asset-archive/`.
3. Commit `PROJECT_CHANGELOG.md`, not the root fragment files.

## Normal workflow

Dry run:

```powershell
.\scripts\Consolidate-ChangelogFragments.ps1
```

Review:

```text
asset-reports/changelog-fragment-consolidation-plan.txt
```

Apply:

```powershell
.\scripts\Consolidate-ChangelogFragments.ps1 -Apply
```

Validate:

```powershell
.\scripts\Validate-ChangelogFragmentsClean.ps1
```

## Replacement pack notes

`REPLACEMENT_PACK_NOTES.md` is also temporary. It is useful while applying a pack, but it should not remain as a permanent root file.

Archive it while consolidating fragments:

```powershell
.\scripts\Consolidate-ChangelogFragments.ps1 -Apply -IncludePackNotes
```

## What to commit

Commit:

```text
PROJECT_CHANGELOG.md
source files changed by the pack
docs that should remain in the repo
scripts that should remain in the repo
```

Do not commit:

```text
PROJECT_CHANGELOG_APPEND_*.md
REPLACEMENT_PACK_NOTES.md
asset-archive/
asset-reports/
```

## Why fragments exist at all

They make replacement packs safer. A pack can include a changelog update without overwriting whatever local `PROJECT_CHANGELOG.md` currently contains.
