# Current Project Handoff — Phase 5 Active

Updated: 2026-05-16

## Phase status

Phase 5 is complete as of Phase 5K: About/contact responsive/accessibility closeout.

## Phase 5A baseline

Phase 5A adds a public About/contact page structure and a separate About image pipeline. The public page uses `src/data/aboutPhotos.json` through `src/data/aboutPhotos.ts`. The first records are temporary references to existing portfolio portrait/editorial images so the page has usable imagery before final About-specific photos are imported.

## About photo architecture

About photos are separate from portfolio images. Native About imports should write to:

```text
public/images/about/display/
public/images/about/thumb/
public/images/about/full/
source-images/about-editor-imports/
```

About records live in:

```text
src/data/aboutPhotos.json
src/data/aboutPhotos.ts
```

The public About page should not depend on `galleryImages.json` once the user imports final About-specific images. The temporary records currently use `sourceType: portfolio-reference` and can be replaced later.

## Local editor changes

The local editor has an About tab. It supports:

- About photo import review;
- About-native imports into `public/images/about/`;
- About photo ordering with Top/Up/Down controls;
- active/inactive About page controls;
- title/year/location/alt/note/path metadata editing;
- standard editor save and backup behavior.

This is separate from the portfolio Images and Import sections.

## Copy authorship

The user wants to write final public About/contact copy. Placeholder copy may be used for structure, but do not treat it as finished site prose unless the user explicitly approves or asks for copywriting.


## Phase 5B update

Phase 5B expands the About/contact page into a taller editorial layout based on the user's mockup. The page now uses a top copy/photo cluster, a full-width copy band, a lower split photo/copy section, low-opacity floating background images, and subtle scroll-linked motion. All copy remains placeholder-only.

Phase 5B also adds an action panel to normal portfolio image edit pages in the local editor. The action creates an About photo reference record from the current portfolio image without copying files. These records use `sourceType: portfolio-reference` and continue to live in `src/data/aboutPhotos.json`. Native About imports remain separate and still write to `public/images/about/`.

## Next likely Phase 5 work

- Review the Phase 5B public About page vertical layout visually.
- Replace temporary portrait references with user-selected/about-specific images.
- Refine About editor UX only if the new section has obvious issues.
- Add real contact/social links if the user provides them.
- Continue to avoid broad public-site redesign unless requested.

## Phase 5C update

Phase 5C refines the About/contact image model into three editor-controlled placement groups:

- `upper-collage` — foreground top-right collage, capped to the first two active records on the public page;
- `lower-collage` — foreground lower collage group, ordered by the About tab order;
- `background-float` — low-opacity decorative background images with subtle scroll-linked drift;
- `unused` — staged About images that remain in the data/editor but should not render in the public layout.

The About tab now exposes an **About placement** select for each About photo and About import review card. The About import panel also has a default placement selector. Normal portfolio image edit pages still support **Add to About**; those records default to `lower-collage` and can be reassigned later in the About tab.

`src/data/aboutPhotos.json` includes additional temporary portfolio-reference records so the upper collage, lower collage, and background float layers can be visually reviewed before final native About photos are imported.

## Phase 5D update

Phase 5D refines the Phase 5C About/contact layout and About editor controls based on visual review.

Public About page changes:

- The upper foreground collage is now a two-image stack: one large base photo with one slightly smaller photo centered over it.
- Upper and lower foreground collage images are no longer clickable and no longer open image files in a new tab.
- Background-float images are much larger and remain low-opacity so they read as oversized transparent page atmosphere rather than small decorative thumbnails.
- Background-float rendering now respects `isActive: false`, matching the About editor active/inactive control.

Editor changes:

- The About tab now separates records into role-based sections: Upper collage, Lower collage, Background floats, and Unused / staged.
- Each section has its own count/readout and role-specific usage note so the About layout is easier to curate.
- Top/Up/Down controls move records within the visible role section rather than across the full mixed About list.

Editor assets are bumped to `v=70`.

## Phase 5E background-float positioning refinement — 2026-05-16

