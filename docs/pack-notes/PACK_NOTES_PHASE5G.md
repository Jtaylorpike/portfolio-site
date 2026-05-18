# Pack Notes — Phase 5G About Lower Collage Frame and Bottom Float Margin

## Purpose

Make the public About/contact page match the latest screenshot feedback without reopening the broader Phase 5 layout.

## Changes

- Removed the visible rectangular frame/background from the lower collage container.
- Preserved the individual photo-frame borders and captions.
- Raised the two lowest background-float images away from the bottom of the page.
- Kept horizontal edge-spill behavior from Phase 5F.

## Validation

- CSS brace-balance check passed.
- `npm run build` passed.
- `unzip -t` passed on the delivery pack.

## Manual test

1. Apply the replacement files.
2. Open the About page.
3. Confirm the lower collage section no longer has a large outlined container box behind the photos.
4. Scroll to the Contact/bottom area and confirm the background photos keep visible bottom margin instead of touching the browser/page bottom.
