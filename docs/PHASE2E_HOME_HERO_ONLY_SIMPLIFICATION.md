# Phase 2E — Homepage Hero-Only Simplification

Generated: 2026-05-13

## Purpose

This pack removes the remaining homepage UI section below the hero slideshow so the homepage can temporarily stand on the hero itself while the public-site direction continues to settle.

The user first chose the three archive/status boxes over the duplicate intro/CTA block, then decided that even the remaining three-box section is not necessary for now. The homepage should now stop after the hero slideshow.

## Files changed

- `src/app/sitePages.ts`
- `src/styles/global.css`
- `docs/PROJECT_ROADMAP_CURRENT.md`
- `docs/PUBLIC_SITE_POLISH_AUDIT.md`

## Public UI changes

- Removed the `renderHomeArchiveNotes()` homepage section.
- Removed the `renderHomeArchiveNotes()` call from `renderHomePage()`.
- Removed the `.home-archive-notes` CSS blocks and responsive overrides.
- Left the homepage hero slideshow, hero CTAs, top navigation, portfolio page, entry page, About route, lightbox, editor, image data, gallery room data, and gallery behavior unchanged.

## Copy policy

No final public copy was generated or rewritten. The deleted section contained working/placeholder public text rather than user-authored final copy. Future public copy, especially About-page copy, should still come from the user.

## Current homepage structure

The home route now renders:

1. top navigation
2. hero slideshow section

There is no secondary homepage intro block, archive/status card strip, internal gallery control chip section, or duplicate below-hero CTA row.

## Future direction

If a below-hero homepage section returns later, it should be intentionally designed as one of the following rather than added incrementally:

- a single condensed editorial slide below the hero
- a simple archive/status strip
- a user-authored section with final copy
- a route-specific transition into portfolio/gallery/About content

Do not reintroduce both a large intro block and a three-card archive/status strip at the same time.
