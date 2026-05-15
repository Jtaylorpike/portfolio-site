# Current Project Handoff — Phase 3 Active

Updated: 2026-05-15

## Current status

The Taylor Pike portfolio site is in a stable public-design state after Phase 2. The project has moved from public polish into Phase 3: content, photo selection, metadata, and curation.

Phase 0 is closed. The editor gallery map whitespace issue was fixed and confirmed by the user.

Phase 2 is closed. The public site polish work was pushed to both `dev` and `main`, and the user confirmed both remote branches showed the same top commit at that time.

Phase 3 is active. The next real work is importing, selecting, organizing, hiding/removing weak images, assigning metadata, selecting hero slides, and deciding what belongs in the 3D gallery.

## Current data shape from latest reviewed upload

Latest reviewed upload: `TaylorPikePortfolio-ChatUpload-20260515-141337.zip`

Observed data summary:

```text
Gallery images: 67
Categories: 6
Hero slides: 6
Gallery wall slots: 17
```

Current category set:

```text
climbing
landscape
portraits
personal
brand-work
editorial
```

A separate `thumb.zip` was uploaded with all 67 referenced thumbnails present. It also contained a small set of extra legacy/unreferenced thumbnail files, which can be cleaned later during an asset cleanup pass.

## Active architecture

The project remains:

```text
Vite + TypeScript
vanilla modules
Three.js gallery
Flask local editor under local-editor/
active data under src/data/
```

Active editable data lives in:

```text
src/data/galleryImages.json
src/data/categories.json
src/data/heroSlides.json
src/data/galleryCuration.json
src/data/galleryRoom.json
```

Stale deployed data under `public/data/` should not be restored as active data.

## Active public image structure

The active image structure is rendition-based:

```text
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/portfolio/texture/
public/images/portfolio/full/
public/images/ui/cards/
```

There is currently no active `public/images/logo/` folder. Do not reference, stage, or require that folder unless logo assets are intentionally restored later.

## Recently completed public-site baseline

Completed public polish included:

```text
Homepage hero-only simplification
Removal of unnecessary homepage below-hero UI
Desktop no-scroll homepage behavior for normal 1920x1080 screens
Portfolio header cleanup
Removal of red portfolio header line
Removal of awkward portfolio Open Gallery button
Mobile homepage layout cleanup
Mobile hero performance improvement
Mobile metadata compaction
Portfolio category rail scroll-position preservation
Lightbox accessibility and mobile swipe behavior
Pixel/VCR font scoped only as a secondary numeric accent
```

The pixel/VCR font should remain a secondary or tertiary accent only, especially for minor interface details such as hero slide numbering. It should not replace primary typography, and the `Taylor Pike` header/wordmark should not use it.

## Copy authorship policy

The user wants to write the final website copy. Do not generate or replace final public-facing copy unless explicitly asked.

This matters especially for the About page. Current About copy should be treated as placeholder or user-provided only if the user confirms it. Future work may structure the page, placeholders, or fields, but final prose should come from the user.

## Phase 3 direction

Phase 3 is content and metadata curation.

Recommended workflow:

```text
1. Import the real image set.
2. Remove or hide test/weak images.
3. Assign each image to a primary category.
4. Add basic metadata: title, year, location, category.
5. Select final or likely hero candidates.
6. Choose a smaller subset for the 3D gallery.
7. Validate image data and build.
8. Commit stable batches on dev.
```

The portfolio does not need subcategories yet. If organization becomes difficult later, add an optional `series` or `collection` field rather than a deep nested category tree.

Current recommended total portfolio size:

```text
Minimum viable portfolio: 18–24 photos
Strong complete portfolio: 30–45 photos
Probably too much for launch: 60+ photos
```

A good launch target is roughly:

```text
5–8 homepage hero slides
30–40 portfolio index images
12–18 3D gallery room images
```

## Future editor backlog

Do not treat these as Phase 3 blockers unless the user asks to pause curation and improve tooling.

Requested future editor/import improvements:

```text
Add remove button to each import review card.
Rename final import action to something like “Import X photo(s)”.
Add import progress bar.
Add log/status text showing which photo is being imported.
Add estimated progress/time for larger imports if feasible.
Consider creating a new category directly from the category dropdown.
```

Requested future curation controls:

```text
Add hide/show from public website without deleting data or rendition files.
Add bulk select image cards.
Add bulk hide/show.
Add bulk category changes.
Add bulk hero-candidate selection.
Possibly add bulk gallery eligibility, but not bulk physical gallery placement.
Fix rename ID + rendition workflow bug where the file ID updates but title and suggested title/ID revert to the original values.
```

Hiding should be reversible and data-preserving. Removing/deleting should remain separate and destructive.

## Future phases

After Phase 3 curation, likely next phases are:

```text
Alt text generation after image set is near-final.
Focused SEO/discoverability pass.
About/contact structural redesign using user-authored copy.
Mobile 3D gallery controls with touch movement and drag-to-look camera.
Later 3D gallery room expansion, larger room presets, non-square/private archive room concepts.
```

## Upload script status

The old chat upload script was stale and did not package the active runtime image folders or docs. A new replacement script has been prepared to include:

```text
src/
scripts/
local-editor/
docs/
PROJECT_CHANGELOG.md
public/fonts/
active portfolio runtime image folders depending on -RuntimeImageMode
```

Use `docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md` for the current upload process.
