# Taylor Pike Portfolio Current Roadmap

Generated: 2026-05-13

## Current principle

Current uploaded source files are the source of truth. Handoff summaries and chat memories are useful context, but they should not override the files currently present in the project.

The project is moving from tooling stabilization into public-site polish. Documentation in this folder should be kept current so the project can move between chats and remain understandable to a human developer.

## Phase 0 — Editor map whitespace closure

Status: complete.

The remaining Gallery tab whitespace issue was fixed as a narrow layout bug. The user confirmed the fix worked. Do not reopen editor/map work unless something visibly breaks or public-site work requires it.

## Phase 1 — Public site audit

Status: complete.

The public-facing site was reviewed as a visitor-facing experience. The current design direction is working and should be refined rather than replaced.

## Phase 2 — Homepage and public polish

Status: active.

The overall design direction is working. Focus on both large and small details: spacing, typography, image treatment, transitions, metadata presentation, CTAs, thumbnail/contact-sheet behavior, and consistency.

### Phase 2A — Typography scope correction

Status: complete.

The VCR/pixel-style font should be used only as a secondary or tertiary accent, especially for minor numeric details such as hero slide numbering. It should not replace the main interface typography and should not be used for the `Taylor Pike` header/wordmark.

### Phase 2B — Homepage polish

Status: implemented in the Phase 2B pack.

This pass tightened the homepage through CSS-only refinements: header depth, hero index rhythm, image shell/guide-line treatment, copy-panel readability overlay, CTA hover response, thumbnail/contact-sheet active states, and responsive overrides.

No public website copy was changed.

### Phase 2C — Portfolio/index polish

Status: implemented in the Phase 2C pack.

This pass tightened the public portfolio/archive route. It added generated category counts, refined the category sidebar, separated card category/title/detail metadata, improved card hover/focus treatment, refined masonry spacing, and polished lightbox caption hierarchy.

No public website copy, editor files, image data, gallery data, or route behavior was changed. Keep in mind that the user may still need to add more final photos and metadata before portfolio/index work can be considered final for launch.

### Phase 2D — Gallery entry CTA polish

Status: implemented, then scope-corrected after visual review.

The first Phase 2D pass made gallery entry points more deliberate, but the homepage `02 / Spatial` card became too CTA-heavy and the top navigation Gallery button gained an unwanted red/accent dot. The corrected direction keeps the homepage archive/status strip as three balanced boxes, removes the internal card button/control chips, and removes the top-nav dot.

The portfolio `Open gallery room` action keeps its subtle arrow affordance. No final public prose, About page copy, image data, editor files, room data, curation data, or 3D gallery behavior was changed.

#### Phase 2D follow-up — Homepage below-hero simplification

Status: superseded by Phase 2E.

After visual review, the homepage first moved toward keeping only the three balanced archive/status boxes below the hero. The user then decided that the homepage does not need any secondary UI below the hero for now.

#### Phase 2E — Homepage hero-only simplification

Status: implemented in the Phase 2E pack.

The homepage now stops after the hero slideshow. The large below-hero intro/CTA block and the three-card archive/status strip have both been removed from the home route. Future below-hero homepage content should only return as an intentional, user-approved structure, not as two overlapping UI sections.

### Phase 2F — Public navigation and global UI polish

Recommended next.

Review shared header/nav behavior, global button/link consistency, focus states, route-level spacing, footer/contact access if needed, and small UI details that appear across pages. Keep the phase copy-safe and avoid changing final site language unless the user provides the text.

## Phase 3 — Portfolio/image curation and metadata

Before heavy portfolio/index finalization, the user likely needs to add more final photos and metadata through the editor. Some of that may happen later when the site is closer to launch. Avoid assuming current image metadata is final.

## Phase 4 — Gallery entry and public-gallery framing

Make the gallery feel like a deliberate museum/private-archive experience. This phase can overlap with Phase 2D, but should not add room complexity yet.

## Phase 5 — About/contact redesign

The user wants to write the final website copy personally. Do not generate final about-page copy unless explicitly asked. The desired direction is a redesigned page with personal photos cascading in the background and text blocks about the user, the project, career journey so far, and photography.

## Phase 6 — Mobile pass

The 3D gallery should remain viewable on mobile. The future mobile control direction is a touch movement schema similar to Minecraft mobile, with drag-to-look camera controls. Mobile polish should still include readable fallback states and clear interaction guidance.

## Phase 7 — SEO/discoverability phase

Treat SEO as its own phase after public structure and copy are more settled. This should include titles, descriptions, social previews, structured data, semantic headings, image alt text, public copy, performance, indexing behavior, canonical/project-path behavior, and possibly a sitemap.

## Phase 8 — Future gallery room expansion

After public polish, return to room expansion. The long-term direction is a larger, less square museum/private-archive environment with possible corridors, alcoves, window wall, and time-of-day lighting. This should happen carefully so collision, plaques, wall placement, map editing, and curation logic do not break.
