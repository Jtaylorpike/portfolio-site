# Taylor Pike Portfolio Current Roadmap

Generated: 2026-05-14
Status checkpoint: Phase 2 public polish closed and pushed to both `dev` and `main`.

## Current principle

Current source files in the user's repository are the source of truth. Chat memories, handoff summaries, and docs in this folder are continuity aids, but they should never override the current files present in the project.

Documentation in this folder should remain current so the project can move between chats and remain understandable to a human developer.

## Confirmed branch checkpoint

The user confirmed that both remote branches show the same top commit after the Phase 2 push:

```text
origin/dev  -> cf7886c Polish public portfolio experience
origin/main -> cf7886c Polish public portfolio experience
```

Treat the public-site polish baseline as merged to `main` unless a future source upload or Git log shows otherwise.

## Phase 0 — Editor map whitespace closure

Status: complete.

The remaining Gallery tab whitespace issue was fixed as a narrow layout bug. The user confirmed the fix worked. Do not reopen editor/map work unless something visibly breaks or public-site work requires it.

## Phase 1 — Public site audit

Status: complete.

The public-facing site was reviewed as a visitor-facing experience. The current design direction is working and should be refined rather than replaced.

## Phase 2 — Homepage and public polish

Status: complete for the current scope.

Phase 2 moved the public site out of the immediate polish loop. It tightened the homepage, portfolio/index, global navigation, responsive behavior, mobile hero performance, lightbox behavior, and keyboard interaction without changing the user's final copy or reopening the editor/gallery tooling.

### Phase 2A — Typography scope correction

Status: complete.

The VCR/pixel-style font should be used only as a secondary or tertiary accent, especially for minor numeric details such as hero slide numbering. It should not replace the main interface typography and should not be used for the `Taylor Pike` header/wordmark.

### Phase 2B — Homepage polish

Status: complete.

This pass tightened the homepage through CSS-only refinements: header depth, hero index rhythm, image shell/guide-line treatment, copy-panel readability overlay, CTA hover response, thumbnail/contact-sheet active states, and responsive overrides.

No public website copy was changed.

### Phase 2C — Portfolio/index polish

Status: complete.

This pass tightened the public portfolio/archive route. It added generated category counts, refined the category sidebar, separated card category/title/detail metadata, improved card hover/focus treatment, refined masonry spacing, and polished lightbox caption hierarchy.

No public website copy, editor files, image data, gallery data, or route behavior was changed. Keep in mind that the user may still need to add more final photos and metadata before portfolio/index work can be considered final for launch.

### Phase 2D — Gallery entry CTA polish and scope correction

Status: complete.

The first pass made gallery entry points more deliberate, but the homepage `02 / Spatial` card became too CTA-heavy and the top navigation Gallery button gained an unwanted red/accent dot. The corrected direction removed the top-nav dot, removed the extra card button/control chips, and eventually removed all below-hero homepage UI.

The final Phase 2 direction is that the homepage is hero-only for now. The virtual gallery remains reachable through the top nav and the hero CTA.

### Phase 2E — Homepage hero-only simplification

Status: complete.

The homepage now stops after the hero slideshow. The large below-hero intro/CTA block and the three-card archive/status strip were both removed from the home route. Future below-hero homepage content should only return as an intentional, user-approved structure.

### Phase 2F — Public navigation and global UI polish

Status: complete.

This pass tightened the shared public header/nav without changing final copy. It added active-route `aria-current` attributes, gave the Gallery overlay trigger clearer button semantics, replaced the dot-like nav indicator with a quiet line treatment, and improved mobile header/nav spacing.

The `Taylor Pike` header/wordmark remains on the normal site typography. The VCR/pixel font remains scoped to minor numeric accents only.

### Phase 2G — Home viewport fit and portfolio header cleanup

Status: complete.

This pass kept the current hero-only homepage but removed the unnecessary desktop scroll created by leftover vertical spacing. It also removed the portfolio heading's red accent underline and removed the extra `Open gallery room` button from the portfolio meta strip, leaving global navigation and the homepage hero CTA as the cleaner gallery entry points.

### Phase 2H — Public responsive baseline

Status: complete.

This pass tightened the current public pages across tablet and phone. It adjusted shell widths, mobile hero sizing, phone thumbnail scrolling, portfolio rail behavior, contact-link wrapping, lightbox control placement, and touch-device hover behavior.

This was not the future mobile 3D gallery-controls phase. The Minecraft-like touch movement and drag-to-look camera controls remain a later mobile/gallery task.

### Phase 2I — Mobile public refinement

Status: complete.

This pass corrected issues found after the first responsive baseline. It reduced top spacing between mobile nav and page content, removed mobile-only clutter from the homepage hero, hid the mobile homepage virtual-gallery CTA, kept hero copy minimal on phones, compacted hero metadata into two columns where screen width allows, removed the mobile visual-index pseudo markers that looked like misplaced periods, reduced scroll-snap friction on mobile rails, and preserved the portfolio category rail horizontal scroll position across category changes.

### Phase 2J — Mobile hero performance

Status: complete.

This pass addressed poor local mobile performance readings on the homepage hero. It added mobile hero image source selection through a `picture` element, marked the first hero image as high-priority/eager, emitted image dimensions when metadata is available, reduced startup hero preloading, preloaded the active/adjacent hero neighborhood first, and removed nonessential mobile hero paint work.

The user confirmed this fixed the mobile performance issue.

### Phase 2K — Public accessibility and interaction polish

Status: complete.

This pass added a keyboard-visible skip link, main-content focus targets, better lightbox focus restoration, a lightbox focus trap, and mobile horizontal swipe support for the portfolio lightbox.

## Phase 3 — Portfolio/image curation and metadata

Status: next phase.

Before heavy portfolio/index finalization, the user likely needs to add more final photos and metadata through the editor. Some of that may happen later when the site is closer to launch. Avoid assuming current image metadata is final.

Recommended Phase 3 approach:

1. Use the local editor to add or refine selected images.
2. Fill in titles, categories, locations, years, featured flags, hero eligibility, and any gallery-relevant metadata.
3. Keep public page structure stable while the content set is changing.
4. Avoid over-polishing portfolio layout until the final or near-final image set is present.
5. Keep docs updated as curation rules become clearer.

## Phase 4 — Gallery entry and public-gallery framing

Make the gallery feel like a deliberate museum/private-archive experience. This phase should not add room complexity yet. It should focus on framing, expectation-setting, and how the visitor moves from normal portfolio browsing into the 3D gallery.

## Phase 5 — About/contact redesign

The user wants to write the final website copy personally. Do not generate final About page copy unless explicitly asked. The desired direction is a redesigned page with personal photos cascading in the background and text blocks about the user, the project, career journey so far, and photography.

## Phase 6 — Mobile 3D gallery controls

The 3D gallery should remain viewable on mobile. The future mobile control direction is a touch movement schema similar to Minecraft mobile, with drag-to-look camera controls. Mobile polish should still include readable fallback states and clear interaction guidance.

## Phase 7 — SEO/discoverability phase

Treat SEO as its own phase after public structure and copy are more settled. This should include titles, descriptions, social previews, structured data, semantic headings, image alt text, public copy, performance, indexing behavior, canonical/project-path behavior, and possibly a sitemap.

## Phase 8 — Future gallery room expansion

After public polish, return to room expansion. The long-term direction is a larger, less square museum/private-archive environment with possible corridors, alcoves, window wall, and time-of-day lighting. This should happen carefully so collision, plaques, wall placement, map editing, and curation logic do not break.
