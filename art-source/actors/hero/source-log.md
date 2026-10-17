# T10 Hero Sprite Attempts

These files are preserved as source candidates only. None is approved for runtime use because every image is 1254 x 1254, which cannot be evenly sliced into 8 x 8 cells, and every visual inspection found colored fringe/residual pixels around sprites.

- Generation tool: built-in image_gen.imagegen.
- Required protagonist reference passed to every generation: F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png.
- Transparent background requested on every call; outputs are RGBA with sampled alpha-zero pixels.
- Original ImageGen outputs remain under D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135.
- Runtime copy: none. Anchors: none; failed grids are not used to estimate coordinates.

## Cloth first generation

- Preserved project candidate: hero-cloth-v1-attempt-1.png.
- Original output: D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135\exec-ccbfc15f-6d6c-451f-b221-07eb2bacb60a.png.
- Inspection: 1254 x 1254, Format32bppArgb, width and height modulo 8 are both 6; sampled alpha-zero pixels 11607/24649. Visible red/yellow edge residues; cross-body strap remained. Unfinished.

Full prompt:

Use case: stylized-concept
Asset type: production 2D side-scrolling game player sprite sheet, hero-cloth-v1
Input images: Image 1 is the mandatory local protagonist reference at F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png; use it only to preserve the same short-haired boy's face, dark chestnut tousled hair, eye color, cute head-to-body proportions, warm skin, palette, and overall friendly adventure identity. Re-render him as crisp pixel sprite art, not as a painterly illustration.
Scene/backdrop: completely transparent canvas, no environment.
Subject: one full-body young male traveler-swordsman shown facing right in every frame, from head to boots, wearing the beginner cloth outfit: muted teal/blue-green cloth tunic with cream trim, warm ochre sash, loose light-cream trousers, dark brown boots and simple brown wrist wraps; keep the same face and short hair. Bare hands. Absolutely no weapon, sword, scabbard, sheath, weapon strap, shield, hat, helmet, text, icon, border, gridline, watermark, or extra character.
Style/medium: clean, readable classic 2D pixel art for a friendly side-scrolling fantasy adventure; deliberate chunky pixel clusters and crisp pixel edges, limited warm earthy and muted teal palette, consistent design and light across all cells.
Composition/framing: one square 1024 x 1024 sprite sheet divided into exactly 8 columns and exactly 8 rows of equal 128 x 128 pixel cells, no gutters or margins between cells. Exactly one complete character centered horizontally in every cell, identical scale and side-facing orientation; the lowest boot soles touch the same baseline y=120 in every cell, leave transparent margin above the head, never crop. Keep every pose wholly inside its own cell with no pixels crossing cell boundaries. Top-to-bottom rows, exactly: idle (4 distinct relaxed breathing frames then repeat frame 4 in remaining cells); walk (6 distinct alternating walk frames then repeat frame 6 twice); jump (two distinct frames: rising and falling, then repeat frame 2); climb (4 distinct climbing frames then repeat frame 4); attack (6 distinct bare-handed combat action poses with a strong forward swing, then repeat frame 6 twice); hurt (2 distinct recoil poses, then repeat frame 2); dead (4 distinct collapsing/downed poses ending lying still, then repeat frame 4); buff (4 distinct calm power-up poses with small restrained sparkles around the body, then repeat frame 4). Maintain matching foot point and character anatomy; no letters or row labels.
Lighting/mood: even simple sprite lighting, warm and approachable.
Constraints: transparent background with real alpha, not a checkerboard; precise aligned 8x8 sheet intended for uniform slicing. The facing direction, character identity, head, hair and body proportions remain identical across all 64 cells. This is the actual cloth outfit sheet, not a mockup.

## Cloth one repair

- Preserved project candidate: hero-cloth-v1-repair-1.png.
- Original output: D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135\exec-217f9ccc-af0d-4e61-88ed-303194083a3a.png.
- Inputs: required protagonist reference plus cloth first generation as edit target.
- Inspection: 1254 x 1254, Format32bppArgb, modulo 8 = 6 x 6; sampled alpha-zero pixels 11166/24649. Red/yellow fringe and strap remained. No second repair used. Unfinished.

Full prompt:

