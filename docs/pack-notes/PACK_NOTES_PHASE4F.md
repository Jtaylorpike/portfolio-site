# Phase 4F pack notes

This pack is a focused local-editor cleanup after Phase 4E. It does not change public-site rendering or portfolio image data.

## Apply

Copy the included files into the same paths in the project root, preserving the folder structure exactly.

## Main fixes

- Removes the button white inner rim/bevel artifact.
- Removes import crop/framing tools from import review cards.
- Keeps hidden default framing values so new imported records stay valid.
- Adds gallery curation diagnostics so the editor does not falsely describe an existing `galleryCuration.json` as missing.
- Bumps local editor assets to `v=50`.

## Suggested manual test

1. Start the local editor.
2. Hard-refresh the browser.
3. Confirm header buttons and regular buttons have no white inner rim.
4. Prepare an import review and confirm cards show compact thumbnails and metadata, not crop sliders.
5. Click an import thumbnail and confirm the lightbox still opens/closes.
6. Open the Gallery page and confirm existing gallery wall cards load.
7. Run `npm run build`.
