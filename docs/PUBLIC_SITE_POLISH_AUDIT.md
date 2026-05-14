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

Phase 2F tightened the shared header/nav. The active route indicator should now read as a thin line rather than a dot, and the Gallery control should remain a button because it opens the virtual gallery overlay instead of navigating to a route.

Continue to review:

- brand spacing
- mobile wrapping
- sticky behavior
- whether the brand field text should remain as-is once the user finalizes copy/microcopy
- whether any additional contact affordance is needed globally later

### 4. Route-specific metadata later

The current app has a single static `index.html` metadata set. That is acceptable for now, but the SEO phase should consider route-aware titles/descriptions or at least stronger global metadata.



## Phase 2I implementation note

Phase 2I refined the public mobile baseline after visual review on a phone-width viewport. The pass focused on reducing vertical dead space, removing unnecessary mobile hero clutter, improving visual-index spacing, making hero metadata more compact, and preserving horizontal category-rail position when switching portfolio categories.

Specific mobile direction now recorded:

- the homepage hero should not show the `Enter Virtual Gallery` CTA on mobile
- the homepage hero statement/body copy should be hidden on mobile so only `Selected Work` and `View Portfolio` remain
- visual-index active markers should not render as misplaced dots/periods beside neighboring numbers
- mobile image/thumb/category rails should avoid heavy scroll-snap behavior that makes fast scrolling feel sluggish
- the portfolio category rail should remember its horizontal position after a category route change
- mobile page-top spacing should be tighter on home and portfolio, with About reduced more moderately

This is still separate from the future mobile 3D gallery-control phase.

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

## Phase 2G implementation note

Phase 2G tightened the current hero-only homepage so it should no longer create unnecessary desktop scroll on common 1920x1080-style viewports. It also simplified the portfolio/index heading by removing the red accent underline and removing the extra `Open gallery room` button from the meta strip.

The gallery remains reachable from the global navigation and from the homepage hero CTA. No final public copy, About page copy, editor code, image data, gallery data, or 3D gallery behavior was changed.

## Phase 2H implementation note

Phase 2H made a public responsive baseline pass after the homepage moved to the current hero-only state. It adjusted tablet/phone shell widths, mobile hero sizing, small-phone hero thumbnail behavior, horizontal rail touch scrolling, contact-link wrapping, mobile portfolio counter density, and mobile lightbox control placement.

This did not change public copy, About copy, editor files, image data, gallery curation, gallery room data, or virtual-gallery mechanics. It also did not attempt the future mobile 3D gallery control schema; that remains a later mobile/gallery phase.


## Phase 2J implementation note

Phase 2J responds to poor local mobile homepage metrics and slower-feeling mobile hero image changes. The current homepage remains hero-only, but the hero now uses the existing thumbnail rendition for small mobile screens through a `picture` source, while tablet/desktop continue to use the display rendition.

The first hero image is marked eager/high-priority, image dimensions are emitted from metadata when available, and runtime preloading now focuses on the active/adjacent hero slides before deferring the rest. Mobile-only guide-line overlays, heavier shadows, and hero image filters were reduced to lower paint cost.

If LCP remains poor after applying this pack, treat that as evidence for adding a dedicated mobile/hero-mobile rendition to the image pipeline rather than continuing to make broad layout changes.

## Phase 2K implementation note

Phase 2K added a narrow public accessibility and interaction polish pass. It introduced a keyboard-visible skip link, main-content focus targets, lightbox focus restoration, lightbox focus trapping, and horizontal touch-swipe navigation in the portfolio lightbox.

This pass did not change final public copy, About page copy, editor behavior, image data, gallery room data, curation data, or virtual-gallery mechanics.

## Phase 2 closeout note

Phase 2 public polish is closed for the current scope as of 2026-05-14. The user confirmed that `origin/dev` and `origin/main` both point to the Phase 2 public-polish commit:

```text
cf7886c Polish public portfolio experience
```

The public site should now be treated as stable enough to move into Phase 3 content and metadata curation.

Current baseline:

- homepage is hero-only for now
- no unnecessary desktop scroll on a normal 1920x1080 homepage viewport
- mobile homepage hero is simplified for space and performance
- VCR/pixel typography remains scoped to minor numeric accents
- portfolio/index has a refined archive browsing baseline
- extra gallery CTA in the portfolio meta strip remains removed
- top-nav Gallery does not use a red dot
- lightbox supports keyboard focus management and mobile swipe navigation

Do not keep adding Phase 2 polish packs unless the user identifies a specific issue. The next meaningful work is Phase 3 image/content curation, followed later by About/contact redesign, mobile 3D gallery controls, and SEO.