Use case: stylized-concept
Asset type: repair of one production side-scrolling hero-cloth sprite sheet.
Input images: Image 1 is the mandatory local protagonist reference at F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png and controls face, short dark chestnut hair, proportions, colors and identity. Image 2 is the exact 8-row animation sheet to repair; preserve its distinct pose/action sequence and layout.
Primary request: make only a targeted cleanup and exact-grid correction to Image 2. Output a square 1280 x 1280 transparent PNG with exactly 8 equal columns and 8 equal rows (160 x 160 per cell), no gutters, no grid lines, no margins between cells. Preserve the same 64 cell poses, row order, costume, scale, orientation, and matching boot baseline. Keep a single short-haired boy in every cell. Remove every red, yellow, neon, or colored fringe/stray pixel outside the character silhouette; preserve clean genuine alpha transparency. Remove the diagonal cross-body weapon-like strap; leave only the simple cloth tunic, cream trim, ochre waist sash, cream trousers, boots and wrist wraps. Do not add any weapon, scabbard, sheath, weapon strap, hat, helmet, text, icon, captions, labels, background, or extra objects.
Style/medium: crisp deliberate chunky 2D pixel sprites, not painterly, with clean pixel edges and consistent shading. Retain identity from Image 1. Preserve animation poses: idle, walk, jump, climb, bare-handed attack, hurt, dead, buff, in that row order. Every pose stays wholly inside its own 160 x 160 cell with transparent padding and no cropping.
Constraints: do not redesign or reorder the sheet; do not let any pixels cross cell boundaries. The only changes are exact 8x8 regridding, edge cleanup, removal of the cross-body strap, and stronger crisp pixel-art edges. Preserve the real transparent background and the existing character identity.

## Leather first generation

- Preserved project candidate: hero-leather-v1-attempt-1.png.
- Original output: D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135\exec-9b5e89cb-d28a-4c9f-afda-f811ce0e79aa.png.
- Inspection: 1254 x 1254, Format32bppArgb, modulo 8 = 6 x 6; sampled alpha-zero pixels 12101/24649. Red/yellow edge residues visible. Unfinished.

Full prompt:

Use case: stylized-concept
Asset type: production pixel-art 2D side-scrolling game hero-leather sprite sheet.
Input images: Image 1 is the mandatory local protagonist reference at F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png. Preserve the same short-haired boy's face, eyes, dark chestnut hair silhouette, age, body proportions, skin tone, boot design, palette and identity.
Primary request: create one clean game-ready full-body animation sheet for that exact protagonist wearing a clearly upgraded light leather vest: warm brown fitted sleeveless leather vest with visible simple seams and a small teal cloth inset, cream collar/trim, ochre waist sash, same cream trousers, dark boots and wrist wraps. Both hands remain empty.
Composition/framing: exact square canvas 1280 x 1280 pixels, precisely 8 columns by 8 rows, equal 160 x 160 cells, no spacing, gutters, labels or grid lines. One right-facing side-view character per cell, same scale and position; soles touch common y=150 baseline, centered, transparent padding above and sides, nothing cropped, no pixel crossing cell boundaries. 8 rows top to bottom: idle (4 breathing frames then repeat fourth); walk (6 alternating gait frames then repeat sixth twice); jump (rising and falling then repeat falling); climb (4 poses then repeat fourth); bare-handed attack (6 distinct forward striking poses then repeat sixth twice); hurt (2 recoil poses then repeat second); dead (4 collapse-to-lying poses then repeat final); buff (4 calm power-up poses with very small teal sparkles then repeat final).
Style: crisp, deliberate chunky pixel-art clusters, clean pixel edges, not painterly, consistent simple warm sprite shading.
Constraints: true transparent alpha. No sword, weapon, scabbard, sheath, weapon strap, shield, hat, helmet, cross-body strap, text, watermark, scenery, frame borders or second character. Same face/hair identity in every frame.

## Leather one repair

- Preserved project candidate: hero-leather-v1-repair-1.png.
- Original output: D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135\exec-72d0a448-3b04-4c61-8c9a-74c8c459d6a2.png.
- Inputs: required protagonist reference plus leather first generation as edit target.
- Inspection: 1254 x 1254, Format32bppArgb, modulo 8 = 6 x 6; sampled alpha-zero pixels 11911/24649. Colored fringe persisted. Unfinished.

Full prompt:

Use case: stylized-concept
Asset type: one targeted repair of a game-ready hero-leather sprite sheet.
Input images: Image 1 is the source sheet and edit target; preserve all 64 poses, row order, character identity, leather outfit, facing, size and common foot baseline. Image 2 is the mandatory local hero reference at F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png; preserve its short-haired boy's exact face, chestnut hair and proportions.
Primary request: clean the source sheet for uniform slicing. Output an exact square 1280 by 1280 PNG, with exactly eight equal columns and eight equal rows of exactly 160 by 160 each; no gaps or gutters. Keep every pose centered and fully inside its existing cell. Remove all red, yellow, green, or other stray edge pixels and any colored fringe around character silhouettes; these must be truly transparent alpha, not dark-filled or checkerboard pixels. Preserve clean sharp pixel edges.
Constraints: this is a local repair only. Do not redesign, add/remove/reorder poses, change outfit or identity, add text, weapons, tools, straps, hats, helmets or background. Keep the same bare-handed action sequence. No character or pixels may cross cell boundaries. Transparent canvas. If exact 8x8 geometry cannot be made, retain the 8x8 layout and ensure cell edges land exactly at the image boundaries.

