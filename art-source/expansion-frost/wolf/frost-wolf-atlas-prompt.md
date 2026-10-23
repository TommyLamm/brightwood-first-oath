# Frost Wolf Sprite Atlas

Generated with OpenAI image generation; the spacing edit remains the runtime PNG byte-for-byte. The generated source was not re-drawn or resampled.

## Runtime target
- public/assets/actors/monsters/frost-wolf-atlas-v1.png
- 1374x1145 PNG; exact 6 columns x 5 rows with square 229x229 cells.
- Row order: idle, walk, attack, hurt, dead. The runtime should select the required effective counts (2 / 6 / 4 / 2 / 4); all six cells remain present in each generated row.
- Right-facing poses on transparent background. Source has alpha; use 229 as cell size if slicing this original-resolution atlas. Requested 128px cell export was skipped to preserve the generated source exactly and avoid altering pixel art.

## Generation prompt
Production game asset for the existing original 2D side-scrolling adventure. Match the supplied accepted local assets for pixel scale, outline weight, simple shading, proportions and finish. Extend the same world into a snow-covered coastal island: powder blue, pale ivory, muted teal and small warm amber accents. Preserve clear silhouettes at the actual runtime size. No realism, 3D render, neon glow, text, UI, labels, logos or watermarks. Do not copy or include the reference characters.

Create a single clean transparent sprite atlas for a cute enemy named Frostfang Snow Wolf: short compact body, oversized rounded head, white and light gray fur, muted blue-gray back, dark nose, tiny pale ice-blue inner ears, simple dark pixel outlines and simple shading, no large magic effects. Strictly 6 columns by 5 rows, square frames, consistent character scale and right-facing orientation. Arrange rows as idle, walk, attack, hurt, dead. Make idle 2 distinct frames, walk 6 readable cycle poses, attack 4 clear poses showing crouch/telegraph, leap forward, bite, recover, hurt 2 frames, dead 4 frames ending curled on the ground. Keep each frame isolated with clear transparent gaps and no ground shadows, floor, checkerboard, labels or UI. Match the visual finish and cell scale of the supplied boar and mushroom enemy atlas references.

## Targeted spacing edit prompt
Preserve the existing character design, pixel-art style, 6x5 grid, poses, sequence, colors and true transparent background. Recompose each wolf frame smaller and centered inside its own square cell, leaving generous transparent margins on all four sides. Align each pose's feet to a shared baseline near the lower edge while leaving a clear transparent bottom margin. Do not crop or merge cells, add shadows, backgrounds, labels or effects.

## Local references
- art-source/actors/hero-style-reference-v1.png
- public/assets/actors/monsters/boar-atlas-v2.png
- public/assets/actors/monsters/mushroom-atlas-v2.png
- public/assets/environment/env-frost-mid-v1.png
- Generated source: frost-wolf-atlas-generation-source.png
- Spacing edit source: frost-wolf-atlas-spacing-edit-source.png
