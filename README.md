# Franklin Massage Studio — website

A warm, editorial single-page site for Franklin Massage Studio, Zürich.
Refined serene luxury in the spirit of Aman, Aesop, and Six Senses: warm cream
canvas, deep olive, sparing brass, generous white space, Playfair Display +
Lora, and calm low-lit imagery. No clinical lighting, no card-grid clutter.

## Files

- `index.html` — the full page (hero, studio, treatment menu, the space, the
  ritual, apothecary, testimonial, visit, footer).
- `franklin.css` — warm OKLCH design system and layout.
- `franklin.js` — nav-on-scroll, mobile menu, reveal-on-scroll, image fallback.
- `PRODUCT.md` / `DESIGN.md` — brand and design context (the brief, codified).

Open `index.html` in a browser. Fonts load from Google Fonts.

## Imagery

Photos live in `assets/img/` and are committed with the site, so it works
offline and nothing can break at load time:

- `hero.jpg` — warm massage oil poured into open hands (hero)
- `space.jpg` — calm warm-oak treatment space (The Space)
- `ritual.jpg` — hands working through a massage (The Ritual)
- `product-citrus.jpg` / `product-calm.jpg` — the two scrubs (Apothecary)

These are royalty-free Unsplash photographs chosen to match the brief (warm,
intimate, no clinical light) as stand-ins. Replace them with the studio's own
photography by dropping files of the same names into `assets/img/`. Each
`<img>` also degrades to a warm panel if a file is ever missing.

## Content to confirm with the client

Address, phone, email, and opening hours in the Visit section and footer are
placeholders. Prices (CHF) and the treatment list are a proposed luxury-tier
menu; adjust to the studio's real offering.

## Note on the legacy files

`edition-rent.css` and `edition-rent.js` belong to an unrelated dark
car-rental layout that predates this brief. They are left untouched and are not
used by this site.
