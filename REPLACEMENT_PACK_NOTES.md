# TaylorPikePortfolio-ValidationEmptyReportFixPack-20260512

## Included files
- `scripts/Audit-PublicImageReferences.ps1`
- `scripts/Validate-PortfolioDevBranch.ps1`
- `PROJECT_CHANGELOG_APPEND_20260512_EMPTY_REPORT_FIX.md`
- `REPLACEMENT_PACK_NOTES.md`

## Purpose
Fix the false validation failure where the audit summary says zero missing files but validation still fails.

## Root cause
The summary was current, but `public-image-missing.txt` still contained stale rows from an earlier audit. Windows PowerShell can leave old report content behind when an empty array is written through `Set-Content`.

## What changed
- The audit script now removes old report files before writing new ones.
- Empty reports are explicitly recreated as empty files.
- The validation script reads the missing count from `public-image-reference-summary.txt`.

## Run
```powershell
.\scripts\Audit-PublicImageReferences.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
```
