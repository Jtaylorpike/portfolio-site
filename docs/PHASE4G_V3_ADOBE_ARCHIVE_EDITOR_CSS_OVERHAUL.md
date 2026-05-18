# Phase 4G v3 — Adobe Archive Editor CSS Overhaul

## Purpose

This pack is a CSS-forward correction to the Phase 4G gallery/editor visual direction. Phase 4G v1 and v2 improved pieces of the Gallery editor, but they still left the local editor feeling like a set of accumulated web UI patches. This pass moves the editor toward a more professional Adobe-style archive/asset-management interface while preserving the existing technical behavior.

## Approved visual direction

```text
Adobe-inspired archive editor: neutral, compact, professional, panel-based, visually quiet, image-first, with small precise controls and no decorative status icons.
```

The local editor should feel closer to Lightroom / Bridge / a metadata inspector than a public marketing page.

## Scope

Changed:

```text
local-editor/static/editor.css
local-editor/templates/editor.html
```

Documentation/changelog files were also updated.

## What changed visually

```text
Neutral gray workspace replaces the warmer webpage-like editor background
Header becomes a compact command area instead of a large hero-style panel
Navigation becomes compact software-style tabs
Buttons are flatter, smaller, rectangular editor controls
Inputs/selects/textareas are tighter and more consistent
Panels/cards use thin neutral borders and reduced radius
Image overview becomes more asset-browser/contact-sheet-like
Import review cards become compact thumbnail-led records
Gallery wall cards become inspector-style panels
Status chips are restrained gray/amber labels
Overlays use a darker professional modal treatment
Checkboxes remain compact neutral controls
```

## What intentionally did not change

```text
No public site styling or behavior changed
No editor JavaScript behavior changed
No editor data model changed
No Gallery curation schema changed
No Three.js runtime changed
No map placement math changed
No collision logic changed
No plaque fallback logic changed
No import behavior changed
No hide/show or bulk-edit behavior changed
```

## Typography constraint

The editor does not use the VCR/pixel font. Technical readouts may use a normal system monospace stack only.

## Cache version

The editor asset version was bumped to `v=53` in `local-editor/templates/editor.html`.

## Validation

Run from repo root:

```powershell
npm run build
```

Manual editor review should cover:

```text
Images overview
Bulk toolbar
Single-image edit page
Import review with thumbnail lightbox
Gallery curation summary
Gallery wall cards
Artwork picker overlay
Gallery preview overlay
Category editor
Backup page
```

## Notes

This is intentionally a visual-system overhaul, not a behavioral feature pack. If any control becomes harder to use visually, correct the CSS while preserving the current JS/data behavior.