The background-float layer now uses more edge-spilling placement. Most floats should sit partly outside the viewport, and one float should sit slightly off-center toward the page middle. This keeps the foreground collage and copy-block layout unchanged.

## Phase 5F update

Phase 5F corrects the public About/contact background-float layer so it is no longer constrained by the centered content column. `renderAboutFloatingPhotos()` now renders as a sibling of the About `main` element inside the About page shell, and the scroll-motion controller targets the full About page shell so background floats continue to drift after moving outside `.modern-about-page`.

The foreground About layout remains unchanged: upper collage, lower collage, copy blocks, editor placement roles, and About image data schema are preserved. This pack only changes how the low-opacity background float layer is positioned and moved.

## Phase 5G update

Phase 5G applies the latest public About/contact visual correction. The lower foreground collage section no longer has a large rectangular container outline/background behind the photos. The lowest background-float photos are positioned higher so they keep visible margin above the bottom of the page, while still spilling horizontally beyond the viewport edges where intended.

This is a CSS-only public About page refinement. About editor behavior, About data schema, public portfolio behavior, and 3D gallery behavior are unchanged.

## Phase 5H update

Phase 5H refines the public About/contact background-float motion after the user noted the animation was too noticeable. The background floats keep the Phase 5F viewport-wide breakout and Phase 5G bottom-margin correction, but their scroll-linked movement is now much more restrained.

The background-float speed constants are lower, horizontal movement is reduced, and the previous sinusoidal side-to-side wobble is removed. The intended result is that background photos feel nearly fixed to the page with only slight parallax drift.

This is a narrow public About motion refinement. About editor behavior, About data schema, foreground collage layout, copy placeholders, public portfolio behavior, and 3D gallery behavior are unchanged.

## Phase 5I update

Phase 5I adds a structured About Copy editor to the local editor About tab. Public About/contact copy now lives in `src/data/aboutCopy.json` and is normalized through `src/data/aboutCopy.ts`; `src/app/sitePages.ts` renders the About hero, main About band, project/practice block, and contact card from that data instead of hardcoded placeholder strings.

The local editor now loads, saves, backs up, and restores `aboutCopy.json` alongside the existing portfolio and About photo JSON files. The About tab renders copy controls above the About photo import/archive controls. The copy editor supports the current About page structure: hero/intro copy, main About block, project/practice block, contact email, and optional contact links.

Final copy remains user-authored. This pack moved the existing placeholder copy into editable data; it did not replace the user's voice with final AI-written site copy.

## Phase 5J update

Phase 5J splits the local editor About tab into two separate routes. `#/about` is now the default About Copy page, and `#/about/photos` is the About Photos page for native About imports, About photo role assignment, active-state management, and About image ordering.

This is a route/presentation split only. `aboutCopy.json`, `aboutPhotos.json`, native About imports under `public/images/about/`, and portfolio-reference About photo records remain unchanged.

Next recommended work remains the Phase 5 responsive/accessibility closeout pass across About/contact, then the broader responsive Phase 4/5/6 work sequence the user requested.


## Phase 5K closeout update

Phase 5K completes the About/contact redesign phase. The public About/contact page now has its final structural baseline for this phase: vertical editorial layout, viewport-wide subtle background floats, foreground upper/lower collage roles, data-backed About copy, and responsive/accessibility safeguards.

Closeout changes include:

- tablet/mobile spacing and collage sizing safeguards;
- fewer decorative elements on very narrow screens to preserve readability;
- wrapping safeguards for long user-authored copy, long email addresses, and optional contact links;
- visible keyboard focus styling for About contact links;
- stronger reduced-motion handling for About parallax/collage elements;
- semantic section labels through `aria-labelledby` heading relationships;
- safe email and optional external-link rendering from `aboutCopy.json`;
- active-only fallback behavior for the upper About collage when fewer than two upper-collage records are assigned.

The following remain deferred pre-launch content tasks, not active Phase 5 blockers:

- final user-written About/contact copy;
- final About-specific photo selection/import;
- final public gallery and 3D gallery curation.

Next recommended phase: Phase 6 mobile 3D gallery controls.