## Iron first generation

- Preserved project candidate: hero-iron-v1-attempt-1.png.
- Original output: D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135\exec-b0008445-1009-4bc8-807c-294edeaee666.png.
- Inspection: 1254 x 1254, Format32bppArgb, modulo 8 = 6 x 6; sampled alpha-zero pixels 12342/24649. Colored fringe visible. Unfinished.

Full prompt:

Use case: stylized-concept
Asset type: production pixel-art 2D side-scrolling game hero-iron sprite sheet.
Input images: Image 1 is the mandatory local protagonist reference at F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png. Preserve exactly the same young short-haired boy, face, eyes, chestnut hair silhouette, age, head size, body proportions, skin, and warm adventure palette.
Primary request: create one full-body animation sheet for this exact protagonist wearing visibly upgraded iron mail armor: a fitted dark steel-gray short mail tunic with small overlapping iron shoulder plates, restrained teal fabric beneath, simple cream collar, ochre waist sash, same light trousers, dark boots and wrist wraps. Armor must clearly read as iron mail, distinct from simple teal cloth and brown leather vest, yet keep limbs flexible.
Composition/framing: exact square canvas 1280 x 1280 pixels. Precisely 8 equal columns x 8 equal rows, each cell exactly 160 x 160, no spacing, borders, grid lines, labels, or margins between cells. One complete character in every cell, right-facing side view, same scale and horizontal center; boot soles on common y=150 baseline. Keep full head and feet inside own cell with transparent padding; no crossing cell borders. Rows top to bottom: idle (4 breathing poses, then duplicate last); walk (6 alternating gait poses, then duplicate last twice); jump (rise and fall, then duplicate second); climb (4 poses, then duplicate fourth); bare-handed attack (6 distinct forward strikes, then duplicate sixth twice); hurt (2 recoil poses, then duplicate second); dead (4 collapse poses ending lying still, then duplicate fourth); buff (4 composed charging poses with small cool teal glints, then duplicate fourth).
Style: crisp deliberate chunky pixel art, clear sprite-game silhouette, consistent simple warm sprite shading; not painterly illustration.
Constraints: true transparent background/alpha. Empty hands. No sword, weapon, scabbard, sheath, weapon strap, shield, hat, helmet, extra figure, text, watermark, scene, or crop. Same face/hair identity throughout.

## Iron one repair

- Preserved project candidate: hero-iron-v1-repair-1.png.
- Original output: D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135\exec-99966cac-6871-484c-8021-0821e72b198d.png.
- Inputs: required protagonist reference plus iron first generation as edit target.
- Inspection: 1254 x 1254, Format32bppArgb, modulo 8 = 6 x 6; sampled alpha-zero pixels 11739/24649. Colored fringe persisted. Unfinished.

Full prompt:

Use case: stylized-concept
Asset type: one targeted repair of a production hero-iron sprite sheet.
Input images: Image 1 is the iron outfit 8x8 sprite sheet and edit target; preserve the 64 poses and row sequence. Image 2 is the mandatory local identity reference F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png.
Primary request: clean and make this sprite sheet slicable. Final canvas must be square 1280 x 1280, exactly 8 equal columns and 8 equal rows, cell size exactly 160 x 160, zero gutters. All cell boundaries align exactly with image boundaries. Preserve each pose and the same iron mail outfit in its current cell. Ensure complete character with transparent padding, no cropping and no pixel leakage between cells.
Transparent edge repair: remove every red, yellow, bright green, or colored stray pixel and halo around hair, armor, clothes, body, and effects. All outside-silhouette background pixels are fully transparent alpha, not colored artifacts, black paint, gray haze or checkerboard. Keep clean crisp chunky pixel-art edges.
Constraints: edit only cell grid regularity and transparency/edge artifacts. Do not change the boy's identity, armor design, poses, facing, scale, row order or boot baseline. No sword or other weapon, no sheath, no weapon strap, no hat, no text, no background and no extra character.

## Recovery v2 (2026-10-18)

All six outputs below used built-in `image_gen.imagegen`, `transparent_background: true`, and the required reference `F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png`. Each set had one new generation and one targeted repair. No additional generation was made after repair failed.

