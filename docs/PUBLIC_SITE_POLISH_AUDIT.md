# Public Site Polish Audit

Generated: 2026-05-13
Phase: public-facing audit and polish direction

## Purpose

This document records the public-site polish direction after editor/gallery tooling stabilized and after the Phase 0 Gallery map whitespace closure was confirmed working.

This is a direction document, not a redesign mandate. It should help future chats and human developers understand what “polish” means for this project before changing the public-facing UI.

## Source-of-truth rule

The current uploaded source files are the source of truth. Chat summaries, memories, and older handoffs are context only. If there is a conflict, inspect the current files first.

## Current public-site structure

The public site currently has these major user-facing routes and systems:

- Entry route / desktop landing choice
- Home route
- Portfolio route with category filters
- About route
- Fullscreen image lightbox
- Virtual gallery overlay
- Mobile gallery fallback dialog

Relevant files for public-site work:

- `index.html`
- `src/app/renderSite.ts`
- `src/app/sitePages.ts`
- `src/app/siteRouter.ts`
- `src/app/siteInteractionsController.ts`
- `src/app/galleryController.ts`
- `src/app/heroFraming.ts`
- `src/styles/global.css`
- `src/data/galleryImages.json`
- `src/data/heroSlides.json`
- `src/data/categories.json`
- `src/data/galleryCuration.json`
- `src/data/galleryRoom.json`

## Audit limitation

The chat-upload source package does not include the real runtime image folders. Placeholder WebP files may be generated locally for validation only, but those placeholder files should never be included in replacement packs or committed. Final visual checks need to happen against the user’s local project with the real images present.

## Current strengths

### Overall design direction

The current design direction is working. The public site already has the dark editorial/gallery-index foundation the project has been moving toward:

- dark charcoal/black visual system
- large hero-image stage
- left-side visual index rail
- bottom contact-sheet thumbnail strip
- small metadata panels
- thin guide-line/grid language
- refined archive/gallery feel instead of a generic photographer template

The public site does not need a broad conceptual reset. Future work should refine and tighten the existing direction.

### Data-backed image system

The site is driven by structured data in `src/data/`. The public pages, hero, portfolio index, lightbox, and gallery can all draw from the same image records. This is a strong foundation for later portfolio/index polish once more final images and metadata are added.

### Locked homepage hero behavior

`src/app/heroFraming.ts` intentionally locks the homepage hero into a landscape 16:9 cover frame. This prevents the hero from resizing or shifting between portrait, square, and landscape images. That decision should remain in place unless there is a specific reason to reopen it.

### Public SEO baseline exists

`index.html` already contains a baseline SEO layer: title, description, author, robots, theme color, Open Graph, Twitter card metadata, and Person JSON-LD. This is not a final SEO phase, but it is no longer a blank SEO slate.

## Must fix before launch

### 1. User-authored copy must replace placeholder/public copy

The user wants to write the final website copy personally. Existing copy should be treated as placeholder or working copy unless the user explicitly decides to keep a line.

This applies especially to:

- About page heading and paragraphs
- Home page intro section if one returns later
- Home archive note cards if a below-hero section returns later
- Portfolio page heading
- Entry page headline and paragraph
- Gallery fallback text
- CTA labels and microcopy if the user wants control over them

Future chats should not generate final public-facing About page copy unless explicitly asked. They may create structure, fields, placeholder labels, and layout scaffolding, but final prose should come from the user.

### 2. Pixel/accent font scope must remain narrow

The VCR/pixel font file exists at:

- `public/fonts/VCR_OSD_MONO_1.001.ttf`

Current rule:

- use the VCR/pixel font only as a secondary or tertiary accent
- good uses are minor numeric details such as hero slide numbers and small archive counters
- do not use it for the `Taylor Pike` wordmark/header text
- do not use it broadly for nav, buttons, labels, or paragraph copy

### 3. Mobile gallery currently blocks the gallery instead of enabling mobile controls

`src/app/galleryController.ts` currently routes mobile/touch users into a desktop-only fallback message. That was acceptable earlier, but it conflicts with the current direction that the 3D gallery should remain viewable on mobile.

Future mobile work should replace the fallback-only strategy with a touch control scheme:

- on-screen movement control similar to Minecraft mobile
- drag-to-look camera movement
- clear mobile control guidance
- accessible exit/control buttons

This is not a Phase 2 homepage fix unless mobile becomes the immediate priority. It belongs to the mobile pass.

### 4. About/contact page needs a structural redesign later

