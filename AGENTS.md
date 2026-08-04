# Repository guidance for AI coding agents

This file is the shared operating guide for AI tools working in this repository. Follow explicit user instructions first. Then follow this file, the active source, and `docs/CURRENT_PROJECT_HANDOFF.md`, in that order. Historical notes in `docs/PROJECT_HISTORY_ARCHIVE.md` are context only and may describe superseded behavior.

## Project summary

- Public portfolio: Vite, TypeScript, semantic HTML, and plain CSS.
- Virtual gallery: vanilla Three.js loaded only when requested.
- Content editor: local Flask application under `local-editor/`.
- This is not a React project. Do not introduce a framework without explicit approval.
- Canonical public domain: `https://taylorpike.com/`.
- Current hosting: GitHub Pages with hash routes. Crawlable non-hash routes are deferred until the planned Cloudflare migration.
- Cloudflare infrastructure, authentication, remote storage, and deployment work are not current scope unless explicitly requested.

## Start here

Before making a nontrivial change:

1. Read the relevant active files instead of relying on old phase notes.
2. Check `git status` and preserve unrelated or user-authored changes.
3. Consult `docs/CURRENT_PROJECT_HANDOFF.md` for protected baselines and deferred work.
4. For editor pipeline changes, also read `local-editor/EDITOR_PIPELINE_CONTRACT.md`.
5. Make the smallest coherent change and validate it in proportion to risk.

## Repository map

```text
index.html                         Static metadata and application mount point
src/app/                           Routing, public page rendering, interactions, SEO, gallery overlay
src/data/                          Authoritative editable JSON plus typed normalization modules
src/gallery/                       Three.js scene, architecture, controls, materials, lighting, framing
src/styles/global.css              Public-site styling
local-editor/app/                  Flask API, normalization, persistence, backups, imports
local-editor/static/js/            Editor rendering, collection, API client, interactions
local-editor/templates/editor.html Editor shell
public/images/portfolio/           display/thumb/texture/full portfolio renditions
public/images/about/               About-page renditions
scripts/                           Supported import, optimization, validation, audit, and launch utilities
tests/fixtures/                    Gallery layout fixtures
docs/                              Active handoff, historical archive, and alt-text source data
```

## Sources of truth

Active editable data lives in:

- `src/data/galleryImages.json`
- `src/data/categories.json`
- `src/data/heroSlides.json`
- `src/data/galleryCuration.json`
- `src/data/galleryRoom.json`
- `src/data/aboutPhotos.json`
- `src/data/aboutCopy.json`
- `src/data/siteSeo.json`
- `src/data/siteCopy.json`

`public/data/` is legacy/archive-only. Do not recreate it or make it authoritative.

The TypeScript modules beside the JSON files provide types, defaults, and normalization. When changing a data shape, update every layer that reads or writes it:

1. Active JSON and its TypeScript type/normalizer.
2. Public renderer and interactions.
3. Flask defaults and normalization in `local-editor/app/data_store.py`.
4. Editor rendering and collection code.
5. Preview behavior and validation where applicable.

An editor save must never silently discard newly introduced fields.

## User-owned content and files

- Treat final copy, image metadata, curation, crops, room layouts, and editor JSON as user-owned data.
- Do not replace reviewed copy with generated prose unless explicitly asked. Temporary prose must be clearly identifiable as placeholder copy.
- Do not invent factual years, locations, credits, or project details.
- Preserve unrelated dirty-worktree changes. Never reset, checkout, or rewrite them to simplify a task.
- Keep image IDs synchronized with rendition filenames across `display`, `thumb`, `texture`, and `full`.
- Do not delete or archive images merely because they appear unreferenced without explicit approval and a reference audit.

## Public-site rules

- Preserve semantic HTML, keyboard operation, visible focus, reduced-motion behavior, meaningful alt text, and minimum 44px compact-layout interaction targets.
- The traditional portfolio is the stable accessible baseline. The virtual gallery must have an explicit unsupported-WebGL fallback linking to the traditional portfolio.
- Keep dialog controls discoverable; modal content must isolate the page behind it from focus and the accessibility tree.
- Use `import.meta.env.BASE_URL` for public asset paths when code needs deployment-path compatibility.
- Keep SEO titles, descriptions, Open Graph/Twitter metadata, and structured data consistent. The professional descriptor is `Photographer and multidisciplinary creative` unless the user changes it.
- Do not reintroduce `Taylor Pike Productions` branding or professional social-media links.
- The public header intentionally uses the current Taylor Pike text/symbol treatment; do not substitute a logo lockup without direction.

## Homepage and About rules

- Homepage hero presentation is landscape 16:9 with cover behavior and image-specific `heroPosition` cropping.
- Do not add portrait or square records to `heroSlides.json` through the editor.
- The About page and its visual collage editor must remain in parity for position, size, aspect, layer, rotation, opacity, and crop behavior.
- About copy remains data-backed and editable. Schema changes must round-trip through the local editor and its backup/save path.
- Decorative About imagery must not extend the document scroll range below the footer.