Prompt canvas strategies (width / tile size; all 8x8): cloth generation 1024/128, cloth repair 2048/256; leather generation 2048/256, leather repair 1536/192; iron generation 2048/256, iron repair 2560/320. Prompts specified explicit tile origins, true transparency, same protagonist identity, 8-row action order, no weapon/hat, and outfit-specific details. Repair calls also referenced the corresponding local attempt image.

| Set | Workspace source candidate | Original generated output | Inspection |
| --- | --- | --- | --- |
| Cloth attempt | `hero-cloth-v2-attempt-1.png` | `D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135\exec-c0df9c45-1efa-409b-9cff-04408b89d2fb.png` | 1254x1254; alpha 0/partial/255 = 926950/644322/1244; mod 8 = 6x6; colored fringe |
| Cloth repair | `hero-cloth-v2-repair-1.png` | `D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135\exec-1b084d25-eb26-45b6-9365-a0f4b53eb789.png` | 1254x1254; 766472/803870/2174; mod 8 = 6x6; colored fringe |
| Leather attempt | `hero-leather-v2-attempt-1.png` | `D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135\exec-119bcc2d-2061-4463-94b1-865f4b5d4a3a.png` | 1254x1254; 730682/839728/2106; mod 8 = 6x6; colored fringe |
| Leather repair | `hero-leather-v2-repair-1.png` | `D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135\exec-52fe4cc5-f86a-4067-bf69-252d56942686.png` | 1254x1254; 621022/950782/712; mod 8 = 6x6; colored fringe |
| Iron attempt | `hero-iron-v2-attempt-1.png` | `D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135\exec-30e5b6fe-6adf-47e0-bcb7-ee79ef253602.png` | 1254x1254; 766430/804514/1572; mod 8 = 6x6; colored fringe |
| Iron repair | `hero-iron-v2-repair-1.png` | `D:\dev-data\codex-home\generated_images\01a14a6f-25c6-7461-b72c-ff7bbf9ff135\exec-569978d5-ae80-4613-890f-01c82663bbb8.png` | 1254x1254; 716193/854075/2248; mod 8 = 6x6; colored fringe |

Alpha columns list counts for alpha=0, partial alpha, and alpha=255. All images are retained as source-only candidates; none is copied to runtime. No hero manifest or anchors were created because no image passes grid and clean-edge validation.

## Cloth third generation (2026-10-18)

- Preserved project candidate: `hero-cloth-v3-attempt-1.png`.
- Original output: `D:\dev-data\codex-home\generated_images\01a14b9f-e59e-7a51-a37d-7d755eea81b2\exec-307caf87-6296-4e47-aa27-f3b7c2cda088.png`.
- Tool: built-in `image_gen.imagegen`; `transparent_background: true`.
- Required protagonist style reference: `F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png`.
- Inspection: 1254 x 1254, Format32bppArgb, modulo 8 = 6 x 6; alpha 0 / partial / 255 = 831820 / 739043 / 1653. The action rows are broadly legible, but colored fringe and extensive partial alpha remain. Unfinished; source only.

Full prompt:

```text
Use case: stylized-concept
Asset type: production 2D side-scrolling game player sprite atlas, actor:hero-cloth v1
Input images: Image 1 is the required local protagonist style reference. Use it only to preserve the same young hero identity: warm light skin, large brown eyes, short tousled dark chestnut hair, cute big-head proportions, friendly adventure character. Keep the original muted teal beginner tunic with cream trim, ochre sash, light cream trousers, dark brown boots and simple brown wrist wraps. Do not copy the reference background or its carried gear.
Scene/backdrop: truly transparent canvas, no background.
Subject: one full-body young male hero, facing right in side view in every cell; bare hands. No weapon, sword, scabbard, sheath, shoulder strap, shield, scarf, hat, helmet, text, border, watermark, shadows, or extra characters.
Style/medium: clean classic 2D pixel sprite art with deliberate chunky pixel clusters, crisp hard edges, limited warm earthy and muted teal palette. No painterly rendering, blur, soft shading, antialiasing, or semitransparent effects.
Composition/framing: exact square 768 × 768 pixel atlas, precisely 8 columns and 8 rows, every cell exactly 96 × 96 pixels, no gutters or margins. This is a strict pixel-coordinate layout. One complete character per cell, same scale and right-facing orientation, each sprite about 72 pixels tall and centered; no pixels cross cell boundaries. For grounded poses, boot soles align exactly to the same y=95 baseline in every cell. Order rows top to bottom: idle, walk, jump, climb, attack, hurt, dead, buff. Row 1: 4 distinct subtle breathing poses then repeat pose 4 in columns 5–8. Row 2: 6 distinct alternating walk-cycle poses then repeat pose 6 in columns 7–8. Row 3: two distinct clean poses, rising and falling, then repeat pose 2 in columns 3–8. Row 4: 4 distinct climbing poses with alternating hands and feet then repeat pose 4 in columns 5–8. Row 5: 6 distinct bare-handed forward punch / close combat poses; clearly show a different torso, arm and hand position in each active frame, then repeat pose 6 in columns 7–8. Row 6: two distinct recoil / flinch poses then repeat pose 2 in columns 3–8. Row 7: 4 distinct collapse poses ending lying still then repeat the final lying pose in columns 5–8. Row 8: 4 distinct calm power-up poses with only tiny solid-pixel sparkles contained around the hero, then repeat pose 4 in columns 5–8. No gridlines or labels.
Lighting/mood: consistent soft directional highlights, cheerful and readable.
Constraints: preserve the face, hair, clothes, body proportions and palette of the reference; crisp opaque sprite pixels only. Every subject pixel alpha must be fully opaque; all empty canvas pixels must be fully transparent. Absolutely no partial-alpha fringe, background color, checkerboard, glow, or bleed between cells. The 8 × 8 layout, 768 × 768 canvas and 96 × 96 cell boundaries are mandatory.
```

