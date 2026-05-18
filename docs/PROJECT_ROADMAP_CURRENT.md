# Taylor Pike Portfolio — Current Roadmap

Updated: 2026-05-18

## Current project state

The portfolio has completed Phase 7: SEO/discoverability and launch-readiness infrastructure as of Phase 7E. Phase 7A added the SEO metadata infrastructure, Phase 7B set the canonical/search baseline to `https://taylorpike.com/` and added the repeatable Lighthouse runner, Phase 7C fixed the homepage CTA accessible-name/touch-target issue and added first-hero LCP preload hints, Phase 7D raised primary navigation font sizing to the 12px Lighthouse mobile legibility threshold, and Phase 7E records the accepted closeout state. The accepted post-Phase 7D Lighthouse baseline is Performance 98, Accessibility 100, Best Practices 93, and SEO 100. Hash routing remains accepted for now.

Phase 8: Advanced 3D gallery expansion, texture, and lighting is the next available future phase, but it has not started.

The public design baseline is stable. The user is happy with the current portfolio direction. Future work should avoid broad visual churn unless a specific problem is identified.

Phase 3 is considered complete by user decision even though the portfolio may still feel large. The site is far from public launch, so final image reduction and final metadata polish can happen later.

## Source of truth rules

```text
1. Fresh uploaded current source files are the source of truth.
2. docs/ contains human-readable continuity and should be kept current.
3. PROJECT_CHANGELOG.md records durable project history.
4. Memories and older handoffs are backup context only.
5. If source conflicts with older docs/memory, follow source.
```

Active data lives in `src/data/`. Do not restore `public/data/` as active data.

Active runtime images live under:

```text
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/portfolio/texture/
public/images/portfolio/full/
public/images/ui/cards/
```

There is no active `public/images/logo/` folder.

## Phase 0 — Editor map whitespace closure

Status: complete.

The gallery map whitespace issue was fixed and confirmed by the user. Treat this as closed unless new visual evidence appears.

## Phase 1 — Public-site audit

Status: complete.

The audit established that the overall public design direction works and should be refined rather than redesigned.

## Phase 2 — Public polish

Status: complete.

Phase 2 completed the current public presentation baseline:

- homepage hero-only simplification;
- desktop homepage viewport-fit cleanup;
- narrow VCR/pixel accent use;
- portfolio/index header cleanup;
- removal of unnecessary gallery CTA from portfolio meta strip;
- global nav and interaction polish;
- mobile public-page spacing cleanup;
- mobile hero performance fix;
- lightbox accessibility and mobile swipe polish.

Phase 2 should not continue unless the user reports a specific public UI issue.

## Phase 3 — Content, image, and metadata curation

Status: complete by user decision.

Phase 3 established the current larger real portfolio content set and enough metadata coverage to move forward.

Deferred content work that can happen later:

- reduce or hide weaker images;
- refine the public launch image count;
- finish optional metadata fields;
- review alt text from the thumbnail-based first pass;
- finalize launch hero and 3D gallery selections.

## Phase 4 — Editor curation controls

Status: complete / closed with Phase 4K.

Completed so far:

- corrected and retested the rename ID + rendition/title/suggestion state-refresh bug in Phase 4A v2;
- added public hide/show visibility and bulk editor curation controls in Phase 4B;
- added bulk selection, bulk show/hide, bulk category reassignment, and bulk hero add/remove for eligible public landscape images;
- polished the bulk editor UI/readability so visibility state, selected cards, and valid apply states are easier to read;
- improved the import review workflow with remove buttons, clearer `Import X photo(s)` wording, upload progress/log feedback, and category creation during import;
- visually rehauled the local editor with an archive-editor direction, compact import thumbnails, and a full-size import preview lightbox;
- cleaned up button bevel artifacts, removed import crop/framing tools, and corrected the gallery curation false missing-file empty state;
- professionalized the Gallery editor UX/readability with an archive-room control surface, cleaner wall cards, clearer status chips, grouped controls, and matching overlay polish;
- corrected the Gallery editor control treatment in Phase 4G v2 so boolean controls are compact and neutral, with no oversized green checkmarks and no VCR/pixel typography in the editor;
- applied a CSS-forward editor overhaul in Phase 4G v3 and corrected rough edges in Phase 4G v5, including Wall Finder layout, wall-preview trim, Select Image overlays, softer buttons, a local dark-mode toggle, higher-contrast dark-mode surfaces, and a one-shape bulk selector plus higher-contrast dark-mode surfaces.

