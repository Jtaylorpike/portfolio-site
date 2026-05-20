# Current Project Handoff — Phase 8 Active

Updated: 2026-05-19

## Current state

Phase 8 is active. Phase 8 is the 3D gallery texture, lighting, atmosphere, and room-realism phase.

Phase 8AL is the current runtime baseline pending local visual review. It builds from the Phase 8AK rollback baseline and avoids new architectural geometry. It calibrates the existing room toward the provided dramatic gallery reference through warmer floor/wall material values, darker smoother ceiling atmosphere, less visually dominant existing ceiling-light panels, and small warm-pool lighting adjustments.

Phase 8AK remains the corrective rollback baseline that removed the rejected Phase 8AJ architectural geometry and restored the Phase 8AI `GalleryScene.ts` and `galleryMaterials.ts` runtime files. Phase 8AJ remains rejected after local visual review. The added ceiling fields, layered recessed fixture wells, perimeter floor/base reveals, and freestanding-wall end caps created intrusive black geometry and did not match the provided dramatic gallery reference. Do not treat Phase 8AJ as current.

Important accepted/rejected history remains: Phase 8N was the accepted screenshot-guided light-volume refinement after the user confirmed it looked great. Phase 8K is rejected/superseded because it made the room much too dark with almost no visible lighting. Phase 8D remains fallback-only/not accepted unless explicitly applied later.

The active runtime path still avoids post-processing, fog, new dependencies, new image assets, external texture assets, room-footprint changes, wall-placement changes, collision changes, plaque-fallback changes, editor/curation changes, mobile-control changes, public-copy changes, routing changes, and SEO/logo/favicon/social-preview work.

## Source-of-truth reminder

Fresh uploaded source files remain authoritative. If this handoff conflicts with current source files, follow the source.

Current architecture remains:

```text
Vite + TypeScript
Vanilla modules, not React
Three.js public 3D gallery
Flask local editor under local-editor/
Active data under src/data/
public/data/ is stale/archive-only and should not be restored as active
```

Replacement packs must be root-relative. The zip root should contain changed project paths directly, such as `src/`, `docs/`, and `PROJECT_CHANGELOG.md`. Do not wrap replacement files under `source/`, `01-source/`, `updated-files/`, or another staging folder. Do not place phase README files at the zip root. Pack notes and manifests belong under `docs/pack-notes/` and `docs/pack-manifests/`.

## Phase 8 visual direction

The working direction is a restrained **museum/private archive** room rather than a stylized game level or decorative showroom.

Target qualities:

- quiet off-white/plaster wall surfaces;
- floor and wall treatments that remain visually stable during movement before texture detail is reintroduced;
- warmer, intentional light balance;
- modest ceiling fixture geometry that feels architectural, not decorative;
- frames, mats, plaques, and wall surfaces that read as physical objects;
- atmosphere based on material contrast, light balance, and spatial restraint rather than heavy fog or effects;
- possible later expansion into a less-square archive layout after current room/collision/editor foundations are protected.



### Phase 8AL — Reference-led surface and light calibration

Status: current runtime baseline pending local visual review.

Scope completed:

- continued from Phase 8AK after the rejected Phase 8AJ geometry was removed;
- avoided new architectural geometry, furniture, end caps, ceiling fields, fixture wells, post-processing, fog, external textures, and dependencies;
- warmed/darkened the floor material so it reads less gray and more like quiet concrete/stone;
- added subtle slab/reveal lines inside the procedural floor texture only, not as geometry;
- warmed and restrained wall plaster texture so wall planes remain clean but less flat;
- darkened and smoothed ceiling material values to hold atmosphere without a broad black slab;
- reduced the visual mass of the existing ceiling light-panel geometry by shrinking/thinning the diffuser and frame values;
- made small lighting calibration changes to lower broad fill while keeping localized warm artwork illumination.

Review should focus on screenshot comparison against the provided generated gallery reference: floor warmth, ceiling atmosphere, fixture dominance, and whether the artwork pools still preserve the liked Phase 8AI/8AK lighting feel.

### Phase 8AK — Remove rejected Phase 8AJ geometry and restore Phase 8AI runtime