The About route is currently text-forward and simple. The desired future direction is a more designed page with personal photos cascading through the background and text blocks about:

- the user
- the project
- the user’s career journey so far
- photography

The page should be redesigned structurally, but final copy should be user-authored.

## Phase 2B implementation note

Phase 2B made a CSS-only homepage polish pass. It refined the current homepage without changing copy, image data, route behavior, editor behavior, or gallery behavior.

The next public polish step should likely be Phase 2C: portfolio/index polish.


## Phase 2C implementation note

Phase 2C made a portfolio/index polish pass. It refined the category sidebar, generated category counts from the current image data, separated image-card metadata into category/title/detail lines, tightened grid rhythm and hover/focus treatment, and lightly refined the image lightbox caption hierarchy.

No public website copy, About page copy, editor code, image data, gallery room data, or gallery behavior was changed.

## Should improve soon

### 1. Portfolio/index hierarchy

The portfolio page should feel like the archive layer of the site. It currently has the right general structure: category sidebar, heading, meta strip, masonry-style grid, and lightbox.

Future polish should review:

- category sidebar width and sticky behavior
- masonry spacing and stagger amount
- thumbnail crop consistency
- image metadata density
- title/year/location visibility
- hover treatment subtlety
- lightbox caption layout
- mobile grid density

The user may need to add more final photos and metadata in the editor before this phase can be completed fully.

### 2. Gallery entry CTA clarity

The virtual gallery needs to be introduced as an intentional interactive archive, not as a hidden experiment.

Review gallery CTA placement and language on:

- entry page
- homepage hero
- homepage copy section
- portfolio meta strip
- mobile/fallback states

The CTA should make clear that the gallery is a navigable room/archive experience.

### 3. Header/nav refinement

The header is functional and visually close, but should continue to be reviewed for:

- brand spacing
- brand field text
- active nav indication
- mobile wrapping
- sticky behavior
- whether “Gallery” should be a button, nav item, or more editorial CTA depending on page context

### 4. Route-specific metadata later

The current app has a single static `index.html` metadata set. That is acceptable for now, but the SEO phase should consider route-aware titles/descriptions or at least stronger global metadata.

## Optional creative enhancements

These are not required before launch, but could strengthen the site if time allows:

- a more deliberate entry route for desktop visitors
- subtle archive/catalog numbers in more places
- improved loading states for images and gallery textures
- small page-transition polish between routes
- richer portfolio lightbox details after metadata is more complete
- optional “best experienced in gallery” cross-linking for selected work
- design hooks for a future late-90s/early-2000s mode toggle

## Future experimental ideas

These should not distract from launch polish:

- larger gallery room
- non-square/private archive gallery layout
- corridors, alcoves, side rooms, or archive shelves
- window wall and time-of-day lighting
- mobile-first gallery interaction system
- alternate site theme/mode after the main portfolio is stable


## Phase 2D follow-up — Gallery entry CTA polish

Status: implemented, then scope-corrected after visual review.

Gallery entry should feel intentional, but not by making the homepage archive/status strip visually uneven. The corrected direction keeps that strip as three balanced boxes. The `02 / Spatial` card no longer carries an internal Enter button, control chips, or a special one-off visual treatment. The top-nav Gallery button should not have a red/accent dot marker.

## Phase 2D follow-up — Homepage below-hero simplification

Status: implemented after visual review.

The homepage had two separate below-hero UI/content sections competing for the same role: a large intro/CTA copy block and the three-card archive/status strip. The chosen direction is to keep the three balanced boxes only.

The homepage should now flow from the hero slideshow directly into the three archive/status boxes. This keeps the public front door simpler and avoids repeating CTA and positioning language below the hero.

Future homepage work should avoid adding another below-hero summary/CTA band unless the section is intentionally redesigned as a single condensed slide or a broader homepage restructure.

The portfolio route's `Open gallery room` action can keep its clearer arrow affordance. Primary gallery entry still exists through the homepage, entry page, nav button, and portfolio route.

This phase did not attempt mobile gallery controls. Mobile gallery movement remains a later Phase 6 task.

## Phase 2E follow-up — Homepage hero-only simplification

Status: implemented.

The homepage no longer renders a secondary UI section below the hero slideshow. The earlier duplicate intro/CTA block and the three-card archive/status strip have both been removed for now. The current home route should be evaluated as a hero-first page, with any future below-hero content treated as a deliberate new structure rather than an incremental add-on.

Do not reintroduce both a large below-hero intro block and a three-card archive/status strip at the same time.

