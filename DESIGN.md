# Franklin Massage Studio — Design

## Theme

Light, warm, editorial. The surface is warm cream, not white. Never dark, never
clinical. Photography is warm and low-lit (candle/dusk), never bright-clinical.

## Color (OKLCH, warm-tinted neutrals)

Strategy: committed warm-neutral canvas with deep olive as the brand color and
brass as a sparing accent (well under 10% of any surface).

- `--cream`      oklch(0.965 0.013 84)   page canvas
- `--cream-2`    oklch(0.945 0.018 80)   alternate section
- `--sand`       oklch(0.90 0.022 76)    panels, image fallback
- `--ink`        oklch(0.285 0.018 68)   primary text (warm near-black brown)
- `--ink-soft`   oklch(0.44 0.02 66)     secondary text
- `--olive`      oklch(0.44 0.052 124)   brand / dark sections / accents
- `--olive-deep` oklch(0.33 0.042 124)
- `--olive-soft` oklch(0.60 0.05 122)
- `--clay`       oklch(0.70 0.038 52)    terracotta warmth
- `--brass`      oklch(0.66 0.085 78)    metallic accent, hairline highlights
- `--line`       oklch(0.84 0.02 74)     hairlines

## Type

- Headings: Playfair Display (500/600), high-contrast editorial serif.
- Body: Lora (400/500), warm humanist serif. Body 1.0625rem, line-height 1.8,
  measure capped ~68ch.
- Eyebrows / labels: Lora, uppercase, letter-spacing 0.28em, ~0.72rem, olive.
- Scale ratio >= 1.25 between steps. Hero clamp up to ~6.5rem.

## Layout

- Generous, varied whitespace. Sections breathe (clamp 6–9rem vertical).
- Asymmetric, magazine grids. Avoid uniform card grids.
- Treatment menu = editorial price list with leader dots, not cards.
- Hairline rules in `--line`, never colored side-stripes.

## Motion

- Reveal on scroll (opacity + small translate), ease-out-quint, ~0.8s.
- No layout-property animation, no bounce, no custom cursor.

## Imagery

Warm, intimate, low-lit. Every image slot has a warm `--sand`/olive fallback so
a failed load still reads as an intentional panel. Replace placeholder photos
with the studio's own photography.
