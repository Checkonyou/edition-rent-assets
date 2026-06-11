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

Photo slots use placeholder images and degrade to warm panels if a photo fails
to load. Swap the `src` of each `<img data-photo>` for the studio's own
photography (the treatment room, the lounge, and the two scrub jars). The hero,
the two split sections, and the two product images are the slots to replace.

## Content to confirm with the client

Address, phone, email, and opening hours in the Visit section and footer are
placeholders. Prices (CHF) and the treatment list are a proposed luxury-tier
menu; adjust to the studio's real offering.

## Note on the legacy files

`edition-rent.css` and `edition-rent.js` belong to an unrelated dark
car-rental layout that predates this brief. They are left untouched and are not
used by this site.
