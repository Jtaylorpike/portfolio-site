# Pack Notes — Phase 5C About Three-Layer Collage Controls

## Summary

This pack updates the Phase 5 About/contact direction to match the user's refined mockup: black copy blocks retain the existing structure, foreground About photos are controlled as upper and lower collage groups, and transparent background images float behind the page with scroll-linked motion.

## Key changes

- Adds `placementRole` to About photo records.
- Adds editor placement controls for existing About photos and About import review cards.
- Adds a default placement selector to the About import panel.
- Makes portfolio image **Add to About** records default to `lower-collage`.
- Reworks the public About page renderer so:
  - the upper collage uses only two photos;
  - the lower collage uses its own ordered photo group;
  - background float photos use their own role and decorative rendering.
- Adds extra temporary portfolio-reference About records to fill the visual layout.
- Adds horizontal scroll drift to background float photos while preserving reduced-motion behavior.

## Apply notes

Apply this pack on top of the confirmed Phase 5B state.

## Manual test checklist

1. Run `npm run build`.
2. Open the public About page.
3. Confirm the upper foreground collage contains only two photos.
4. Confirm the lower foreground collage is separate from the upper collage.
5. Scroll the About page and confirm transparent background images move subtly.
6. Open the local editor About tab.
7. Confirm each About photo card has an **About placement** select.
8. Change a photo's placement, save, reload, and confirm it persists.
9. Prepare an About import and confirm import review cards include the placement select.
10. Open a normal portfolio image card, click **Add to About**, save, then confirm it appears in the About tab as a lower-collage record.

## Untouched areas

- Gallery curation behavior.
- Public portfolio/index behavior.
- Three.js runtime behavior.
- Portfolio image import writing.
- Gallery wall placement/collision/plaque logic.
- Final About copy.
