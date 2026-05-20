# Pack Notes — Phase 8AH Loading Cost Rollback and Ceiling Lift

## Apply

Copy the contents of this root-format pack directly into the project root and overwrite matching files.

## Summary

- removes the extra Phase 8AG ceiling rake point lights;
- reduces selective shadow-map cost;
- reduces procedural material texture-generation cost;
- lightens the ceiling through existing material and light balance;
- keeps the wall/floor/gallery runtime direction intact.

## Validation

```text
npm run build
unzip -t
```
