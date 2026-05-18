# Pack Notes — Phase 7B Domain + Lighthouse Baseline Prep

## Purpose

Update the SEO/crawl baseline for the intended public domain and add a repeatable Lighthouse runner before making any routing decision.

## Files included

```text
index.html
public/robots.txt
public/sitemap.xml
src/data/siteSeo.json
src/data/siteSeo.ts
scripts/Run-LighthouseBaseline.ps1
PROJECT_CHANGELOG.md
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE7_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE7B_DOMAIN_LIGHTHOUSE_BASELINE.md
docs/pack-notes/PACK_NOTES_PHASE7B.md
docs/pack-manifests/PACK_MANIFEST_PHASE7B.txt
```

## Apply notes

Apply this pack over the current Phase 7A source state.

After applying, run:

```powershell
npm run build
```

Then run Lighthouse locally if desired:

```powershell
.\scripts\Run-LighthouseBaseline.ps1
```

Or, after deploying/DNS is ready:

```powershell
.\scripts\Run-LighthouseBaseline.ps1 -Url https://taylorpike.com/
```

## Scope exclusions

- No favicon/logo update.
- No app-icon update.
- No social preview image asset.
- No hash-router replacement.
- No public visual design changes.
- No gallery control changes.
- No editor behavior changes.
- No final metadata-copy rewrite.
- No image/gallery curation changes.
