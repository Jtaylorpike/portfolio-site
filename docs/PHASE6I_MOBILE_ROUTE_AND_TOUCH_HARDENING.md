# Phase 6I — Mobile route and touch-interruption hardening

Date: 2026-05-18

## Purpose

Phase 6I follows the confirmed functional Pixel-class horizontal homepage fix. The goal is to keep the current Phase 6 mobile gallery controls and homepage behavior intact while tightening the remaining short landscape-phone routes and making the fullscreen gallery more robust when mobile browsers interrupt active touches.

## Public route updates

The short landscape-phone guard now covers Portfolio and About routes in addition to the homepage-specific Phase 6H guard.

Portfolio behavior in wide, short phone viewports:

- compact header/nav treatment matching the Phase 6H phone-landscape shell;
- horizontal category rail instead of the desktop sticky sidebar;
- tighter heading and metadata spacing;
- compact masonry spacing for horizontal-phone browsing;
- no change to normal desktop, tablet, portrait-phone, or image-lightbox behavior.

About behavior in wide, short phone viewports:

- compact header/nav treatment matching the Phase 6H phone-landscape shell;
- tighter page padding and section gaps;
- smaller headline/body scale for short viewport height;
- less dominant background-float opacity;
- no change to the accepted Phase 5 desktop/portrait About design or editor-managed About copy/photo data.

## Gallery touch hardening

The fullscreen gallery now clears active touch movement/look state during common mobile interruptions:

- window blur;
- page hide;
- document visibility loss;
- orientation change;
- touch-mode renderer resize;
- gallery destroy/teardown.

This reduces the risk of a stuck virtual joystick state or stale captured pointer after rotating the phone, switching apps, closing the browser sheet, or exiting the gallery mid-touch.

The gallery overlay also receives additional touch-callout and overscroll guards so the browser is less likely to treat the fullscreen gallery as a scrollable/selection surface.

## Preserved behavior

Phase 6I does not change:

- Phase 6F touch camera sensitivity;
- Phase 6E movement responsiveness;
- desktop WASD/pointer-lock controls;
- gallery curation data;
- wall placement/collision geometry;
- plaque/info-card metadata formatting;
- editor behavior;
- homepage portrait/mobile behavior;
- Phase 5 About data model or final-copy policy.

## QA notes

Test from the `dev` deployment on a real phone if possible:

1. Open Portfolio in landscape orientation and confirm the category rail is horizontal and the page is usable.
2. Open About in landscape orientation and confirm the page is compact without major header/body collisions.
3. Open the virtual gallery, start moving with the touch pad, rotate the phone, and confirm movement does not remain stuck.
4. Open the virtual gallery, drag to look, switch away from the browser/app, return, and confirm camera/look state feels normal.
5. Confirm the Phase 6F camera feel and Phase 6E movement feel remain unchanged.