Phase 4K closeout adds the final non-gallery editor safety pass:

- category usage summary and per-category visible/hidden/hero counts;
- safer category removal with explicit reassignment target;
- duplicate category preflight checks before saving;
- clearer backup restore safety messaging and unsaved-change protection;
- pack notes/manifests organized under `docs/pack-notes/` and `docs/pack-manifests/`.

Deferred, not blocking Phase 4 closeout:

- optional gallery-specific eligibility controls;
- true backend-streamed per-file import progress;
- any additional editor visual polish not tied to a concrete issue.

## Phase 5 — About/contact redesign

Status: complete / closed with Phase 5K.

The user wants to redesign this page with personal photos cascading in the background and text blocks about:

- themselves;
- the project;
- their career journey so far;
- photography.

The user wants to write the actual page copy. Do not generate final About copy unless asked.

## Phase 6 — Mobile 3D gallery controls

Status: complete / closed with Phase 6J.

The 3D gallery is now viewable on mobile using a restrained touch control layer: left thumb movement pad plus drag-to-look camera controls. Desktop pointer-lock/WASD behavior remains intact.

Completed baseline:

- Phase 6A established the functional mobile-control baseline and removed the touch-device desktop-only fallback.
- Phase 6B polished hint behavior, safe-area spacing, movement-pad presentation, analog shaping, and drag-look jump protection.
- Phase 6C removed internal wall type labels from viewer-facing plaques and bottom-right artwork info cards.
- Phase 6D fixed the local editor individual image-card lower Save JSON button.
- Phase 6E increased touch movement responsiveness and made analog movement feel more immediate.
- Phase 6F reduced camera sensitivity to a midpoint between Phase 6B and Phase 6E while preserving Phase 6E movement responsiveness.
- Phase 6G fixed the horizontal-phone homepage hero overlay/crop issue.
- Phase 6H broadened the landscape-phone homepage guard for Pixel-class wide CSS mobile viewports.
- Phase 6I extended short-landscape phone handling to Portfolio/About and added touch state cleanup on orientation/app-focus interruptions.
- Phase 6J closed the phase with documentation updates only.

Future mobile work should be limited to specific device/browser issues reported after deployment. It should not reopen Phase 6 broadly.

## Phase 7 — SEO/discoverability and launch pass

Status: complete / closed with Phase 7E.

Phase 7A infrastructure completed:

- added `src/data/siteSeo.json` as the editable metadata source;
- added `src/data/siteSeo.ts` for typed defaults and normalization;
- added `src/app/seoController.ts` for route-aware document titles, descriptions, canonical links, Open Graph/Twitter metadata, and JSON-LD structured data;
- wired the hash router to update metadata on route changes;
- updated `index.html` with stronger static baseline metadata for crawlers/social previews that do not execute the app;
- added `public/robots.txt` and `public/sitemap.xml`.

Phase 7B completed:

- changed the canonical public URL baseline to `https://taylorpike.com/`;
- updated `siteSeo.json`, `siteSeo.ts`, `index.html`, `robots.txt`, and `sitemap.xml` to use the intended domain;
- added `scripts/Run-LighthouseBaseline.ps1` for repeatable local or deployed Lighthouse checks;
- documented the sandbox limitation that prevented a trustworthy local Lighthouse browser score here;
- completed static root-document SEO checks and a production build-size baseline.

Phase 7C completed:

