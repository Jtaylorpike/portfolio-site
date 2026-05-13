# Site Overall Review and Next Steps

Date: 2026-05-13

## Current state

The site is now in a stronger architectural position than it was at the start of the editor/gallery work.

The main public site is still a Vite + TypeScript + vanilla module application. It is not React. The local Flask editor is now a meaningful production tool rather than a simple JSON helper.

Major current areas:

```text
Homepage/editorial hero
Portfolio index and lightbox
Desktop virtual 3D gallery
Local Flask editor
Rendition-based image pipeline
Gallery curation/map editor
```

## What is working well

### 1. The site has a real visual direction

The strongest public-site direction is the dark editorial/gallery-index look:

```text
black/charcoal background
large image-led hero
numbered visual index
contact-sheet thumbnails
small metadata panels
thin technical/gallery lines
archive/editorial feel
```

This is a strong identity. Future UI work should protect it and avoid generic portfolio-template styling.

### 2. The image pipeline is now durable

The active image model is clear:

```text
src/data/*.json
public/images/portfolio/display/
public/images/portfolio/thumb/
public/images/portfolio/texture/
public/images/portfolio/full/
```

Categories belong in data, not folders. This should remain true.

### 3. The editor is becoming the private CMS

The editor now handles imports, identity/rename workflow, curation, gallery assignment, wall entities, map placement, and collision checks. That is the right direction.

Long-term, the editor should become the private CMS for the whole project.

### 4. The 3D gallery is becoming authored rather than hardcoded

The gallery now has:

```text
curated wall entities
grid placement
collision checks
hidden vs placed semantics
plaque fallback behavior
room footprint baseline data
```

That makes future room expansion more realistic.

## Current weak spots

### 1. The public site has not had the same level of review as the editor

Recent work has focused heavily on the local editor and 3D gallery controls. The homepage, portfolio index, about page, mobile behavior, and public gallery entry flow should get a focused review next.

### 2. The editor map and runtime room are not fully unified yet

`galleryRoom.json` now exists, but the editor map still needs to become fully room-aware. The eventual goal is one shared architectural model across:

```text
room data
editor map
runtime floor/shell
movement bounds
wall placement validation
```

### 3. The about/project storytelling layer likely needs refinement

The site currently has strong visual systems, but the personal/creative narrative should eventually be sharpened so the site feels like Taylor Pike's authored visual archive, not just a technical portfolio.

### 4. The 3D gallery still needs a public experience review

The editor can control more of the room now, but the actual runtime gallery needs a deliberate walkthrough:

```text
entry feeling
scale
wall spacing
image placement
plaque readability
lighting
movement comfort
sense of museum/private archive
```

### 5. Mobile strategy should be formalized

The 3D gallery is desktop-only for now, which is fine. The mobile fallback should feel intentional rather than apologetic. The traditional portfolio should remain the strong mobile experience.

## Recommended next roadmap

### Phase 1: Stabilize and document the current system

Status: mostly complete.

Remaining useful work:

```text
room/editor model baseline
room footprint data baseline
site-wide review document
```

### Phase 2: Public site review and polish

Recommended next major focus after this pack.

Work areas:

```text
homepage visual pass
portfolio index visual hierarchy
about page content/design pass
mobile portfolio pass
gallery entry CTA behavior
image loading/performance pass
```

### Phase 3: 3D gallery room model

Do this after public-site review unless a gallery issue blocks the project.

Work areas:

```text
room dimensions from data
editor map reads room data
larger rectangular room preset
non-square room footprint planning
lighting zones
possible window wall/time-of-day concept planning
```

### Phase 4: More complete private CMS/editor

Work areas:

```text
room footprint editor
category management polish
hero management polish
public-page copy/content controls
backup/handoff automation cleanup
server-side/cloud editor path
```

## Recommended immediate next step

The next best work should be a **public site review and polish pack**.

Suggested scope:

```text
review homepage, portfolio, about, and mobile behavior
identify visual inconsistencies
clean up obvious UI/copy issues
avoid redesigning the entire site
keep the dark editorial/gallery-index direction intact
```

The editor is stable enough to pause feature work. The site as a whole should now be judged as a portfolio experience, not only as a tool-building exercise.
