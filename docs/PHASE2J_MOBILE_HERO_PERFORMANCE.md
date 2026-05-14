# Phase 2J — Mobile Hero Performance

Status: implemented.

This pass responds to poor local mobile performance metrics on the public homepage, especially a high local Largest Contentful Paint value and slower-feeling hero image changes after the responsive polish pass.

## Intent

Keep the current public layout and copy structure intact while making the mobile homepage hero lighter to load and cheaper to repaint.

This is not a visual redesign, not a gallery-control phase, and not an image-pipeline migration.

## Changes

- The homepage hero image now renders through a `picture` element.
- On screens at or below 700px wide, the hero uses the existing `thumb` rendition as the mobile source.
- Tablet and desktop continue using the existing display rendition.
- The first hero image is marked as eager/high-priority.
- Hero image width and height attributes are emitted from image metadata when available.
- Runtime hero swaps now preload the mobile-preferred source on small screens instead of always preloading the larger display rendition.
- Startup preloading no longer eagerly queues every hero image immediately. It preloads the active/adjacent neighborhood first and defers the remaining hero sources.
- Mobile hero paint work was reduced by disabling nonessential guide-line overlays, lowering the hero shadow cost, and removing the CSS filter from the mobile hero image.

## Files touched

- `src/app/heroFraming.ts`
- `src/app/sitePages.ts`
- `src/app/siteInteractionsController.ts`
- `src/styles/global.css`

## What did not change

- No final website copy changed.
- No About page copy changed.
- No editor files changed.
- No image data changed.
- No gallery curation data changed.
- No gallery room data changed.
- No virtual-gallery mechanics changed.
- No new image renditions were created.

## Manual checks

After applying, check the public home route on mobile width:

1. Hero image still fills the stage correctly.
2. Mobile image quality is acceptable.
3. Hero image changes feel faster when tapping/sliding through the visual index or thumbnails.
4. The mobile hero still shows only `Selected Work` and `View Portfolio`.
5. Desktop hero image quality still uses the display rendition and does not look downgraded.
6. Re-run local performance testing from a foreground tab/window, because Chrome can inflate LCP when the page starts loading in the background.

## Follow-up if metrics are still poor

If LCP remains high after this pack, the next likely issue is that the current `thumb` rendition may still be too large or not optimized enough for the actual mobile hero. The next step would be a dedicated image-pipeline addition for a `mobile` or `hero-mobile` rendition rather than continuing to solve mobile LCP only with CSS and runtime loading behavior.
