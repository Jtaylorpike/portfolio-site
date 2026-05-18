# Pack Notes — Phase 6G Horizontal-Phone Homepage Hero Fix

## Summary

This is a narrow follow-up to Phase 6F. It fixes the reported horizontal-phone homepage issue where the hero image looked boxed off or partially covered by the compact copy-panel overlay.

## Apply

Copy the files in this pack over the matching paths in the repository root.

## Validation run

- `npm ci --ignore-scripts`
- `npm run build`
- CSS brace-balance check
- Static Phase 6G source checks
- `unzip -t`

## Notes

This pack only changes the short landscape-phone homepage CSS and related docs. It does not change gallery touch movement, touch camera sensitivity, gallery curation, plaque metadata, editor behavior, About/contact behavior, desktop homepage behavior, or portrait-phone homepage behavior.
