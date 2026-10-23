# Frost-crab atlas exploration (source only)

Status: no runtime atlas selected from these attempts. The production frost-crab atlas requires an exact 6×5 set of equal cells with safe transparent edges. These raw generations are retained for provenance and as design references only. Expansion Art owns the replacement runtime atlas after handoff. Do not wire any candidate below into the manifest or runtime.

## Reviewed references and contract

- Wolf visual preview: C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-e10d02a0-60da-47b4-b08c-cf6bc35a21e3.png (viewed; transparent 6×5 pixel-art preview, 1374×1145).
- Accepted boar atlas: public/assets/actors/monsters/boar-atlas-v2.png (viewed for compact readable pixel style).
- Game Expansion contract: public/assets/actors/monsters/frost-crab-atlas-v1.png; 6 columns × 5 rows; target 128px/cell; rows idle/walk/attack/hurt/dead with 2/6/4/2/4 active frames; unused cells repeat the row's last valid frame; 96×96 runtime display; right-facing; real alpha; consistent baseline and about 16px safety margin. Root later confirmed higher-resolution divisible 6×5 may be considered if it slices cleanly. Known cross-cell candidates are not suitable runtime art.

## Attempt 1 — initial imagegen atlas

- Raw output copied unchanged to frost-crab-generated-v1.png.
- Original tool path: C:\Users\Tommy\.codex\generated_images\01a16a05-d08d-7e72-b24c-599efeb1c5cc\exec-31391c6a-e690-4fbd-b4e0-169748626551.png.
- Output: 1374×1145 RGBA; alpha extrema 0–255; approximately 6×5 at 229px/cell.
- Disposition: readable character design, but the crab was too large and sprite pixels touched/crossed cell edges. Not a runtime asset.
- References supplied to imagegen: wolf preview and boar-atlas-v2.png.

Prompt:
Create one game-ready 2D pixel-art enemy sprite atlas PNG using the two supplied references only for visual style: follow the accepted boar atlas's compact readable pixel scale, dark outline and restrained shading; use the wolf preview only as a muted cool palette cue. The character itself must be a clearly distinct, original ice-armored shore crab, not a wolf or boar: low, broad silhouette, ivory and muted teal shell, a few pale ice-blue armor plates, two small expressive eyes, one readable claw pair and four pairs of short legs. Strict side profile facing right in every frame. Keep the same crab design, scale, shell markings, facial features and facing direction across all frames. Cute 2D game sprite, crisp pixel-art edges, simple shaded clusters, dark blue-gray outline, no glows.

Exact atlas layout: single canvas 768 pixels wide by 640 pixels high, 6 columns by 5 rows, each cell exactly 128 by 128. No visible grid, separators or padding between cells. Use true transparent alpha for everything outside the crab. Each frame has at least 16 fully transparent pixels on every side inside its own 128x128 cell, with feet aligned to a consistent ground baseline near y=110 in all rows. Sprite fills about 70-82 pixels wide and 55-72 pixels high; its full silhouette must be inside each cell.

Rows from top to bottom:
1 idle: two subtly different relaxed frames in cells 1-2, then repeat idle frame 2 exactly in cells 3-6.
2 walk: six distinct successive alternating short-leg gait frames.
3 attack: four readable beats, brace low and draw claws in; push forward; low forward lunge with one claw extended; stop and recover. Cells 5-6 exactly repeat attack frame 4. This is a short-dash pose only, with no baked-in movement effect.
4 hurt: two small recoil/squash frames in cells 1-2, then repeat hurt frame 2 exactly in cells 3-6.
5 dead: four progression frames: stagger, tip onto its side, collapse onto ground, settle still; cells 5-6 exactly repeat dead frame 4.

Every sprite is a complete isolated frame, with matching scale and aligned feet. No background, scenery, ground/shadow, particles, speed lines, glow, ice effects outside the shell, UI, text, labels, numbers, watermark, frame borders, checkerboard, or guide lines.

## Attempt 2 — imagegen reframing edit

- Raw output copied unchanged to frost-crab-reframed-generated-v1.png.
- Original tool path: C:\Users\Tommy\.codex\generated_images\01a16a05-d08d-7e72-b24c-599efeb1c5cc\exec-243fd875-25dd-4387-ad5f-8dcbab2c0489.png.
- Output: 1375×1144 RGBA; alpha extrema 0–255; dimensions do not form integral equal 6×5 cells.
- Disposition: smaller appearance, but sprite edges still touch cell boundaries. Not a runtime asset.
- Reference supplied to imagegen: initial generated atlas.

Prompt:
Edit this supplied crab animation atlas while preserving its charming original crab design, cool ivory / muted teal / pale-blue palette, and row-by-row animation sequence. The current sprites are too large and touch cell edges. Reframe them smaller; do not crop or cut off any crab.

The image canvas is a 6-column by 5-row atlas with 30 equal square cells. Keep the same grid, same row order, same crab and poses. In every individual cell, scale the complete crab down uniformly to fit inside a centered 170 by 170 pixel area of its original 229 by 229 pixel cell; this leaves at least 29 pixels of clean true transparency on all four sides. Align all feet to one shared baseline across all rows, with the final feet line around 200px from each cell's top (approximately 29px transparent bottom margin). Each crab must be visibly separated from every other crab by clear transparent gaps. The visible character should read as a smaller 2D pixel-art sprite, not fill the cell.

