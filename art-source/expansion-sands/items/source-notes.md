# Amber Scale icon — source and export notes

## Intended asset

- `public/assets/interface/item-amber-scale-v1.png`: 128×128 RGBA inventory icon, displayed at 32×32.

The icon is one curved, tapered amber carapace scale with a dark ochre edge, honey-gold highlights and a layered ridge. It is an item-scale material, not a whole snail shell or creature.

## ImageGen source

Generated as a new icon with the built-in ImageGen tool using `transparent_background: true`. Reference used only for accepted local item-icon outline, pixel scale and shading: `public/assets/interface/item-snail-shell-v1.png`.

Exact prompt:

> Create a single 128×128 RGBA inventory icon for a material dropped by the new Amber Scorpion: one curved amber carapace scale. Use the supplied accepted item icon only for its warm hand-painted pixel-art finish, dark outline weight, simple shading, pixel scale and centered presentation; do not copy its snail, spiral, moss or shell pattern. Draw one broad, slightly cupped, tapered scale plate with a dark ochre-brown edge, rich honey-amber center, two restrained golden highlights and a subtle layered ridge. Clear distinct silhouette, centered and filling about 65% of the square so it remains recognizable at 32×32. True transparent background with safe margin. No letters, text, label, frame, UI, full creature, pincers, tail, extra item, glow, sparkles, floor, cast shadow, backdrop, checkerboard, logo or watermark.

The original is preserved as `item-amber-scale-imagegen-rgba-1254.png`; ImageGen saved it at `C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-0d47f4c8-e7ed-4c70-a17d-ccfd4c17b09a.png`. Raw size is 1254×1254 RGBA, alpha extrema 0–255, with a transparent background.

## Runtime export

`export_amber_scale_icon.py` adds 128 transparent pixels on all sides and uses nearest-neighbor resizing to export `public/assets/interface/item-amber-scale-v1.png` at 128×128 RGBA. This is packaging only; it does not draw, recolor or remove backgrounds. Final alpha extrema are 0–255 and visible-alpha bounds are `(20, 20, 108, 109)`, approximately 22×22 pixels when displayed at 32×32. The icon was visually inspected at the final size.
