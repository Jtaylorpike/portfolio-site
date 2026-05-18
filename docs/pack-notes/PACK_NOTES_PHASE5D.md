# Pack Notes — Phase 5D About Collage and Editor Section Refinement

This pack refines the About/contact layout and About editor organization after review of Phase 5C.

## Changes

- Public About background-float images are larger and more visible while staying transparent.
- Public upper collage now uses one large image with one smaller centered image stacked over it.
- Public foreground About collage images are no longer clickable hyperlinks.
- Public About image sets now ignore inactive About records.
- About editor records are grouped into Upper collage, Lower collage, Background floats, and Unused / staged sections.
- About photo Top/Up/Down actions now move within the current role section.
- Editor asset cache version is `v=70`.

## Validation

- `node --check local-editor/static/js/main.js`
- `node --check local-editor/static/js/render.js`
- CSS brace-balance checks for `src/styles/global.css` and `local-editor/static/editor.css`
- `npm ci --ignore-scripts`
- `npm run build`
- `unzip -t`

## Notes

Final About copy remains placeholder-only and user-authored. This pack does not change gallery curation, portfolio import writing, Three.js runtime, wall placement, collision, plaque fallback, or portfolio image data behavior.