Status: current corrective runtime baseline.

Scope completed:

- restored `src/gallery/GalleryScene.ts` from the Phase 8AI uploaded source baseline;
- restored `src/gallery/environment/galleryMaterials.ts` from the Phase 8AI uploaded source baseline;
- removed the rejected Phase 8AJ ceiling architectural fields, layered recessed fixture wells, perimeter floor/base reveal strips, and freestanding-wall end caps from the runtime;
- preserved the Phase 8AI gallery lighting/material balance that the user liked;
- kept gallery lighting architecture, room footprint, wall placement, collision, plaque fallback, editor logic, curation data, mobile controls, image assets, routing, public copy, dependencies, fog, and post-processing out of scope.

### Phase 8AJ — Ceiling architecture and modern fixture geometry

Status: rejected after local visual review. Do not treat as current.

Scope completed:

- preserved the accepted Phase 8AI lighting direction without a broad lighting reset in intent, but the resulting geometry was not accepted;
- added shallow ceiling architectural fields, layered recessed fixture wells, perimeter floor/base reveal strips, and freestanding-wall end caps;
- local review showed these additions created intrusive black vertical/ceiling geometry and moved the room away from the provided dramatic gallery reference;
- superseded by Phase 8AK, which restores the Phase 8AI runtime files and removes the rejected geometry.

### Phase 8J — Dramatic lighting and frame highlights

Status: previous dramatic-lighting baseline after Phase 8L rollback; superseded by Phase 8M pending local visual review.

Scope completed:

- lowered broad ambient/fill lighting so the room has stronger tonal contrast;
- added focused, non-shadow-casting spotlights from existing ceiling panel positions;
- darkened the ceiling and ceiling detail materials for more overhead atmosphere;
- tuned wall, mat, plaque, fixture, trim, and frame materials toward the approved dramatic museum/private-archive mockup;
- added opaque lacquer-catchlight and depth-edge frame rail geometry so dark-stained wood frames catch light more visibly;
- kept procedural surface texture maps, dynamic shadows, transparent shadow geometry, post-processing, new assets, new dependencies, and layout/control changes out of scope.

### Phase 8K — Dramatic lighting target refinement

Status: rejected/superseded by Phase 8L before acceptance.

Scope completed:

- attempted a temporary browser-rendered Three.js harness that avoided local URLs by bundling inline code and using Playwright `page.set_content`;
- confirmed Chromium could execute inline code, but could not create a WebGL context in the sandbox, so exact screenshot iteration was unavailable;
- used the approved mockup/current screenshot luminance gap and conservative source-level tuning instead;
- lowered ambient/fill further and darkened ceiling, floor, trim, and shell materials to move away from the flat bright-grey gallery look;
- added focused non-shadow-casting accent spotlights from curated artwork positions, capped at eight artworks;
- retained the non-shadowing ceiling-panel spotlights from Phase 8J and warmed their falloff;
- refined dark-stained wood/walnut frame material values;
- added narrow angled opaque lacquer-edge bevel geometry to help frame highlights catch light without transparent planes or dynamic shadows;
- made ceiling relief thinner and less decorative.

Manual review result: user reported the pass made the room much too dark with basically no visible lighting, so these runtime changes are not current.

### Phase 8M — Screenshot-guided lighting rebalance

Status: superseded by Phase 8N after local screenshot review showed the ceiling remained too black and fixture light did not shape the room enough.

Scope completed:

- responded to the user's current screenshots rather than making another broad blind darkness pass;
- raised warm base visibility from the Phase 8J/8L dramatic baseline;
- kept the ceiling atmospheric but visibly readable through warmer material values and a subtle emissive floor;
- added restrained non-shadowing artwork accent spotlights, capped at eight artworks;
- retuned ceiling-panel point lights and spotlights for warmer visible pools;
- kept frame material and catchlight changes restrained so frames remain dark stained wood rather than plastic, metallic, orange, or dominant;
- kept procedural surface texture maps, dynamic shadows, transparent shadow geometry, post-processing, fog, new assets, new dependencies, and layout/control/editor changes out of scope.

