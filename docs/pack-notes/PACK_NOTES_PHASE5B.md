# Pack Notes — Phase 5B About Vertical Layout + Portfolio Reference Controls

## Summary

This pack adds a more vertical About/contact page layout and lets normal portfolio image edit pages add an existing portfolio image into the separate About photo list as a reference record.

## Key behavior

- About page now uses a taller editorial layout with stacked sections.
- About page gets subtle scroll-linked floating image movement.
- Portfolio image edit pages get an "Add to About" panel.
- "Add to About" creates a `sourceType: "portfolio-reference"` record in editor state.
- The user must save the editor to persist that new About record.
- The action does not copy files or import anything into `public/images/about/`.

## Manual test

1. Open the local editor.
2. Go to Images and open a normal portfolio image edit page.
3. Click **Add to About**.
4. Confirm the button changes to **Added** and the editor shows an unsaved-change state.
5. Save changes.
6. Open the About tab and confirm the referenced image appears in the About photo list.
7. Open the public About page and confirm the page has a taller editorial structure with photo movement while scrolling.

## Validation performed

- TypeScript compile/build through `npm run build`.
- JavaScript syntax checks for changed editor files.
- Python syntax checks for editor backend files.
- CSS brace-balance checks.
- Zip integrity check.
