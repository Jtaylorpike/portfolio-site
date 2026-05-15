# Taylor Pike Portfolio — Current Project Handoff

Updated: 2026-05-15

## Current status

The Taylor Pike portfolio site is in **Phase 3: portfolio content, image, and metadata curation**.

Phase 0 is closed. The local editor gallery map whitespace issue was fixed and confirmed working by the user.

Phase 1 is closed. The public-site audit and documentation pass was completed.

Phase 2 is closed. Public polish was completed and pushed so that `dev` and `main` matched at the confirmed checkpoint. The public design baseline is stable and should not be churned unless the user identifies a specific issue.

Phase 3 is active. The user is importing, selecting, organizing, and metadata-tagging the real portfolio image set. The user is happy with the overall portfolio design direction.

## Source of truth rules

Fresh uploaded current source files are the source of truth. If current source conflicts with memory, older handoffs, or previous replacement packs, follow the current source.

Keep the `docs/` folder updated as part of meaningful project changes. The docs folder is both a chatbot handoff mechanism and a human-readable project record.

Do not treat older handoff snapshots as authoritative when they conflict with the current repo. In particular, older references to `public/images/logo/` are stale unless the current source actually contains that folder.

## Current architecture

- Vite + TypeScript static portfolio site.
- Vanilla TypeScript modules, not React.
- Three.js-powered public 3D gallery.
- Local editor is Flask-backed under `local-editor/`.
- Active data lives in `src/data/`.
- `public/data/` is stale/archive-only and should not be restored as active data.
- Public image paths are resolved through `import.meta.env.BASE_URL` for GitHub Pages project-path deployment.

## Active data files

```text
src/data/galleryImages.json
src/data/categories.json
src/data/heroSlides.json
src/data/galleryCuration.json
src/data/galleryRoom.json
src/data/images.ts
```

## Active runtime image structure

```text
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/portfolio/texture/
public/images/portfolio/full/
public/images/ui/cards/
```

There is currently **no active `public/images/logo/` folder**. Do not add or stage it unless logo assets are intentionally restored later.

## Current public-site baseline

The public site currently uses a hero-only homepage. The extra below-hero UI was removed because it created unnecessary scroll/visual weight.

The homepage should not require scrolling on a normal 1920x1080 desktop viewport in the current hero-only state.

The portfolio/index page had the red accent underline removed from the header. The extra “Open gallery room” button was removed from the portfolio meta strip because the gallery is already reachable from the top navigation and hero CTA.

The VCR/pixel-style font should be used only as a secondary or tertiary accent, especially on minor numeric UI details such as hero slide numbering. It should not replace primary interface typography and should not be used for the “Taylor Pike” header/wordmark text.

Final site copy should be written by the user. Do not generate final website prose, especially About page copy, unless the user specifically asks for draft copy.

## Mobile baseline

The public mobile pass included:

- tighter spacing between nav and hero;
- no mobile Enter Virtual Gallery button;
- no main hero body copy on mobile;
- mobile hero content reduced to Selected Work + View Portfolio;
- corrected Visual Index number spacing;
- compact two-column hero metadata where screen width allows;
- preserved portfolio category rail scroll position after category changes;
- mobile hero image performance improvements using smaller mobile-preferred sources and deferred preload behavior.

The future 3D gallery mobile goal is separate: the gallery should eventually be viewable on mobile with touch movement controls similar to Minecraft mobile plus drag-to-look camera controls. That has not been implemented yet.

## Phase 3 current work

The user is curating the real portfolio image set. The current practical work is:

1. Import final/near-final images.
2. Hide/remove weak, duplicate, or test images.
3. Assign categories.
4. Add and refine metadata.
5. Choose final hero slides.
6. Decide which images belong in the 3D gallery.
7. Keep the public site structure stable while the content matures.

The user expects to complete some metadata now and finish the rest closer to launch.

## Alt text workflow

An alt-text first pass was generated from the thumbnail set and committed by the user. The project has an alt-only update script:

```text
scripts/Apply-PortfolioImageAltTextOnly.mjs
```

The script is intentionally designed to overwrite only the `alt` values in `src/data/galleryImages.json`, not reserialize or rewrite the entire JSON file.

## Future editor backlog

Do not start these unless the user explicitly loops back to editor tooling:

- Add hide/show controls for public website visibility without deleting image data or rendition files.
- Add bulk selection and bulk edit controls.
- Bulk hide/show selected photos.
- Bulk category reassignment.
- Bulk mark/clear hero candidates rather than bulk-setting final hero slides.
- Possibly bulk mark/clear gallery eligibility.
- Add remove buttons to import review cards.
- Rename “save review import” to a clearer label such as “Import X photo(s)”.
- Add import progress bar and log/status text for larger imports.
- Consider creating new categories directly from the category dropdown.
- Fix the rename ID + rendition files workflow bug where the file ID updates, but title/suggested title/ID fields revert to the original value.

## Future roadmap after Phase 3

- Finish content/metadata curation.
- Review and finalize hero slide selection.
- Review and finalize 3D gallery curation.
- Do a focused SEO/discoverability phase later.
- Do a final launch pass for performance, accessibility, social previews, indexing, and copy completeness.
- Later, return to advanced 3D gallery expansion: larger room, non-square/private archive layout, windows/time-of-day ideas, and mobile 3D controls.
