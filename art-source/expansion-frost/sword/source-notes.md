# Frost Tide Sword — source and export notes

## Intended assets

- `public/assets/equipment/frost-tide-sword-v1.png`: 64×64 RGBA equipment sprite.
- `public/assets/interface/item-frost-tide-sword-v1.png`: 128×128 RGBA inventory icon, displayed at 32×32. **Not generated yet.**

The design is an original one-handed straight sword with a pale ice-teal crystalline blade, ivory edge/spine, muted-teal guard, dark-brown leather grip, and a small amber pommel. It follows the accepted sword assets' diagonal grip-bottom-left to tip-upper-right orientation and pixel scale.

## ImageGen source

The first ImageGen output is retained as `frost-tide-sword-imagegen-initial-rgb-1254.png`. It is a 1254×1254 RGB image with an unwanted checkerboard baked into the background, so it is source-only and is not used by the runtime export. The original ImageGen output is also preserved at:

`C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-76a542f6-a15f-4ca6-990f-f0d4b1297af8.png`

Initial prompt:

> Create a new production sprite asset for the existing original 2D pixel-art adventure. Use the supplied accepted sword icons only to match the diagonal bottom-left grip to upper-right point orientation, handle placement, pixel scale, dark outline weight and simple shading; do not copy their blade geometry, guard, ornaments or exact silhouette. Draw one original compact one-handed straight sword: a pale ice-teal crystalline blade with an ivory edge/spine and a few clear glacial facets, a small muted-teal guard, dark-brown leather-wrapped handle, and a tiny warm-amber pommel. Keep the complete tip, blade, guard, grip and pommel inside one transparent square canvas with generous transparent padding, centered and legible when displayed at 32x32. Crisp readable pixel-art pixels, calm powder-blue/ivory/muted-teal palette with a small amber accent. Exact requested canvas: 64x64 pixels, RGBA with true transparent background. No hand, person, aura, water, splash, sparkles, background, floor, shadow, frame, text, logo or watermark.

References used for that generation were the accepted local assets `public/assets/interface/item-guardian-sword-v1.png` and `public/assets/interface/item-steel-sword-v1.png`. The initial call did not set the ImageGen `transparent_background` parameter, despite the prompt requesting transparency; the checkerboard result was rejected for runtime use.

A single targeted ImageGen transparency edit used the initial raw as its reference and explicitly set `transparent_background: true`. Its prompt was:

> Precise transparency edit of the supplied sword asset. Preserve the exact complete sword, its current design, pixel art, diagonal angle, proportions, colors, details and outline. Change only the background: the light-gray and white checkerboard is unwanted opaque background and must be removed completely. Make every pixel outside the sword truly transparent (alpha 0), with no checkerboard pattern left anywhere. Keep the sword fully opaque where drawn, preserve its pixel edges, do not crop or redraw it, and add no glow, shadow, aura, sparkle, backdrop, floor, text or object. Return a real RGBA PNG with a genuinely transparent background.

That output is retained as `frost-tide-sword-imagegen-transparent-rgba-1254.png`, and its original ImageGen output is preserved at:

`C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-1a445939-06a6-4542-aed7-b8a22ac234b3.png`

The edit output is 1254×1254 RGBA with alpha extrema 0–255. The visible sword is intact and the canvas has transparent pixels. A very small low-alpha source speck at the bottom edge was left untouched; no alpha thresholding or cleanup was performed.

## Runtime export

`export_sword_sprite.py` is the packaging step. It loads the transparent ImageGen source, adds 128 transparent pixels on every side without modifying source pixels, then resizes to 64×64 with nearest-neighbor sampling. This is format/size preparation only; the sprite was not drawn, recolored, or background-removed by code. The resulting runtime sprite is 64×64 RGBA with a transparent canvas and visible sword pixels. The current visible alpha bounds are `(13, 12, 53, 56)`.

The source PNGs above are retained unchanged beside this log. The inventory icon remains pending and will be generated and committed separately.