## Cloth third targeted repair (2026-10-18)

- Preserved project candidate: `hero-cloth-v3-repair-1.png`.
- Original output: `D:\dev-data\codex-home\generated_images\01a14b9f-e59e-7a51-a37d-7d755eea81b2\exec-72470457-a906-408a-8f7c-33628c6a3c22.png`.
- Tool: built-in `image_gen.imagegen`; `transparent_background: true`.
- Inputs: first cloth v3 output as edit target and required protagonist reference at `F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png`.
- Inspection: 1254 x 1254, Format32bppArgb, modulo 8 = 6 x 6; alpha 0 / partial / 255 = 699247 / 872265 / 1004. Colored fringe and extensive partial alpha remain. The explicit exact-size request was not met. Unfinished; source only.

Full prompt:

```text
Use case: precise-object-edit
Asset type: final production 2D game player sprite atlas, actor:hero-cloth v1
Input images: Image 1 is the edit target atlas. Preserve its same 8-row action design and the same one hero in every pose; improve only the atlas pixel dimensions, grid precision, pixel-art edge quality, and transparency. Image 2 is the required local protagonist identity reference; use it to preserve the same short dark-chestnut-haired, brown-eyed young hero, teal beginner tunic with cream trim, ochre sash, cream trousers, dark brown boots, and friendly proportions.
Primary request: Re-render the complete atlas as a clean, crisp, hard-edged pixel sprite sheet with a true 768 × 768 pixel canvas. The 8 columns and 8 rows must each be exactly 96 × 96 pixels, aligned to the canvas edges. This is the central requirement.
Scene/backdrop: genuinely transparent, empty background.
Subject: exactly one full-body right-facing young male hero in each 96 × 96 cell, bare-handed, wearing the same cloth outfit. Keep the action order and poses from Image 1: idle, walk, jump, climb, attack, hurt, dead, buff, top to bottom. Keep the existing active poses per row and repeat each row's last active pose into its remaining cells.
Style/medium: crisp 2D pixel art, deliberate opaque pixel clusters, limited palette, no smoothing, no blur, no soft painterly edges.
Composition/framing: preserve the existing 8 by 8 layout and pose sequence, but redraw every sprite wholly inside its exact 96 × 96 cell. No gutters, no margins, no missing rows, no cut-off sprites. Keep character scale and right-facing profile consistent. Keep boot soles on the same y=95 baseline in grounded poses. No sprite pixel may spill across a cell edge.
Lighting/mood: consistent warm highlights, friendly adventurous tone.
Constraints: preserve the current identity, clothing and action sequence. Eliminate all visible red/yellow fringe and all colored specks around outlines. Each character/sparkle pixel must be alpha 255 and every empty background pixel alpha 0; no partial alpha anywhere, no drop shadows, no glow, no checkerboard. No weapon, sword, scabbard, strap, shield, scarf, hat, helmet, text, labels, border, watermark or extra character. Output exactly 768 × 768 pixels, not an approximate size.
```

Both v3 candidates remain source-only. No runtime image, package manifest row, or anchors were created because neither image has an evenly divisible 8 x 8 grid or clean hard-alpha edges. The permitted one generation and one repair for this round are exhausted.
