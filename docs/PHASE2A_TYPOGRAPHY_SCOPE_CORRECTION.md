# Phase 2A Typography Scope Correction

Generated: 2026-05-13

## Purpose

This correction narrows the Phase 2A typography change. The VCR/pixel-style font should function as a secondary/tertiary accent, not as the main public interface typeface.

## Design rule

- The primary public interface type should remain the normal site sans-serif stack.
- The `Taylor Pike` header/wordmark text should not use the VCR/pixel font.
- Navigation, buttons, labels, and longer copy should not broadly switch to the VCR/pixel font.
- The VCR/pixel font should be reserved for small accent uses, especially numeric details such as hero slide numbers.

## Files changed

```text
src/styles/global.css
```

## CSS behavior

The stylesheet now separates the typography roles:

```text
--font-body       = normal body copy stack
--font-interface  = normal interface stack
--font-accent     = VCR/pixel accent stack
```

The VCR/pixel font is scoped to these minor numeric accents:

```text
.pixel-number
.hero-index-number
.portfolio-index-number
.portfolio-grid-card-index
.image-lightbox-counter
```

The broad interface selector remains on the normal interface stack. This prevents the header name, navigation, buttons, metadata labels, and gallery controls from all becoming pixel-styled.

## What this intentionally does not do

- Does not change website copy.
- Does not change About page content.
- Does not change editor files.
- Does not change gallery data.
- Does not alter the homepage layout.
- Does not broaden the VCR font beyond accent use.

## Manual visual check

After applying:

1. Confirm the `Taylor Pike` header/wordmark is back on the normal site font.
2. Confirm hero slide numbering uses the VCR/pixel accent.
3. Confirm navigation and buttons do not look pixel-styled.
4. Confirm paragraph/body copy remains readable and unchanged.
5. Confirm portfolio/lightbox numeric counters are acceptable as tertiary accents.

## Phase status

Phase 2 remains active. This correction should be treated as part of Phase 2A, not a new phase.