- reviewed the user's local Lighthouse baseline: Performance 99, Accessibility 96, Best Practices 93, SEO 100;
- fixed the homepage `View Portfolio` accessible-name mismatch and touch-target warning;
- added first-hero image preloads for the current mobile and desktop LCP candidates;
- kept hash routing intact because the SEO score is already 100 and there is no report-backed need for route migration.

Phase 7D completed:

- raised primary public-site navigation font sizing to the 12px Lighthouse mobile legibility threshold;
- preserved the quiet uppercase editorial nav treatment with tighter tracking;
- left gallery plaque/card type, homepage metadata microtype, homepage thumbnail microtype, favicon/logo/social-preview work, hash routing, and thumbnail rendition work out of scope.


Phase 7E completed:

- accepted the post-Phase 7D Lighthouse baseline: Performance 98, Accessibility 100, Best Practices 93, SEO 100;
- recorded core metrics: FCP 1.5s, LCP 2.3s, Speed Index 1.5s, TBT 0ms, CLS 0, TTI 2.3s;
- confirmed the navigation font-size cleanup removed primary nav from the Lighthouse small-font warning list;
- closed Phase 7 without changing runtime code, CSS, data, images, routing, editor behavior, or public copy.

Current hash-routing position:

```text
Keep hash routing for now.
```

Reason: the user prefers its performance/simplicity and wants production Lighthouse results before deciding whether route architecture is worth changing. A hash-to-real-route or prerender migration should be considered only if deployment data, Search Console data, or a clear launch requirement shows that separate crawlable routes are necessary.

Remaining Phase 7 scope: none. Phase 7 is closed.

Deferred by user preference:

- favicon/logo update until after logo redesign;
- app-icon update until after logo redesign;
- final social preview image asset until after logo redesign;
- final SEO launch copy polish;
- final image alt text/content metadata pass after launch curation;
- final image/gallery curation;
- homepage thumbnail rendition efficiency until the pre-launch image pipeline/performance pass after final image/gallery/homepage curation.

## Phase 8 — Advanced 3D gallery expansion, texture, and lighting

Status: future / next available phase, not started.

Long-term direction: museum/private archive feeling.

Potential future work:

- larger gallery room;
- less square/non-rectangular room layouts;
- corridors or alcoves;
- archive-room direction;
- window wall/time-of-day concept;
- texture and material system refinement;
- wall, floor, ceiling, frame, and plaque material improvements;
- realistic or stylized lighting design;
- lighting performance strategy for the Three.js gallery;
- formalized room model from `galleryRoom.json`;
- careful preservation of collision, wall placement, plaque fallback, and editor curation logic.

## Phase 4G v5 note

The local editor visual direction has been corrected toward an Adobe-inspired archive editor, but Phase 4G v5 should be treated as the current baseline rather than v3. Treat the editor design target as professional production software rather than a public-site page: compact panels, neutral gray workspace, softened software controls, restrained labels, image-first asset management, clean technical previews, and optional dark mode.

Do not use the VCR/pixel font in the editor UI. Before future visible editor UI changes, propose the component treatment first and get approval.

## Phase 4G v6 gallery curation stabilization — 2026-05-15

The Phase 4G visual editor work was followed by a Gallery curation regression report. Phase 4G v6 is a narrow stabilization pack that re-ships the full Gallery editor frontend/API file set, preserves `galleryRoom` in editor state, bumps the editor cache to `v=56`, and avoids any public-site, Three.js, placement-math, collision, plaque-fallback, or schema changes.



## Phase 4H-I-J combined editor functionality pack — 2026-05-15

The combined Phase 4H-I-J pack implements category-specific image drag-and-drop ordering, editor saved/unsaved state protection, route/reload/clear-import discard warnings, and stronger import collision/error handling. The All images view remains non-draggable. Import preflight now rejects duplicate IDs, existing IDs, invalid IDs, unsupported file types, and existing rendition-file collisions before writing files. Editor asset version is `v=57`.


## Phase 4H-I-J v2 category drag smoothing — 2026-05-16

Category image drag ordering now uses direct card dragging on category-specific Images pages. The previous handle-only interaction should be treated as superseded. The All images page remains read-only for ordering.