Screenshot review should use three normal screenshots after a hard refresh: a wide main-artwork view, a close frame/artwork/plaque view, and a corridor/depth view showing multiple fixtures. A capture-mode tool is not required yet.


### Phase 8O — Gallery polish and future lighting backlog

Status: current conservative polish pass after the user confirmed Phase 8N looked great.

Scope completed:

- preserved the successful Phase 8N dramatic-lighting architecture;
- slightly reduced the golden/yellow cast of wall, shell, floor, trim, fixture, and wall-wash colors;
- kept the ceiling dark and atmospheric but marginally more readable;
- softened visible ceiling panel glow so fixtures feel less like flat bright screens;
- tuned frame rail/catchlight colors away from copper/orange toward dark stained walnut;
- documented future local-editor basic/fast gallery lighting toggle;
- documented future visible geometric spotlight/wall-wash fixture objects;
- kept dynamic shadows, procedural texture maps, transparent shadow geometry, post-processing, fog, new assets, dependencies, room/layout/collision/editor/control changes out of scope.

## Hard constraints for Phase 8

Preserve unless a later approved pack explicitly changes them:

- existing gallery curation data flow from `src/data/galleryCuration.json`;
- current wall slot IDs and editor curation logic;
- collision behavior in `src/gallery/controls/movementController.ts`;
- accepted plaque collision/fallback behavior;
- accepted mobile gallery controls and touch cleanup behavior;
- hash routing and Phase 7 SEO/Lighthouse baseline;
- final public copy being user-authored;
- deferred favicon/logo/social preview assets;
- deferred thumbnail efficiency pipeline work.

## Implemented Phase 8 sequence

### Phase 8A — Direction and constraint start

Status: implemented as docs-only.

No runtime files changed.

### Phase 8B — Materials and lighting foundation

Status: implemented, then mostly superseded.

Original scope:

- deterministic procedural floor, wall, ceiling, and paper/mat textures;
- refined trim, frame, plaque body, ceiling panel, and floor material values;
- warmer lower-cost lighting balance;
- static per-artwork contact-shadow planes behind frames as a baked-shadow-style alternative to runtime shadow maps.

Superseded items:

- per-artwork contact-shadow scene wiring was removed by Phase 8C;
- wall and ceiling texture maps were removed by Phase 8E because they produced an unappealing visible top-wall/cap tone;
- remaining floor and paper/mat texture maps were removed by Phase 8F after the user reported a greenish-grey motion trace during camera movement.

### Phase 8C — Gallery load recovery hotfix

Status: implemented and accepted after the user clarified the browser had not refreshed correctly.

Scope completed:

- restored `src/gallery/GalleryScene.ts` to the pre-Phase-8B scene-construction flow;
- removed the Phase 8B experimental per-artwork contact-shadow mesh wiring;
- removed the now-unused contact-shadow material helper from `galleryMaterials.ts`;
- preserved safer material/lighting work at that time.

### Phase 8D — Full runtime rollback fallback

Status: generated but not accepted/current.

This pack was created when the user initially reported the gallery still could not be accessed after Phase 8C. The user then clarified that Phase 8C worked after a proper refresh. Do not treat Phase 8D as the active project state unless the user explicitly says it was applied.

### Phase 8E — Gallery surface tone correction

Status: superseded by Phase 8F after visual review.

Scope:

- removed Phase 8B/8C wall texture maps;
- removed Phase 8B/8C ceiling texture maps;
- restored flat, clean off-white wall and ceiling material tones;
- kept deterministic floor texture;
- kept deterministic paper/mat texture;
- kept refined frame, trim, plaque, and low-cost lighting values;
- avoided dynamic shadows, post-processing, new dependencies, and new image assets.

Files:

```text
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
PROJECT_CHANGELOG.md
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8E_GALLERY_SURFACE_TONE_CORRECTION.md
docs/pack-notes/PACK_NOTES_PHASE8E.md
docs/pack-manifests/PACK_MANIFEST_PHASE8E.txt
```

### Phase 8F — Gallery motion artifact cleanup

Status: accepted stability correction.

Scope:

