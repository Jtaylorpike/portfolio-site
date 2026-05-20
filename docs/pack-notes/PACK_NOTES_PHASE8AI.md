# Pack Notes — Phase 8AI Staged Texture Open and Ceiling Lift

## Apply

Copy the contents of this root-format pack directly into the project root and overwrite matching files.

## Summary

- stages gallery texture loading so the first room render waits on fewer image decodes;
- streams remaining preview/full artwork textures in small idle batches;
- reduces early preview texture GPU cost;
- keeps one low-cost dynamic shadow source instead of the previous entry/rear pair;
- lightens the ceiling while keeping the current wall/floor direction intact.

## Validation

```text
npm run build
unzip -t
```
