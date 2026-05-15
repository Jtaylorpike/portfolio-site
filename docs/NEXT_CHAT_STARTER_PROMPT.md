# Next Chat Starter Prompt

Use this message when opening the next chat.

```text
This is my current Taylor Pike portfolio site source. Read the docs folder first, especially CURRENT_PROJECT_HANDOFF.md, CURRENT_PROJECT_HANDOFF_PHASE3_ACTIVE.md, PROJECT_ROADMAP_CURRENT.md, and CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md. Treat the uploaded source as the source of truth. We are in Phase 3: portfolio content and metadata curation. Phase 2 public polish is complete, and the alt text pack has been applied and committed.

Important project rules:
- The project is Vite + TypeScript + vanilla modules + Three.js, not React.
- The local editor is Flask-backed under local-editor/.
- Active data lives in src/data/.
- Active runtime images are under public/images/portfolio/{display,thumb,texture,full}/ and public/images/ui/cards/.
- There is no active public/images/logo folder.
- Do not restore public/data as active data.
- Uploaded current source is the source of truth if it conflicts with memory or older docs.
- Keep docs/ updated as part of meaningful project changes.
- Do not generate or replace final website copy unless I ask; I want to write the final site copy myself, especially About page copy.
- The pixel/VCR font is only a secondary or tertiary accent, mostly for minor numeric UI details; do not apply it to the Taylor Pike header/wordmark.
- Phase 2 public design is stable. Avoid broad redesign churn unless I point out a specific issue.
- Future editor backlog includes hide/show controls, bulk edits, import review remove buttons, better import button wording, import progress feedback, category creation from dropdown, and the rename ID + rendition title/suggestion refresh bug.
```