### Phase 4H-I-J v4 — Category drag interaction refinement

- Refines category-specific image drag ordering after the dynamic drag preview pass.
- Custom drag can start from photo previews without triggering native browser image drag.
- Short photo-preview clicks still open the individual image editor page, while a brief hold activates drag.
- Placeholder placement is calculated against real cards only to avoid the extra empty side cell/offset issue.
- All Images remains read-only for ordering.

## Phase 4H-I-J v5 category drag placeholder correction — 2026-05-16

Category-specific image ordering remains part of the active Phase 4 editor closeout work. The v5 drag correction should be treated as the current category drag baseline: placeholder placement is calculated with the placeholder temporarily removed from the CSS Grid, card preview short-clicks should open the image editor, and the cursor should remain normal until drag activation.
## Phase 4H-I-J v6 category drag single-placeholder fix — 2026-05-16

Category-specific image ordering should now treat the dragged source card as the single live placeholder while a cloned ghost card floats above the grid. This supersedes the v5 separate-placeholder model and is intended to remove the extra blank cell that appeared next to the actual placeholder. Pack notes and manifests are now placed under `docs/` instead of the project root for new packs.


## Phase 4H-I-J v7 category drag pacing refinement — 2026-05-16

Category-specific Images drag ordering remains part of the active Phase 4 editor closeout. The current drag baseline is v7: source-card-as-placeholder from v6 plus direction-aware insertion buffering to make rightward placeholder movement less abrupt. All Images remains read-only for ordering.

## Phase 4H-I-J v8 category drag left-threshold tuning — 2026-05-16

Category-specific Images drag ordering remains part of the active Phase 4 editor closeout. The current drag baseline is v8: source-card-as-placeholder from v6, rightward pacing buffer from v7, and reduced left-side crossing sensitivity so the placeholder does not move to the left of a neighboring card too eagerly. All Images remains read-only for ordering.

### Phase 4H-I-J v9 — Category drag symmetric threshold tuning

Status: completed as a narrow follow-up to the category drag ordering work. The implementation keeps category-only drag ordering, the single-placeholder drag model, the floating ghost card, short-click image navigation, and non-draggable All Images. The v9 adjustment brings right-side placement sensitivity closer to left-side placement by using a midpoint-oriented threshold rather than allowing the placeholder to settle after a small card overlap.



### Phase 5A — About/contact structure and separate About photo pipeline

Phase 5A creates the first About/contact redesign structure and adds a separate About photo pipeline. About-page imagery is stored in `src/data/aboutPhotos.json` and rendered through `src/data/aboutPhotos.ts`. Initial records reference current portfolio portrait/editorial images as temporary design placeholders. Future native imports from the editor write into `public/images/about/` instead of `public/images/portfolio/`, keeping About imagery separate from portfolio/gallery images.

The local editor now includes an About tab with import review, ordering, active/inactive controls, and metadata editing for About photos. This is intentionally separate from the existing Images/Import workflow.

### Phase 5B — Vertical About layout and portfolio-reference action

Phase 5B reworks the public About page toward the user's vertical mockup: a large copy block beside overlapping photos, a full-width copy band, a lower split photo/copy section, and subtle floating background imagery with scroll-linked movement. All copy remains placeholder-only.

Normal portfolio image edit pages now include an action to add that image to the separate About photo list as a `portfolio-reference` record. This reuses existing portfolio rendition paths and does not copy files into `public/images/about/`.

Final About copy remains user-authored. Placeholder copy exists only to preserve layout structure.

### Phase 5C — About three-layer collage controls

Phase 5C refines the public About/contact image layout into editor-controlled placement groups matching the user's updated mockup. About photo records now support `placementRole` values for `upper-collage`, `lower-collage`, `background-float`, and `unused`.

The public About page uses the first two active upper-collage records for the top foreground collage, the ordered lower-collage group for the lower foreground collage, and background-float records as low-opacity scroll-linked decorative images. The editor About tab exposes placement controls for existing About photos and import review records. Final About copy remains user-authored.