## Virtual gallery rules

- Preserve the accepted gallery lighting/material baseline unless the user explicitly requests a new pass.
- Do not add benches, plinths, loose props, fog, post-processing, dependencies, or game-like geometry without approval.
- Keep architecture, wall placement, curation, spawn behavior, collision, and quality-tier behavior data-driven where practical.
- The default room/spawn must remain safe, and the last remaining room must not be deletable.
- When changing artwork framing, mirror the rule in the local editor preview.
- Frames, including borders, must fit within their physical wall dimensions with safe margins.
- Validate both the production room and the multi-room/hallway fixture.
- Auto quality may promote on sustained measured performance but should avoid oscillation; Save-Data and slow-network constraints remain hard limits.
- Diagnostics are local-only and send no telemetry.

## Local editor rules

- The editor is a trusted local content-management tool, not a public production server.
- Keep browser/API/storage boundaries clean so the Flask backend can later be replaced without redesigning the UI.
- Keep request/response contracts independent of Flask-specific implementation details.
- Persistence and backup behavior belongs behind backend functions, not browser code.
- Preserve atomic JSON writes, complete restore points, focused save endpoints, recoverable dirty state, and prevention of overlapping writes.
- Preserve the Macintosh/System 6-inspired editor language already established in the active UI. Do not introduce an unrelated generic dashboard style.
- Editor changes should remain compact, image-first, keyboard accessible, and visually consistent with existing controls.
- Use `scripts/Run-LocalEditor.ps1` or `python local-editor/editor.py` from the repository root for local testing.

## Development and validation

Use Node.js 24.x. The repository pins this major in `.nvmrc`, declares it in `package.json`, and uses it in the GitHub Pages workflow.

### Tool responsibilities

- Codex owns implementation: adding features, changing existing architecture, maintaining editor/public data parity, and applying fixes from confirmed findings.
- Google Antigravity owns runtime debugging, browser smoke testing, and performance testing.
- Do not start browser smoke tests, performance benchmarks, or exploratory runtime debugging in Codex unless the user explicitly requests an exception.
- Codex must still run implementation-level checks that do not duplicate Antigravity: builds, type checking, syntax checks, JSON/data validation, layout fixtures, and `git diff --check` as relevant.
- Report which static checks Codex completed and leave runtime/performance acceptance to the Antigravity results supplied by the user.

Install reproducibly when needed:

```powershell
npm ci
```

Common commands:

```powershell
npm run dev
npm run build
npm run preview
npm run validate:gallery-layout
npm run build:gallery-fixture
node scripts/validate-portfolio-image-data.mjs
git diff --check
```

Minimum validation by change type:

- Public TypeScript/CSS/data: `npm run build` and `git diff --check`.
- Portfolio records/assets: also run `node scripts/validate-portfolio-image-data.mjs`.
- Gallery architecture, framing, collision, or traversal: also run `npm run validate:gallery-layout`; use `npm run build:gallery-fixture` when fixture rendering matters.
- Editor JavaScript: run `node --check` on changed plain-JS modules and smoke the affected editor route.
- Flask/Python: parse or compile changed Python and exercise the affected API/save path when practical.
- Responsive/accessibility changes: implement against the established contracts, then leave browser, keyboard, error-state, and viewport smoke testing to Google Antigravity unless explicitly requested otherwise.

Do not claim browser, device, high-GPU, or deployed-domain validation that was not actually performed.

## Git and release behavior

- Do not commit, push, deploy, or change external state unless the user asks.
- Before a requested commit: inspect status and the complete diff, run relevant validation, and include only intended files.
- Never use destructive Git commands to discard user changes.
- `dev` is the integration and validation branch. New work must be committed and pushed to `dev` first unless the user explicitly authorizes an exception.
- Before publishing, confirm the working tree is clean, local `dev` matches `origin/dev`, and `dev` contains the intended validated changes without unrelated files.
- `main` is the live deployment branch. Merge the accepted `dev` state into an up-to-date `main`, then push `main`; that push triggers the GitHub Pages deployment workflow.
- Do not develop directly on `main` or push a feature commit straight to `main` under the normal workflow.
- After pushing, report the commit hash and distinguish "pushed/deployment triggered" from "verified live."
- Search Console crawl requests and future Cloudflare migration steps require explicit user action or authorization.

## Documentation

- Keep this file concise and operational.
- Update `docs/CURRENT_PROJECT_HANDOFF.md` for durable roadmap, protected-baseline, data-contract, or deferred-scope decisions.
- Put historical detail in `docs/PROJECT_HISTORY_ARCHIVE.md`; do not let historical checkpoints override active source.
- Update README only when the public architecture or standard developer workflow materially changes.
