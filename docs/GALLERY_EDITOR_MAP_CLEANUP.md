# Gallery Editor Map Cleanup

## Purpose

This update keeps the gallery map as the source of truth for physical wall placement and removes duplicate placement copy from individual wall cards.

## What changed

- The visible **Map placement** section was removed from each wall card.
- Placement values still exist as hidden editor state so save, drag/drop, collision, rotation, and runtime gallery behavior continue to work.
- The gallery summary/map block was tightened so the map area does not create unnecessary blank space below itself.
- Wall cards now focus on the content decisions that still make sense away from the map:
  - assigned artwork
  - wall block type
  - plaque side
  - display status
  - plaque enabled/disabled
  - save/remove actions

## Current model

Physical placement should be controlled from the floor map. The wall cards are now the metadata/content layer for each wall entity.

This separation is intentional:

```text
Map = where the wall is and which way it faces.
Card = what the wall is, what artwork it carries, and how it behaves.
```