Maintain the existing 6x5 grid and animation: row 1 idle (first two poses, then repeats pose 2); row 2 six walking poses; row 3 four attack beats (brace, push, forward lunge, recover, then repeat recover); row 4 two hurt poses then repeat pose 2; row 5 four falling/dead poses then repeat final still pose. Keep all characters facing right, with complete outlines and matching size. Transparent background outside sprites, no scene, shadows, grid lines, cell borders, labels or text.

## Attempt 3 — best design candidate before targeted edit

- Raw output copied unchanged to frost-crab-atlas-candidate-v3.png.
- Original tool path: C:\Users\Tommy\.codex\generated_images\01a16a05-d08d-7e72-b24c-599efeb1c5cc\exec-19cdf2d4-3f43-4cee-969f-22e3e66f5056.png.
- Output: 1374×1145 RGBA; alpha extrema 0–255; exact 6×5 grid of 229×229 cells.
- Disposition: best character/palette reference (broad low silhouette, ivory/teal ice armor, amber eye, large readable claw). Per-cell contacts at boundaries mean slicing can clip feet or include pixels from the neighboring row. Not runtime art; handed off to Expansion Art.
- References supplied: wolf preview and boar-atlas-v2.png.

Prompt:
Create a NEW game-ready 2D pixel-art animation sheet for one original low, broad ice-armored shore crab enemy. The supplied images are style references only: use their compact readable game-sprite scale, crisp dark blue-gray outlines, restrained shading and cute proportions. The crab must be clearly distinct from the wolf and boar: ivory and muted teal shell, a few pale ice-blue armor plates, two small expressive eyes, one readable pair of claws and four pairs of short legs. Strict side profile facing right in every pose. Pixel-art shading with clean edges, not photorealistic or 3D.

The sheet is a 6-column by 5-row sprite atlas with equal square cells, transparent background. Target canvas 768x640 with 128x128 cells; if the image output is higher resolution, preserve exactly 6 equal columns and 5 equal rows. No grid lines. MOST IMPORTANT: each individual crab silhouette must be entirely within a small central area of its cell, leaving a clearly visible transparent moat on all four sides. For a 128x128 cell, keep all crab pixels at least 17px from each edge (maximum silhouette about 94px wide and 94px tall). At a 229px source cell size, keep at least 30px clear on each side. Do not let any pose, claw, foot, outline, shadow or alpha fringe cross a cell boundary. Align crab feet to the same baseline at 83% of cell height (about y=106 in 128px cell), so there is transparent padding below the feet too. Character has a short, wide silhouette, around 72-78px wide by 52-68px high at 128px per cell.

Animation rows top to bottom, exactly:
Row 1 idle: two subtle but visibly different relaxed poses in columns 1-2; columns 3-6 are exact repeats of pose 2.
Row 2 walk: six sequential alternating-leg gait poses.
Row 3 attack: column 1 braces low and draws claws in; column 2 pushes forward; column 3 is a short low forward lunge with one claw extended; column 4 stops and recovers; columns 5-6 exactly repeat column 4. Show no motion streaks.
Row 4 hurt: two small recoil/squash poses in columns 1-2; columns 3-6 exactly repeat pose 2.
Row 5 dead: four simple progression poses, stagger, tip onto side, collapse on ground, settle still; columns 5-6 exactly repeat final pose.

Maintain identical design, proportions, scale and right-facing direction in every cell. Each pose must be isolated and complete with the whole claw, shell and legs present. True transparent alpha outside character pixels; avoid even faint artifacts in the transparent safety margin. No ground/shadow, scenery, particles, grid/checkerboard, labels, text, watermark, lighting effects or extra characters.

## Attempt 4 — targeted scale/placement edit

- Raw output copied unchanged to frost-crab-atlas-targeted-edit-v4.png.
- Original tool path: C:\Users\Tommy\.codex\generated_images\01a16a05-d08d-7e72-b24c-599efeb1c5cc\exec-efa99bad-55e3-4777-b6a9-487f0714ad52.png.
- Output: 1374×1145 RGBA; alpha extrema 0–255; exact 6×5 grid of 229×229 cells.
- Disposition: imagegen did not meet requested 65–70% reduction and local y=185 baseline; some sprites still touched cell edges. Not runtime art. The v3/v4 paths and this source-only note were passed to root and Expansion Art; Expansion Art owns the replacement runtime atlas.
- Reference supplied: v3 candidate.

Prompt:
Edit only the scale and placement of each complete crab silhouette within its own existing cell. Preserve the exact 1374x1145 canvas, strict 6 columns by 5 rows of 229x229 cells, the crab design, palette, right-facing profile, all five action rows and pose sequence. Uniformly reduce each complete crab to about 65–70 percent of its current size and recenter inside its original cell. Align standing feet at local y=185, well above the bottom edge. Every claw, foot and ice plate must remain fully visible with at least 24 pixels of genuinely transparent space to all four edges of every cell. Completely clear the inter-cell boundary strips of stray/neighboring pixels. No cropping, missing feet, overlap across cells, background, ground, shadow, glow, checkerboard, grid lines, text or new objects.

Keep the existing cell contents in their same positions and row/column order: idle, walk, attack, hurt, dead. Preserve the attack brace-to-lunge-to-recover sequence and the death progression. Do not redesign the crab or invent poses. Return a true-alpha transparent PNG.

## Handoff / checks

- All four raw outputs are retained unchanged in this folder.
- Images were visually reviewed. Size/mode/alpha were checked once per candidate; each reported alpha extrema 0–255. No formal slicing test was needed after the cell-edge failure was directly visible.
- No runtime crab atlas was added by this task. No manifest, source code, plan or status file was changed.
- Expansion Art is creating the production atlas. The v3/v4 images are design references only.