## Phase 5D refinement note — 2026-05-16

Phase 5D keeps Phase 5 active and refines the About/contact collage model before final copy or final About-specific photo selection. The About editor now separates records by placement role for clearer curation. The public About page now uses a stronger two-image upper collage, larger transparent floating background photos, and non-clickable foreground collage images.

Remaining Phase 5 work should focus on visual review, final About-specific image selection/import, and user-authored copy. Avoid broad public-site redesign unless specifically requested.

### Phase 5E — About background-float positioning refinement — 2026-05-16

Completed a CSS-only refinement to the public About page background-float placement. Background images are larger atmospheric elements, with most floats spilling beyond the viewport edges and one float positioned near the middle of the page field.

### Phase 5F — About background-float viewport breakout

Status: completed as a focused layout correction. The About background-float layer now behaves as page-wide atmospheric imagery instead of being constrained to the centered content column. Foreground collage behavior, About editor controls, About data schema, and final-copy placeholders remain unchanged.

## Phase 5G About/contact lower-collage and bottom-float correction — 2026-05-16

Phase 5G is a narrow visual correction after screenshot review. The lower foreground collage container no longer renders a large rectangular outline/background behind the photo stack; individual photo frames remain unchanged. The lowest background-float images now sit higher above the page bottom so they keep visible bottom margin even with scroll-linked drift. Phase 5F's full-width background-float breakout remains the current positioning baseline.

## Phase 5H About/contact background-motion refinement — 2026-05-16

Phase 5H is a narrow public About page motion refinement. The background-float photos keep their full-width edge-spilling placement and bottom margin, but their scroll-linked drift is much smaller and no longer uses side-to-side sine-wave wobble. Remaining Phase 5 work should continue with visual review, final About-specific imagery, and user-authored copy.

## Phase 5I completed — About Copy Editor

Phase 5I adds editor-managed About/contact copy. Public About text is now data-backed via `src/data/aboutCopy.json` and editable from the local editor About tab. Final image curation and final gallery curation remain pre-launch content tasks rather than current blockers.

Next recommended Phase 5 work:

1. Responsive QA for About/contact across desktop, tablet, and mobile.
2. Accessibility/basic polish for links, focus behavior, image alt review readiness, and readability.
3. Phase 5 docs/handoff closeout.

After Phase 5 closeout, move to the next public/mobile phase, including the known future 3D gallery mobile control work.

## Phase 5J status — About editor page split

Complete. The About editor is split into a default About Copy page and a separate About Photos page. Final About image curation remains a pre-launch content task rather than a current blocker.

Next recommended sequence:

1. Responsive/accessibility closeout for Phase 5 About/contact.
2. Responsive pass for the public site phases the user identified as 4, 5, and 6.
3. Later pre-launch content curation for About photos and 3D gallery setup.


## Phase 5K closeout — responsive/accessibility/docs

Complete. Phase 5K closes the About/contact redesign phase with responsive safeguards, basic accessibility polish, and updated handoff documentation.

Completed in Phase 5K:

- tablet/mobile spacing safeguards for the public About/contact page;
- narrow-screen collage sizing cleanup and reduced decorative background load on very small screens;
- wrapping safeguards for long user-authored copy, long email addresses, and optional contact links;
- visible keyboard focus styling for contact links;
- stronger reduced-motion handling for About/collage parallax elements;
- semantic section labeling through `aria-labelledby` relationships;
- safe email/contact-link rendering from `aboutCopy.json`;
- active-only fallback image behavior for the About upper collage;
- Phase 5 closeout handoff documentation.

Deferred until pre-launch:

- final About copy written by the user;
- final About photo curation;
- final public/3D gallery curation.

Current phase after Phase 7E closeout: Phase 8 is the next available future phase, but it has not started. Final content curation, final copy, logo/favicon/social-preview work, and thumbnail rendition efficiency remain deferred until their appropriate pre-launch or redesign points.
