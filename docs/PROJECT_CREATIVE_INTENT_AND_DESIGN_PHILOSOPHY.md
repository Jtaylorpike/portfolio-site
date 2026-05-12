# Taylor Pike Portfolio Site - Creative Intent and Design Philosophy

This document exists to preserve the human side of the project, not just the technical state. The portfolio is not intended to become a generic dark portfolio template. It is a personal photography-first system that should feel deliberate, quiet, archival, and authored.

## Core identity

The site should feel like a refined editorial gallery index: dark, restrained, image-led, and technical without feeling like software UI. The visual language should borrow from gallery catalogs, contact sheets, archive indexes, museum labels, and experimental photography websites more than from commercial SaaS dashboards or generic creative portfolios.

The current homepage direction is a black/charcoal editorial interface with a large central hero image, a left numbered slide index, bottom contact-sheet thumbnails, thin guide lines, and a small metadata panel. The preferred homepage language is:

```text
Selected Work
A visual archive of movement, space, and imagination.
```

The portfolio index should keep the same archival/index feeling with numbered categories, subtle metadata, restrained motion, and image cards that serve the photography instead of decorating around it.

## Design philosophy

The design should be simple, but not plain. It should look intentional even when it is minimal. Avoid default portfolio patterns such as loud CTA sections, generic pill buttons, over-rounded cards, heavy gradients, and friendly template-like layouts unless there is a specific design reason.

The site can eventually support other creative modes, including a late-90s/early-2000s theme toggle, but the default system should remain photography-first and refined. Future experimental modes should be designed as alternate layers over a stable content architecture, not as random visual changes to the main portfolio.

## 3D gallery direction

The 3D gallery should eventually feel like a mix of a museum and a private archive. It should feel like a real room: architectural, quiet, curated, and physically plausible. The ceiling, floor, room shell, lighting, wall blocks, frames, plaques, and movement scale should all contribute to that sense of place.

Long-term, the gallery may include windows that reflect the user's local time of day outside. That idea should be treated as environmental storytelling, not a gimmick. Windows should make the room feel more real and specific while preserving the museum/private-archive mood.

Important accepted constraints:

- Keep the gallery room-like, not a void or platform.
- Keep the ceiling unless there is a deliberate redesign.
- Keep fog/haze disabled by default because it was visually intrusive.
- Keep plaques integrated with the wall system, not floating UI labels.
- Do not casually change collision, room scale, lighting, wall layout, movement bounds, or plaque placement.
- Let editor curation controls manage what appears on the walls before rebuilding the physical gallery layout.

## Editor end goal

The local editor is moving toward being the project's private CMS and gallery management surface. It should eventually let the user maintain the site without manually editing JSON or moving files. It should manage imports, title-based IDs, safe image ID renames, image renditions, hero eligibility, crops, categories, 3D gallery wall assignments, plaque behavior, and eventually richer room curation.

The editor should remain grounded in the source-controlled static-site architecture. It should write the active data files in `src/data/` and preserve the rendition-based image pipeline under `public/images/portfolio/{display,thumb,texture,full}`.

## What changed in understanding

Earlier work could treat the site as a technical portfolio with a dark style. The better understanding is more specific: this is a personal visual archive with a museum/private-archive gallery direction, a restrained editorial UI system, and a long-term editor that acts as the creative control room for the whole project.

That means future updates should be evaluated against whether they preserve the authored, image-led, archival character of the project. A feature can be technically correct and still be wrong if it makes the site feel generic, cluttered, or template-like.
