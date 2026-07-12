# Assets — social preview card

`social-preview.svg` is the **editable master** for the Open Graph / Twitter card. The three
rendered PNGs are generated from it, never hand-edited:

- `social-preview.png` — the master's rendered copy (kept here for reference)
- `../app/opengraph-image.png` — served as the site OG image
- `../app/twitter-image.png` — served as the Twitter card (identical bytes)

## Regenerate after editing the SVG

Rendered with **librosvg** (`rsvg-convert`, `brew install librsvg`) — the byte-faithful renderer the
card was authored with (Chromium/other renderers shift the font weight):

```bash
rsvg-convert -w 1280 -h 640 assets/social-preview.svg -o assets/social-preview.png
cp assets/social-preview.png app/opengraph-image.png
cp assets/social-preview.png app/twitter-image.png
```

Then update the two `../app/*-image.alt.txt` files to match the new copy. The three-pillar CI guard
(`scripts/three-pillar-guard.sh`) fails the build if a "four-pillar" string reaches the alt text.
