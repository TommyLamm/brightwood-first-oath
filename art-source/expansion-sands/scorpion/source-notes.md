# Sand Scorpion atlas — source-only candidates (not runtime-ready)

## Intended contract

- Requested runtime path: `public/assets/actors/monsters/sand-scorpion-atlas-v1.png`.
- Requested grid: 6 columns × 5 rows, cell order idle 2 / walk 6 / sting attack 4 / hurt 2 / dead 4; face right; runtime 96×96; collision 50×42.
- No runtime atlas or export was produced in this stage because the generated candidates contain visible red-colored edge artifacts. The raw sources below are preserved for review; do not treat them as accepted runtime assets.

The monster design is a lean, warm amber-glass-backed scorpion with two readable pincers, short legs and a raised segmented tail. The accepted boar atlas was used only for the existing game’s warm pixel-art finish, outline, shading and scale.

## ImageGen generation 1

ImageGen used `transparent_background: true` and referenced `public/assets/actors/monsters/boar-atlas-v2.png` for style only. Prompt:

> Create one production-ready transparent game sprite atlas for the new monster “琥珀蠍 / Amber Scorpion”. Use the supplied accepted boar atlas ONLY to match the existing warm hand-painted pixel-art finish, pixel scale, dark outline weight, simple shading and sprite proportions; do not copy any boar features. Original lean sand scorpion with a clear amber-glass segmented back, warm ochre and bronze plates, muted cream underside, dark brown pixel outline, two distinct pincers, eight short readable legs, small dark eyes and one raised segmented tail with a clearly visible stinger. Right-facing side view, consistent design and scale in every cell; no ice/frost palette or wolf/crab traits. Exact atlas layout: 6 columns × 5 rows of equal square 256×256 transparent cells, whole canvas exactly 1536×1280. One complete scorpion per cell, centered, never touching or crossing a cell boundary. Keep the entire silhouette—including tail, stinger, legs and pincers—within about 65% of each cell width and height; leave broad visible transparent margins, with the lowest feet near local y=202. Crisp pixels readable at 96×96 runtime, body scale appropriate for a 50×42 collision box. Rows in order: row 1 idle, 2 distinct frames then repeat idle frame 2 in remaining cells; row 2 walk, 6 distinct alternating-leg frames; row 3 sting attack, 4 readable frames: coil tail high, draw tail forward, thrust stinger down-forward, recover to raised-tail stance, then repeat recovery; row 4 hurt, 2 distinct recoiling frames then repeat frame 2; row 5 dead, 4 distinct frames folding legs and lowering the tail until still, then repeat final dead frame. Maintain identical ground baseline, facing, proportions and spacing across the atlas. True transparent alpha everywhere else. No cell dividers, grid lines, background, checkerboard, floor, cast shadow, glow, particles, blood, text, labels, logo or watermark.

Raw ImageGen output is preserved as `sand-scorpion-imagegen-atlas-initial-1374x1145.png` (tool path: `C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-fd0c90cb-aead-4389-b929-8d6e0d4e5d4e.png`). It is RGBA 1374×1145 with alpha extrema 0–255. The returned size divides evenly into 6×5 cells of 229×229, rather than the requested 1536×1280. Visual inspection showed conspicuous bright-red edge/fringe artifacts and some frames too close to cut lines, so it was not accepted as runtime.

## ImageGen edit 1 — spacing and fringe

The initial raw was viewed before a targeted edit. ImageGen used `transparent_background: true`, referencing only the initial raw. Prompt:

> Targeted layout correction of this exact 1374×1145 RGBA scorpion atlas. Keep the exact canvas and fixed 6-column × 5-row grid of 229×229 cells; preserve the same 30 amber scorpions, identities, poses, colors, right-facing direction and row order. Change only these defects: uniformly scale each existing complete scorpion to about 72% of its current visual size and center it inside its original cell, with its lowest feet near local y=202 and at least 20 visibly transparent pixels between every part of the sprite and every cell edge. Keep all legs, pincers, tail and stinger completely inside that cell. Remove the anomalous bright-red fringe/speckles around the sprites and leave those areas truly transparent; keep the scorpion's own dark brown outline and amber/bronze shell unchanged. Do not move or resize the canvas or grid. Preserve row 1 idle, row 2 walk, row 3 four-frame tail sting, row 4 hurt, row 5 dead, and the repeated end poses in unused cells. No glow, red effect, blood, grid/dividers, background, ground, text or extra objects.

Raw edit is preserved as `sand-scorpion-imagegen-atlas-spacing-edit-1374x1145.png` (tool path: `C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-3292fb19-d037-4340-8f10-813ad7f7efaa.png`). It is RGBA 1374×1145, alpha extrema 0–255. A focused cut-line check found alpha>8 counts of 0, 36, 22, 56 and 53 on vertical lines x=229, 458, 687, 916 and 1145, respectively; horizontal lines y=229, 458, 687 and 916 had no alpha>8 pixels. The line overlap persisted, so this edit was also rejected as runtime.

## ImageGen edit 2 — exact cut-line clearance

The first edit was viewed before this targeted correction. ImageGen used `transparent_background: true`, referencing only the first edit. Prompt:

> One final precise spacing correction to this exact 1374×1145 RGBA 6×5 atlas. Preserve the same canvas, exact grid, same scorpion design, row poses and order. The current frames still touch vertical cutlines. Uniformly shrink every complete scorpion to a maximum silhouette bounding box of 145×145 pixels within its original 229×229 cell, then center it in that cell; align upright-frame feet near local y=198. This leaves at least 37 px of empty transparent safety margin on every side. Every tail tip, stinger, leg and pincer must stay entirely within its own cell with a clearly empty gap at every grid cutline. Keep right-facing direction, warm amber/bronze shell and dark brown outline. No saturated red fringe or glow. Do not change canvas or grid, add dividers, redraw the identity, crop any creature, or add background/ground/shadow/text.

Raw edit is preserved as `sand-scorpion-imagegen-atlas-spacing-edit2-1374x1145.png` (tool path: `C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-bdec92df-55e2-4ff7-820b-7d9a0d4fc7d1.png`). It is RGBA 1374×1145 with alpha extrema 0–255. A focused check confirmed alpha>8 count was zero on all vertical grid lines (x=229, 458, 687, 916, 1145) and horizontal grid lines (y=229, 458, 687, 916). However the sprites still have a conspicuous red fringe: using red-like RGB (`R>170` and `R>1.8×G` and `R>1.8×B`) with alpha>0 found 105,964 pixels, 73,400 of them with alpha>8 and maximum alpha 254. Visual review confirms this is a strong colored edge artifact, not a harmless transparent matte. No runtime export was made.

## Disposition

All three ImageGen originals are retained unchanged. There is no accepted scorpion atlas and no formatting/export step for it. Do not threshold alpha, recolor, or use code to erase the fringe. A new visual generation approach would be needed before producing runtime art.
