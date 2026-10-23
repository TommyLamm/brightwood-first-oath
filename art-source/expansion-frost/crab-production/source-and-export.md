# Frost Crab atlas source and export

- Asset: `frost-crab-atlas-v1.png`; map/monster: `frost-crab` / Frost Crab.
- Runtime file: `public/assets/actors/monsters/frost-crab-atlas-v1.png` (1374 x 1145; 6 columns x 5 rows; 229 x 229 source cells; runtime display 96 x 96).
- Original generated image: `frost-crab-atlas-raw-1373x1145.png` in this directory, copied byte-for-byte from `C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-37995e66-ebf9-4cca-83c1-647ab8db5423.png`.
- Raw SHA-256: `2ecccbc4e03daae08df0cb0730f5943c0881f335c848cb252f316ebd28c6ac5c`.
- Image generation/edit used the built-in ImageGen tool. The initial generation specification requested a compact original right-facing ivory and gray-teal crab with small pale-blue ice plates, clear short legs and large readable claws; a transparent 6 x 5 atlas; idle/walk/attack/hurt/dead rows with 2/6/4/2/4 effective frames; and clean pixel-art silhouettes.

## Targeted edit prompt

> Keep this exact 1374x1145 transparent 6-column by 5-row atlas, same 30 crabs and same poses. Recompose each EXISTING complete crab at HALF its current visual size inside its original 229x229 cell, then place it near the center with its lowest foot at local y=180. Do not scale or shift the whole canvas or grid. The result must have wide visibly empty transparent space on all four sides of every crab; every leg and extended attack claw must stay completely inside its own cell. Preserve the crab design, right-facing direction, colors, pose order, pixel edges and alpha. No redraw of identity, grid lines, text, backdrop, floor, shadow, glow, extra objects, clipping or pixels in neighboring cells.

## Export and validation

The generated raw image was 1373 x 1145, with transparent corner alpha. To satisfy the equal-cell loader contract, the runtime export adds exactly one fully transparent pixel column on the right. The source canvas content was copied at (0, 0) without scaling, resampling, repainting, or alpha editing. A pixel-buffer comparison confirmed all original RGBA pixels are unchanged in the runtime image, and the added rightmost column has alpha extrema (0, 0).

The runtime sheet is exactly 1374 x 1145, yielding 229 x 229 cells. The original sheet did not meet the requested 16px safety margin on every side: lower-row feet remain visually close to their cell bottoms. Acceptance is based on complete cell slicing and no visible cross-cell contamination. In a lightweight check, all five estimated vertical cell boundaries and four horizontal boundaries, each including the adjacent 1px on either side, had zero pixels with alpha > 8 (and zero pixels with alpha > 128). The original image and runtime export were visually inspected.

Row contract: idle 2, walk 6, attack 4, hurt 2, dead 4. Crab faces right. Keep this source-only record with the generated raw image; runtime consumers should use the 229px cells and display at 96 x 96.