- removes the remaining procedural floor texture map;
- removes the remaining procedural paper/mat texture map;
- restores flat matte material values from the accepted pre-Phase-8B baseline;
- restores the pre-Phase-8B lighting balance;
- restores safer ceiling light panel material behavior;
- explicitly sets renderer frame-clear flags in `GalleryScene.ts`;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, favicon/logo/social-preview deferrals, and dependencies.

Files:

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
PROJECT_CHANGELOG.md
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8F_GALLERY_MOTION_ARTIFACT_CLEANUP.md
docs/pack-notes/PACK_NOTES_PHASE8F.md
docs/pack-manifests/PACK_MANIFEST_PHASE8F.txt
```

### Phase 8G — Gallery tonal refinement restart

Status: accepted visual baseline.

Scope:

- keeps the stable Phase 8F no-texture-map baseline;
- warms flat wall, shell, ceiling, floor-adjacent, frame, mat, plaque, and trim material values;
- replaces translucent light-panel material with opaque softly emissive material;
- adds simple four-bar ceiling-light fixture frames;
- warms the low-cost hemisphere/directional/point-light balance;
- slightly raises renderer tone-mapping exposure and aligns scene/clear color to the warmer gallery palette;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, favicon/logo/social-preview deferrals, and dependencies.

Files:

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
PROJECT_CHANGELOG.md
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8G_GALLERY_TONAL_REFINEMENT.md
docs/pack-notes/PACK_NOTES_PHASE8G.md
docs/pack-manifests/PACK_MANIFEST_PHASE8G.txt
```


### Phase 8H — Frame and ceiling refinement

Status: accepted geometry/refinement baseline, then tuned by Phase 8I after visual review.

Scope:

- continues the stable Phase 8G no-texture-map/no-shadow-geometry baseline;
- deepens artwork frames by increasing frame depth and border slightly;
- adds a separate dark-wood frame rail material with modest clearcoat response;
- adds four-piece frame rail geometry around each artwork without changing artwork placement, wall placement, collision, or focus targeting;
- updates frame rail geometry when high-resolution artwork textures change resolved frame dimensions;
- adds subtle low-profile ceiling relief strips as opaque geometry rather than using a ceiling texture map;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, favicon/logo/social-preview deferrals, and dependencies.

