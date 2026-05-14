# Phase 2K — Public Accessibility and Interaction Polish

Generated: 2026-05-14

## Purpose

Phase 2K is a narrow public-site finishing pass after the mobile hero performance fix. The goal is to improve keyboard flow, focus behavior, and mobile lightbox interaction without changing final public copy, editor behavior, image data, gallery room data, curation data, or virtual-gallery mechanics.

## Files changed

- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `src/styles/global.css`

## What changed

### Skip-to-content support

A hidden `Skip to content` link was added before the shared public header. It becomes visible on keyboard focus and jumps to the active page's main content region.

Each public `main` element now has:

- `id="main-content"`
- `tabindex="-1"`

This helps keyboard users bypass the sticky header/nav on every route.

### Lightbox focus behavior

The image lightbox now preserves the element that opened it and returns focus there when the lightbox closes.

The lightbox also traps `Tab` focus inside the dialog while open, so keyboard focus does not move behind the overlay.

Existing lightbox keyboard behavior remains:

- `Escape` closes the lightbox.
- `ArrowLeft` moves to the previous image.
- `ArrowRight` moves to the next image.

### Mobile lightbox swipe support

The image lightbox now supports horizontal touch swipes:

- swipe left: next image
- swipe right: previous image

Swipe handling is intentionally limited to clear horizontal gestures so it does not fight normal vertical touch behavior.

### CSS support

New CSS was added for:

- visually hidden/focus-visible skip link behavior
- safe focus target styling for `#main-content`
- lightbox overscroll containment
- mobile lightbox touch handling and image selection prevention

## What did not change

- No final website copy was changed.
- No About page copy was changed.
- No editor files were changed.
- No image data was changed.
- No gallery room or gallery curation data was changed.
- No virtual-gallery controls or desktop gallery mechanics were changed.
- No SEO metadata was changed.

## Manual checks

After applying the pack:

1. Open the public site.
2. Press `Tab` from the top of the page and confirm the skip link appears.
3. Press `Enter` on the skip link and confirm focus moves to the page content.
4. Open a portfolio image.
5. Confirm `Tab` stays inside the lightbox controls.
6. Confirm `Escape` closes the lightbox and returns focus to the image that opened it.
7. On mobile or responsive device mode, confirm horizontal swipes move between lightbox images.
8. Confirm the homepage, portfolio page, and about page still render normally.

## Notes for future chats

This is still part of Phase 2 public polish. It does not replace the later About/contact redesign, SEO phase, or mobile 3D gallery controls phase.
