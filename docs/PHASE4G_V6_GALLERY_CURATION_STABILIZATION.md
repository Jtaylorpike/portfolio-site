# Phase 4G v6 — Gallery Curation Stabilization

Date: 2026-05-15

## Purpose

This pack stabilizes the local editor after the Phase 4G visual passes introduced a Gallery editor regression. The fix is intentionally narrow: restore a coherent, full replacement set of the Gallery editor frontend/API files and preserve gallery room state returned by the Flask API.

## Scope

- Keeps the Phase 4G v5 dark-mode contrast and selector cleanup direction.
- Preserves the Adobe-inspired archive editor visual direction.
- Includes all local editor files that participate in Gallery curation rendering, collection, API calls, route data, and template cache loading so stale mixed-file states do not break the Gallery page.
- Preserves `galleryRoom` in frontend state when `/api/data`, save, restore, or Gallery curation endpoints return it.
- Bumps local editor static cache version to `v=56`.

## Non-goals

- No public-site redesign.
- No Three.js runtime changes.
- No gallery wall placement math changes.
- No collision, plaque fallback, or gallery curation schema changes.
- No new Gallery curation feature work.

## Validation

Validated with syntax checks, public build, Flask API smoke checks, and a static render smoke check confirming that the Gallery page renders the expected 17 wall cards and required curation controls.