Files:

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
PROJECT_CHANGELOG.md
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8H_FRAME_AND_CEILING_REFINEMENT.md
docs/pack-notes/PACK_NOTES_PHASE8H.md
docs/pack-manifests/PACK_MANIFEST_PHASE8H.txt
```

### Phase 8I — Frame sheen tuning

Status: partial frame-sheen refinement baseline before Phase 8J dramatic-lighting work.

Scope:

- responds to user visual feedback that the Phase 8H frames were too dark and did not read glossy enough after hard refresh;
- lightens the frame and rail dark-wood/walnut palette modestly while keeping the frame direction restrained and not decorative;
- increases `MeshPhysicalMaterial` clearcoat response and lowers roughness values for the frame and frame rails;
- adds a narrow inner-sheen rail layer as simple opaque geometry so the frame catches light more visibly without texture maps, transparency, dynamic shadows, or post-processing;
- keeps the Phase 8H ceiling relief strips unchanged;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, favicon/logo/social-preview deferrals, and dependencies.

Files:

```text
src/gallery/GalleryScene.ts
src/gallery/environment/galleryMaterials.ts
PROJECT_CHANGELOG.md
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8I_FRAME_SHEEN_TUNING.md
docs/pack-notes/PACK_NOTES_PHASE8I.md
docs/pack-manifests/PACK_MANIFEST_PHASE8I.txt
```

## Next recommended action

Apply Phase 8L only if Phase 8K was applied locally and needs to be reverted. After applying, hard refresh and confirm the gallery returns to the Phase 8J visual/runtime baseline. Future dramatic-lighting work should be narrower than Phase 8K: increase perceived artwork focus and frame highlights without dropping the room's base visibility too far. External tools such as the Three.js Editor or CodePen may help explore isolated lighting ideas, but they cannot replace testing in the real project because the current sandbox cannot create a WebGL context and external editors do not mirror the project's data, routing, camera, controls, frame geometry, wall-placement, or Vite build environment.

### Phase 8N — Light volume and ceiling readability

Status: current runtime baseline pending local visual review.

- reviewed the three user-provided Phase 8M screenshots;
- found the ceiling still read too close to black and fixture lighting did not create enough believable warm surface illumination;
- adds non-shadowing Three.js RectAreaLight fixture and artwork wall-wash lights through the existing `three` dependency;
- raises the ceiling's warm emissive readability while keeping it dark and atmospheric;
- warms and lowers the wall/floor base palette so local light pools become more legible;
- keeps dynamic shadows, procedural surface texture maps, transparent shadow planes, post-processing, fog, new assets, new package dependencies, room changes, wall placement changes, collision changes, plaque fallback changes, editor changes, and mobile-control changes out of scope.



### Phase 8P — Refined gallery lighting polish

Status: current runtime baseline pending local visual review.

- continues from the accepted Phase 8N/8O dramatic-lighting direction;
- responds to the latest user screenshots showing a working but still slightly gold/copper gallery palette;
- slightly neutralizes wall, shell, floor, trim, mat, and plaque materials;
- raises ceiling and ceiling-detail material readability toward warm charcoal/brown;
- softens and slightly shrinks the visible ceiling panel face inside the fixture frame;
- shifts fixture and wall-wash colors toward refined warm museum tungsten instead of saturated yellow;
- slightly lowers artwork wall-wash intensity so feature-wall illumination feels less rectangular and less gold;
- pulls frame rail/catchlight colors away from copper/orange and back toward dark stained walnut;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, image assets, routing, mobile controls, dependencies, public copy, and logo/favicon/social-preview deferrals.


### Phase 8Q — Cooled lighting and surface texture refinement

Status: current runtime baseline pending local visual review.

- continues from the accepted Phase 8N/8O direction and the Phase 8P refined-lighting polish pass;
- responds to the latest screenshots asking for cooler overall lighting, more wall/floor texture, a mostly matte floor with only a hint of reflection, and more polished light/shadow shaping;
- cools and neutralizes the base wall/floor/shell/panel palette;
- introduces subtle deterministic low-frequency wall/floor texture maps directly in `src/gallery/environment/galleryMaterials.ts` with no external assets;
- keeps the floor mostly matte while allowing a restrained reflective response through material tuning;
- cools and narrows fixture/artwork lighting without adding dynamic shadow maps, post-processing, transparent shadow planes, or new dependencies;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, image assets, routing, mobile controls, dependencies, public copy, and logo/favicon/social-preview deferrals.


### Phase 8S — Surface texture enhancement

Status: current runtime baseline pending local visual review.

- continues from Phase 8Q after the user reported visible floor/wall grid seams, over-cool lighting, overly black flat-looking frames, and floating bottom-frame geometry;
- smooths the procedural textures by switching to lower-frequency tileable wall/floor patterns;
- adds a faint matte-marble character to the floor and a very subtle gritty/chipped-paint texture to the ceiling;
- keeps the current frame readability and lighting balance largely intact so texture can be judged in isolation;
- preserves the previously removed floating bottom frame strip fix;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, image assets, routing, mobile controls, dependencies, public copy, and logo/favicon/social-preview deferrals.


### Phase 8T — Texture visibility and ceiling readability

Status: current runtime baseline pending local visual review.

- continues from the accepted Phase 8R balance and the Phase 8S surface-texture attempt;
- responds to user feedback that Phase 8S textures were still not noticeable enough and that the ceiling remained too dark;
- makes the procedural floor/wall/ceiling material maps more visible while keeping them low-frequency and restrained;
- pushes the floor further toward faint matte marble / polished stone with cloudy veining;
- brightens the ceiling material and ceiling atmosphere lift so the gritty/chipped-paint shell texture can read against warm charcoal instead of near-black;
- keeps object shadows deferred to the next focused pass;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, image assets, routing, mobile controls, dependencies, public copy, and logo/favicon/social-preview deferrals.


### Phase 8U — Selective shadows and material readability

Status: current runtime baseline pending local visual review.

- introduces the first focused dynamic-shadow test in Phase 8 after several non-shadow lighting/texture passes failed to make surface character and object depth read strongly enough;
- enables `THREE.PCFSoftShadowMap`;
- casts shadows only from a capped set of ceiling-panel spotlights, not every light;
- makes room surfaces, wall blocks, trim, frames, rails, plaques, and artwork planes participate in shadowing where appropriate;
- reworks the floor texture toward larger matte-marble movement and raises ceiling readability;
- preserves the established room layout, wall placement, collision, plaque fallback, editor curation logic, controls, image assets, routing, public copy, and deferred branding work.


### Phase 8V — Texture reference and loading feedback polish

Status: current runtime baseline pending local visual review.

- continues from Phase 8U after the user provided reference images for marble floor, knockdown/venetian ceiling, and sand-textured gallery walls;
- preserves selective shadows but removes explicit ceiling-grid geometry;
- strengthens procedural texture visibility for floor, wall, and ceiling surfaces;
- lifts the ceiling material so it should no longer collapse toward black;
- adds gallery module prewarming and loading-phase text to improve perceived loading smoothness without changing routing, assets, or dependencies;
- It does not change room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, dependencies, post-processing, fog, transparent shadow planes, logo/favicon/social-preview work, or external texture assets.


### Phase 8W — Gallery lighting import recovery hotfix

Status: build/runtime recovery hotfix. Phase 8V remains the current visual/material baseline pending local review.

- responds to a Vite import-resolution failure after Phase 8V: `Failed to resolve import "./environment/galleryLighting" from "src/gallery/GalleryScene.ts"`;
- root cause in the uploaded source: `src/gallery/GalleryScene.ts` imports `./environment/galleryLighting`, but `src/gallery/environment/galleryLighting.ts` was missing from the applied source tree;
- restores `src/gallery/environment/galleryLighting.ts` from the selective-shadow lighting baseline used by Phase 8U and expected by the current `GalleryScene.ts`;
- does not change room layout, wall placement, collision, plaque fallback, image assets, editor logic, public copy, routing, SEO, or the Phase 8V material/loading polish direction.


### Phase 8X — Texture reference and loading prewarm correction

Status: current runtime baseline pending local visual review.

- responds to the user screenshots showing that Phase 8V + 8W still made the surface textures read too flat and that the loader still appeared to pause during heavier gallery work;
- keeps the current selective-shadow direction for room surfaces but disables ceiling shadow receiving to reduce the ceiling-grid/shadow-line artifact;
- makes wall sand/plaster, floor matte-marble, and ceiling knockdown/Venetian-plaster textures more visible through stronger generated color/roughness/bump maps;
- adds an emissive ceiling texture contribution so the ceiling texture can read even in low light;
- adds direct material-module prewarming to reduce the amount of generated texture work performed during the visible loading state;
- preserves room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, image assets, routing, mobile controls, dependencies, public copy, and logo/favicon/social-preview deferrals.


### Phase 8Z — Gallery runtime recovery and lightweight textures

Phase 8AA is the current surface-restraint baseline pending local review. It restores `prewarmGalleryEnvironmentMaterials` in `galleryMaterials.ts` so the active gallery controller can open the gallery without hitting an undefined prewarm call, and it replaces the heavier Phase 8Y procedural material generation with lighter Canvas-drawn sand/plaster, matte-marble, and knockdown-style texture maps.


### Phase 8AA — Surface restraint and ceiling balance

Status: current runtime baseline pending local visual review.

Phase 8AA responds to local screenshots after Phase 8Z. Phase 8Z successfully recovered the gallery runtime and made wall/floor/ceiling surfaces visible, but the result overshot: the wall surface read too blotchy, the floor marble became too visibly patterned, and the ceiling was readable but still needed restraint. Phase 8AA keeps the lightweight Canvas texture path and restored `prewarmGalleryEnvironmentMaterials` export, but reduces large wall blotches, replaces them with subtler organic sand/plaster grain, reins in floor marble contrast and directionality, and balances the ceiling texture so it remains readable without dominating the room.


### Phase 8AB — Surface unification and floor restraint

Phase 8AH is the current runtime baseline pending local visual review. It follows Phase 8AG after local screenshots showed slower loading and a ceiling that still read too dark. It removes the extra Phase 8AG ceiling rake point lights, reduces selective shadow-map cost, reduces procedural texture-generation footprint by moving color maps to smaller canvases and fewer marks, and lightens the ceiling through material and existing broad/local light balance rather than adding more light objects. It continues after Phase 8AF stabilized the room balance and wall/floor direction, but screenshots still showed the ceiling reading too close to a flat black plane. Phase 8AG keeps the wall/floor balance intact, increases the ceiling knockdown map and bump response, and adds very small localized ceiling rake/lift lighting so finish detail can separate around fixture pools without returning to a broad flat brown ceiling.

This pass is intentionally material-only. It does not change lighting topology, shadow topology, room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, routing, public copy, package dependencies, or image assets.


### Phase 8AC — Ceiling texture recovery and overhead lift

Phase 8AC is the current runtime baseline pending local visual review. It continues from Phase 8AB after screenshots showed the room was more coherent and the floor/walls were more stable, but the ceiling still read as a broad, flat, heavy plane. This pass keeps the restrained wall/floor material direction intact, increases organic ceiling knockdown variation, slightly lifts ceiling material readability, and adds a small overhead/ceiling-atmosphere light lift. It preserves the lightweight Canvas texture path, `prewarmGalleryEnvironmentMaterials`, selective-shadow architecture, room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, dependencies, post-processing, fog, transparent shadow planes, logo/favicon/social-preview deferrals, and external-asset avoidance.


### Phase 8AF — Surface detail visibility and ceiling finish

Status: current runtime baseline pending local visual review.

- continues from Phase 8AC after screenshots showed the gallery was coherent and readable, but the ceiling still felt too broad, uniform, and brown;
- keeps the restrained wall and floor material direction intact;
- pulls the ceiling material back toward darker warm charcoal;
- reduces broad uniform ceiling emissive/overhead wash so the ceiling does not read as one flat brown plane;
- slightly strengthens localized ceiling-panel light pools so fixture-driven lighting remains visible;
- preserves the lightweight Canvas texture path, `prewarmGalleryEnvironmentMaterials`, selective-shadow architecture, room footprint, wall placement, collision, plaque fallback, gallery curation/editor logic, mobile controls, image assets, routing, public copy, dependencies, post-processing boundaries, and external-asset avoidance.


### Phase 8AG — Ceiling finish separation and localized rake light

Status: current runtime baseline pending local visual review.

- responds to Phase 8AF screenshots where the wall/floor balance was stable but the ceiling still read too close to a black slab;
- keeps the current wall and floor direction intact;
- increases ceiling finish contrast and bump response;
- adds restrained ceiling rake/lift point lights to help the ceiling texture register near fixture pools;
- does not change room footprint, wall placement, collision, plaque fallback, editor logic, gallery curation data, mobile controls, routing, public copy, dependencies, or external texture assets.


---

## 2026-05-19 — Phase 8AI staged texture open and ceiling lift

Phase 8AI is the latest Phase 8 gallery visual/performance pass. It responds to local review after Phase 8AH: gallery first-open loading was still slower than desired and the ceiling still needed to read lighter. A Chrome trace from the user showed a long gallery-open frame with image decode/GPU work during the opening path.

Current Phase 8AI source changes:

- `src/gallery/artwork/galleryTextureLoader.ts` now waits only on priority preview textures before scene construction and streams deferred preview/full artwork textures in small idle batches.
- Preview/thumb texture uploads no longer generate mipmaps, reducing early GPU cost.
- `src/gallery/GalleryScene.ts` can accept deferred preview texture updates and prevents a later preview from replacing an already-loaded full texture.
- `src/gallery/environment/galleryLighting.ts` keeps only one low-cost shadow-casting ceiling spotlight and lowers the shadow map size to `384`.
- `src/gallery/environment/galleryMaterials.ts` keeps the floor/wall direction while making the ceiling lighter and reducing procedural texture generation counts.

The intended visual direction remains the dramatic museum/private-archive lighting reference: dark controlled ceiling atmosphere, focused warm artwork illumination, restrained surface texture, matte stone/marble-like floor, and frames with depth. If loading still feels frozen, the next pass should add a true fast/basic gallery lighting mode or staged scene construction rather than more small material-only tweaks.
