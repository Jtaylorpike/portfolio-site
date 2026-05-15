# Next Chat Authentication Checklist

Use this checklist to confirm the next assistant understood the current project.

## Required answers

A reliable next assistant should be able to answer these before making code changes:

1. What framework/architecture is the public site using?
   - Expected: Vite + TypeScript + vanilla modules + Three.js, not React.

2. Where does active editable data live?
   - Expected: `src/data/`.

3. Should `public/data/` be restored as active data?
   - Expected: No. It is stale/archive-only.

4. What are the active runtime image folders?
   - Expected: `public/images/portfolio/display/`, `thumb/`, `texture/`, `full/`, and `public/images/ui/cards/`.

5. Is `public/images/logo/` currently active?
   - Expected: No. Do not reference or stage it unless logo assets are intentionally restored later.

6. What phase is the project in?
   - Expected: Phase 3, portfolio content/image/metadata curation.

7. Is Phase 2 public polish still active?
   - Expected: No. It is complete unless the user identifies a specific public UI issue.

8. Who should write final public site copy?
   - Expected: The user. Do not generate/replace final website prose unless asked.

9. How should the VCR/pixel font be used?
   - Expected: Only as a narrow secondary/tertiary accent, mostly minor numeric UI. Not for the Taylor Pike header/wordmark.

10. What future editor work is queued?
    - Expected: hide/show photos, bulk edits, import review removal, clearer import wording, progress feedback, category creation from dropdown, and rename ID + rendition state-refresh bug fix.

## Red flags

Be cautious if the next assistant:

- suggests React-specific code for the current site;
- tries to restore `public/data/`;
- assumes `public/images/logo/` exists;
- suggests broad public redesign before content curation;
- generates final About page copy without being asked;
- applies the pixel font broadly;
- ignores the docs folder as a handoff mechanism.
