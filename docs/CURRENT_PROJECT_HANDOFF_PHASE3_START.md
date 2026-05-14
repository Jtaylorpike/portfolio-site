# Current Project Handoff — Phase 3 Start

Date: 2026-05-14
Project: Taylor Pike Portfolio Site
Status: Phase 3 started

## Current known branch state

The user confirmed that both `origin/dev` and `origin/main` show the same Phase 2 public-polish top commit:

```text
cf7886c Polish public portfolio experience
```

A docs-only Phase 2 closeout pack was created after that checkpoint. Whether that closeout documentation has been committed to `dev` and/or merged to `main` should be verified from the current repository state.

## Current project architecture

- Vite + TypeScript static portfolio site.
- Vanilla TypeScript modules, not React.
- Three.js is used for the virtual gallery experience.
- Local editor is Flask-based under `local-editor/`.
- Active editable data lives in `src/data/`.
- Runtime images use rendition folders under `public/images/portfolio/`.
- Deprecated category-folder image architecture and `public/data` should not be restored.

## Active data areas

- `src/data/galleryImages.json`
- `src/data/categories.json`
- `src/data/heroSlides.json`
- `src/data/galleryCuration.json`
- `src/data/galleryRoom.json`
- `src/data/images.ts`

## Runtime image structure

```text
public/images/portfolio/full/
public/images/portfolio/display/
public/images/portfolio/texture/
public/images/portfolio/thumb/
public/images/ui/cards/
public/images/logo/
```

Categories belong in JSON, not image folder names.

## Phase 0 status

Phase 0 is complete. The user confirmed the gallery map whitespace closure pack fixed the remaining editor map whitespace issue.

## Phase 1 status

Phase 1 public-site audit/documentation was completed.

## Phase 2 status

Phase 2 public polish is functionally complete and was pushed to both `dev` and `main` according to the user confirmation.

Phase 2 included:

- Restoring the VCR/pixel font as a narrowly scoped accent rather than primary UI typography.
- Homepage hero-only simplification.
- Removing redundant below-hero homepage UI.
- Removing the portfolio header red underline.
- Removing the awkward portfolio meta-strip gallery button.
- Improving public responsive baseline.
- Refining mobile homepage spacing, hero content density, metadata layout, and hero performance.
- Improving lightbox accessibility and mobile swipe interaction.
- Keeping final public copy user-authored.

## Important design constraints

- The homepage should not require scrolling on a normal 1920x1080 desktop viewport in the current hero-only state.
- Tablet/mobile scroll is still allowed where needed.
- The VCR/pixel-style font should be used only as a secondary/tertiary accent, especially for minor numeric details such as hero slide numbering.
- The `Taylor Pike` header/wordmark should not use the pixel font.
- The user does not want AI-generated final website copy, especially About page copy.
- The About/contact redesign is future work and should include cascading personal photos in the background with user-authored text blocks.
- The 3D gallery should eventually be viewable on mobile with Minecraft-like touch movement controls and drag-to-look camera behavior, but that is not part of Phase 3A.

## Phase 3 current objective

Phase 3 is content and metadata curation. The user likely needs to spend time in the editor adding/choosing photos and filling metadata. This phase may be completed partially before launch and finished later.

Phase 3 should prioritize:

- Public image selection.
- Removing or hiding placeholder/test images.
- Completing metadata for public images.
- Choosing hero-eligible images.
- Curating the portfolio index categories.
- Curating the first intentional 3D gallery room set.
- Running validation after meaningful data/image changes.

## Recommended immediate next step

Start with a curation session in the local editor. Do not begin another visual redesign pack unless a specific blocker is discovered during content curation.

Recommended commands:

```powershell
cd C:\Users\jtayl\portfolio-site
git checkout dev
.\scripts\Audit-LocalEditorCompatibility.ps1
.\scripts\Run-LocalEditor.ps1
```

## Validation commands

Use these after meaningful changes:

```powershell
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
npm run build
```

## Future phases

- Phase 3: Portfolio content and metadata curation.
- Phase 4: Dedicated SEO/discoverability pass.
- Phase 5: About/contact redesign with cascading personal-photo background and user-authored text blocks.
- Phase 6: Mobile virtual-gallery controls.
- Phase 7: 3D room model expansion and non-square/private archive room work.
- Final launch pass: accessibility, performance, SEO, content, image readiness, and deployment verification.
