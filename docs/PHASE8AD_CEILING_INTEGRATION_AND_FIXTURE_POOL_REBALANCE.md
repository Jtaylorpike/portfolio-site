# Phase 8AD — Ceiling Integration and Fixture-Pool Rebalance

## Summary

Phase 8AD continues from Phase 8AC after local screenshot review showed the gallery is more coherent and readable, but the ceiling still reads as a broad, uniform brown plane. This pass keeps the restrained wall/floor material direction intact while rebalancing the ceiling toward darker warm charcoal and more localized fixture-driven light.

## Scope

- preserve the Phase 8AB/8AC wall and floor restraint;
- make the ceiling less monolithic and less brown;
- reduce broad uniform ceiling emissive/overhead wash;
- preserve enough localized fixture-pool light that the ceiling does not collapse back into black;
- avoid room layout, collision, plaque fallback, editor, routing, dependency, post-processing, and external-asset changes.

## Files

```text
src/gallery/environment/galleryMaterials.ts
src/gallery/environment/galleryLighting.ts
docs/CURRENT_PROJECT_HANDOFF.md
docs/CURRENT_PROJECT_HANDOFF_PHASE8_ACTIVE.md
docs/PROJECT_ROADMAP_CURRENT.md
docs/CHAT_TRANSFER_AND_UPLOAD_WORKFLOW.md
docs/PHASE8AD_CEILING_INTEGRATION_AND_FIXTURE_POOL_REBALANCE.md
docs/pack-notes/PACK_NOTES_PHASE8AD.md
docs/pack-manifests/PACK_MANIFEST_PHASE8AD.txt
PROJECT_CHANGELOG.md
```

## Validation

- `npm run build`
- `unzip -t` on the final root-format pack
