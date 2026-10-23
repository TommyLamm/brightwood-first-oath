# Frost Guide Idle Sprite Source Log

Generated: 2026-10-24
Owner: frost-interface-art
Runtime contract: public/assets/actors/npcs/frost-guide-idle-v1.png; horizontal 2×1 atlas; two equal 887×887 cells; runtime display 96×96 per cell; frames [0, 1].
Purpose: idle animation for the Frost Isles local guide NPC Snowbud (雪芽). This package contains art only; manifest and runtime wiring belong to game_expansion.

## Accepted local visual references

- public/assets/actors/hero-cloth-v9.png — pixel scale, dark outline and sprite readability.
- public/assets/actors/npcs/guide-idle-v1.png — side-facing NPC presentation and two-frame idle layout; identity intentionally not copied.
- public/assets/actors/npcs/keeper-idle-v1.png and public/assets/actors/npcs/mentor-idle-v1.png — NPC body proportions and restrained detail.

## Generation history

### v1 — initial generation, rejected

Imagegen output: C:\Users\Tommy\.codex\generated_images\01a16a05-d08d-7e72-b24c-599efeb1c5cc\exec-baf731d8-4d60-4284-875c-db44ff4d8348.png
Archived unchanged as: frost-guide-generated-v1-checker-matte.png
Output: 1774×887, Format24bppRgb. The visible checker pattern was baked into the image and there was no alpha channel, so this is not a usable runtime sprite.
SHA-256: 93682D573070A951BE50699782EA1B8D4D3D830806A1CA48D1ECC4BB2D933623

Prompt:
Create a two-frame idle sprite sheet for one original young-adult winter trail guide NPC named Snowbud, for a polished 2D side-view fantasy pixel-art game. Use the supplied accepted hero and NPC sheets only as references for compact chibi body proportions, pixel scale, dark clean outlines, restrained warm/cool shading, and transparent game-sprite presentation; do not copy their identities, clothing, hair silhouette, or accessories. Character: friendly confident adult guide with short dark-brown hair mostly tucked beneath a distinctive fur-trimmed muted teal winter cap, an ivory padded cold-weather coat with clear quilted panels and a high collar, a separate low-saturation blue-green scarf, dark brown boots, and one small amber utility satchel at the hip. Keep the silhouette distinct from the existing young brown-haired green-caped guide and the older bearded keeper/mentor. Side profile facing right, full body visible, relaxed upright standing pose, empty hands, no weapon or magic. Strict layout: exactly two equal square cells arranged horizontally in a 2:1 canvas, one complete character centered in each cell, no frame lines or separator. The left cell is the relaxed neutral idle pose; the right cell is the same character and scale with only a subtle breathing change in shoulders/scarf, no step or turn. Match pose scale and lighting exactly; align both boot soles to the same baseline at the bottom of each cell. Leave generous truly transparent padding around each complete figure so no hat, coat hem, satchel, or boot touches or crosses a cell edge. Crisp pixel-art rendering with pixel-clustered shading, no smooth painterly gradients. True transparent alpha. No scenery, ground plane, cast shadow, glow, checkerboard, grid, text, labels, watermark, extra characters or objects.

### v2 — alpha/background edit, superseded

Imagegen output: C:\Users\Tommy\.codex\generated_images\01a16a05-d08d-7e72-b24c-599efeb1c5cc\exec-8f8fb4b3-c631-48c4-a2e5-ff3d11b92273.png
Archived unchanged as: frost-guide-transparent-edit-v2.png
Output: 1774×887, Format32bppArgb. The baked checkerboard was removed and background samples became transparent. The two poses remained too similar for a useful idle animation; v3 refines the right pose.
SHA-256: AD1107D1F5E0759EB9E778862CCE269E06951D04D4FD57543E3CA7556DDAB903

Prompt:
Edit the supplied winter-guide sprite sheet into a usable game asset. Preserve the same original young-adult snow guide, face, fur-trimmed teal cap, ivory padded coat, blue-green scarf, boots, amber satchel, right-facing side profile, two-frame horizontal layout, relative scale and common foot baseline. The gray checkerboard visible around the figure is a baked matte and must be completely removed; replace every background pixel with genuinely transparent alpha, leaving no checker squares, white fringe, cast shadow, floor, or halo. Keep exactly one complete guide in each of two equal square cells arranged horizontally; no cell borders or overlap. Make the right pose a visibly subtle idle breath variation only (slight rise of shoulders and scarf), while maintaining identical identity, scale and boot position; no step, turn or gesture. Keep the accepted game's crisp outlined pixel-art look with compact deliberate pixel clusters and restrained shading, avoiding smooth painted gradients. Center each figure with generous transparent margin inside its own cell, every hat/coat/satchel/boot fully inside. No scenery, grid, text, label, watermark, glow, extra character or object.

### v3 — accepted runtime candidate

Imagegen output: C:\Users\Tommy\.codex\generated_images\01a16a05-d08d-7e72-b24c-599efeb1c5cc\exec-91bf2c1a-88f9-445a-8e44-37b3153a1458.png
Archived unchanged as: frost-guide-breath-refinement-v3.png
Runtime copy: public/assets/actors/npcs/frost-guide-idle-v1.png
Output/runtime dimensions: 1774×887, Format32bppArgb; equal 887×887 cells. No resize or crop was applied. At runtime each cell is displayed at 96×96.
Alpha spot checks on source: all four canvas corners alpha=0; cell-gap center alpha=0; sample over right character alpha=253. The visual preview shows no baked checker pattern. Both figures are fully inside their own cells and their boots share the baseline; right pose visibly lifts the shoulders/scarf slightly while preserving the planted feet.
SHA-256 for source and runtime copy (identical): 951955D65E41452CE88465FC3C5E45629F587A1F8BFF545A22B4253B661A7A47

Prompt:
Make one narrowly targeted edit to the supplied transparent two-cell winter guide idle sheet. Preserve the exact 1774x887 canvas and 2 equal square horizontal cells, true transparent background, the existing character design, outfit, palette, pixel-art outlines, scale, cell positions and boot baseline. Leave the entire left cell unchanged. In the right cell only, make the second idle frame clearly but gently different by raising the shoulders and upper chest about 4 percent, slightly lifting the scarf folds and chin as if taking a quiet breath; keep both feet planted at precisely the same baseline and keep hands relaxed. Do not move the guide toward the center boundary or alter identity, clothing details, hat, hair, boots, satchel, camera angle or scale. Both figures must stay completely inside their own square cells. No background, checkerboard, fringe, floor, shadow, glow, text, border, watermark or additional object.
