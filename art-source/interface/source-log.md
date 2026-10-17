# T12 interface asset source log

All originals remain under `art-source/interface/`; only extracted, alpha-preserving PNGs are placed in `public/assets/interface/`. The prompt text below was sent to the built-in ImageGen tool. Local references were opened with `view_image` before use. No external images or downloaded art were used.

| Group | Keys in row-major order | Project source image | Raw size / status |
| --- | --- | --- | --- |
| Core items | 14 distinct weapon, body, hat, and potion icons | `interface-items-sheet-v1.png` | 1254×1254; accepted for slicing |
| Materials / quests | 10 distinct material and quest icons | `interface-materials-sheet-v1.png` | 1254×1254; accepted for slicing |
| Skills | heavy-strike, sweep, iron-guard, vitality, rest-recovery | `interface-skills-sheet-v1.png` | 1254×1254; accepted for slicing |
| Markers | quest, portal, shop, player | `interface-markers-sheet-v1.png` | 1254×1254; accepted for slicing |
| UI skin initial | panel frame, three button states, HP/MP/EXP bars, two slot states | `interface-skins-sheet-v1.png` | 1254×1254; rejected after crop review because the panel exceeded its cell |
| UI skin targeted repair | same nine pieces, same order | `interface-skins-sheet-v2-repair1.png` | 1254×1254; accepted for slicing, every piece fully contained |
| VFX | heavy-strike, sweep, hit, levelup, guard (six frames per row) | `interface-vfx-sheet-v1.png` | 1536×1024; rejected: opaque row tints |
| VFX targeted repair | same five rows | `interface-vfx-sheet-v2-repair1.png` | 1536×1024; rejected: opaque row tints remain |
| VFX isolated strips | sweep, hit, levelup | per-key attempts documented below | 2172×724 RGBA each; accepted after direct alpha and visual review |
| VFX guard | six-frame ring, one targeted center cleanup | per-key attempt and repair documented below | 2172×724 RGBA each; repair accepted after alpha and visual review |
| VFX heavy-strike | six-frame slash | ImageGen saved path recovered from tool record; documented below | 2172×724 RGBA; candidate pending runtime inspection |

The item, material, skill, marker, and repaired UI sheets were cropped into independent assets with unchanged RGBA content and downsampled only. The initial UI sheet is retained as source evidence; its panel frame crossed a cell edge, so the one targeted repair was used and the repaired sheet supplies all nine runtime pieces. The original five-row VFX sheet and its repair remain rejected because tinted background rows stayed near-opaque; they are not used by the new runtime strips. Separate per-effect one-row candidates and their current status are documented below.

## Core items — prompt

References: `art-source/actors/hero-style-reference-v1.png`, `art-source/actors/equip-starter-sword-v1.png`, `art-source/actors/equip-iron-helm-v1.png`.

```text
Use case: stylized-concept
Asset type: pixel-art RPG inventory icon sprite sheet for a 2D side-view forest adventure game
Input images: Image 1 is the established hero pixel-art style and warm colors reference; Image 2 is the established starter sword shape/finish reference; Image 3 is the established iron helmet style reference.
Primary request: create one perfectly aligned 4-column by 4-row grid of 16 individually distinct inventory item icons. Each of the first 14 cells contains exactly one centered standalone object, with generous transparent padding and no overlap across cells. Row-major cell order, left to right:
Row 1: (1) starter-sword, a short plain iron blade with simple brown leather grip; (2) iron-sword, longer straight iron blade with a dark grip and crossguard; (3) steel-sword, polished blue-gray steel long sword with a sharper brighter edge; (4) guardian-sword, ornate ancient guardian blade with teal rune accents and a distinctive broad gold-trimmed guard.
Row 2: (5) cloth-shirt, folded simple cream travel tunic; (6) leather-vest, sturdy warm-brown leather armor vest; (7) iron-mail, silver ring-mail torso armor; (8) cloth-cap, soft tan cloth cap.
Row 3: (9) leather-cap, dark brown fitted leather cap; (10) iron-helm, rounded silver iron helmet with a short nose guard; (11) small-red, one small round ruby-red potion flask; (12) large-red, visibly larger ruby-red potion flask.
Row 4: (13) small-blue, one small round sapphire-blue potion flask; (14) large-blue, visibly larger sapphire-blue potion flask; (15) fully empty transparent cell; (16) fully empty transparent cell.
Scene/backdrop: genuine transparent background in every cell; no tabletop or ground shadow.
Style/medium: crisp, colorful hand-painted pixel-art game icons consistent with the reference assets, strong dark-brown outline, readable forms, restrained warm highlights, not photorealistic and not 3D.
Composition/framing: exact square 1024x1024 canvas, exact 4x4 equal cells (256x256 each); each icon centered inside its own cell, small enough to leave a clear margin. Icons should remain unmistakable when downscaled to 32x32.
Lighting/mood: soft warm game-art highlights, consistent upper-left light.
Color palette: warm cream and brown leather, clear silver/steel progression; potions use saturated red or cobalt blue glass.
Materials/textures: clean pixel edges with subtle painterly pixel shading.
Text (verbatim): none.
Constraints: transparent alpha; no backgrounds; keep grid cells equal and icons completely within their own cell. No item labels, letters, numbers, border, gridlines, UI, watermark, extra objects, duplicate icons, or icon substitutions.
```

## Materials and quest items — prompt

References: `art-source/actors/hero-style-reference-v1.png`, `art-source/interface/interface-items-sheet-v1.png`, `public/assets/environment/env-altar-v1.png`.

```text
Use case: stylized-concept
Asset type: pixel-art RPG material and quest-item icon sprite sheet, same 2D side-view forest adventure game
Input images: Image 1 is the established hero art style and color reference; Image 2 is the exact existing item icon finish and palette; Image 3 is the established ancient-stone and turquoise-gem reference.
Primary request: create one perfectly aligned 4-column by 4-row grid of 16 equal transparent square cells. The first ten cells contain separate unique inventory materials and quest items, row-major:
1 snail-shell: one small curled cream-and-brown snail shell with a green moss patch, no snail.
2 slime-gel: one single translucent pale-lime blob of magical gel with a clear rounded silhouette, no container.
3 mushroom-cap: one red-brown forest mushroom cap with a few creamy spots, no stem.
4 boar-tusk: one curved ivory tusk with warm brown root.
5 stone-chip: one chipped rough gray stone fragment with a simple triangular silhouette.
6 metal-shard: one sharp silver-blue metal fragment with one bright polished edge.
7 forest-seed: one luminous leaf-shaped green seed with a tiny gold core.
8 spore-sample: one small corked clear sample vial containing a few violet spores, no label.
9 ridge-emblem: one rugged reddish stone medallion with a simple carved mountain-peak shape, no letters.
10 guardian-core: one radiant faceted aqua crystal heart held by two tiny aged-bronze side brackets.
Cells 11–16 must remain completely transparent and empty. Every object is unmistakably different at 32x32 display.
Scene/backdrop: genuinely transparent; no ground or tabletop.
Style/medium: rich readable hand-painted pixel art with dark brown outline, the same crisp scale, shading and handcrafted warmth as the supplied game-item reference.
Composition/framing: exact square 1024x1024 canvas, exact 4x4 equal 256x256 cells; one centered object per active cell, generous transparent padding, no object may cross a cell boundary.
Lighting/mood: warm upper-left highlights, subtle magical glow only close to the magical items.
Color palette: natural cream, moss, lime, red-brown, ivory, stone gray, steel blue, vivid leafy green, violet and aqua crystal.
Text (verbatim): none.
Constraints: real alpha transparency, no filled cell backgrounds, no gridlines, no captions, no letters, no numbers, no watermark, no repeated items, no extra objects, no duplicate potion bottles.
```

## Skills — prompt

References: `art-source/actors/hero-style-reference-v1.png`, `art-source/actors/equip-starter-sword-v1.png`.

```text
Use case: stylized-concept
Asset type: pixel-art RPG skill icon sprite sheet for the same 2D side-view forest adventure game
Input images: Image 1 is the exact established pixel-art character style and color reference; Image 2 is the game's established short sword shape and warm metal finish.
Primary request: create a 4-column by 4-row sprite sheet of square icon cells with exactly five different skill icons in the first five cells in row-major order; the other eleven cells remain completely transparent. Cell 1 heavy-strike: a bright diagonal sword slash arc with a single small blade silhouette; cell 2 sweep: a broad horizontal double-curved blade sweep; cell 3 iron-guard: a small steel shield surrounded by a clear protective teal ring; cell 4 vitality: a vivid green heart entwined with a tiny leaf; cell 5 rest-recovery: a calm blue-green spiral with three small healing sparkles. Each image must have one unmistakable central symbol and work at 32x32.
Scene/backdrop: genuinely transparent behind every cell.
Style/medium: charming hand-painted pixel art consistent with the reference, clear dark warm outline, polished item-icon quality, not 3D, not photorealistic.
Composition/framing: exact 1024x1024 canvas, exact 4x4 grid of equal 256x256 square cells. Center one symbol with generous transparent margins in each active cell. Keep icons distinct and readable when reduced to 32x32.
Lighting/mood: soft upper-left highlights, rich but controlled colors.
Color palette: steel and amber slash for heavy strike; bright blue steel arc for sweep; silver and teal for guard; leaf green for vitality; sea-glass blue and pale mint for recovery.
Text (verbatim): none.
Constraints: transparent alpha, no filled tile backgrounds, no gridlines or borders, no words, letters, numbers, UI widgets, watermark, extra objects, repeated symbols, or unrequested icons.
```

## Markers — prompt

References: `art-source/actors/hero-style-reference-v1.png`, `public/assets/environment/env-portal-v1.png`, `public/assets/environment/env-town-sign-v1.png`, `public/assets/environment/env-altar-v1.png`.

```text
Use case: stylized-concept
Asset type: tiny pixel-art gameplay marker sprite sheet for a side-view forest RPG
Input images: Image 1 is the game's warm pixel-art color/style reference; Image 2 is the established turquoise stone portal reference; Image 3 is the established timber town sign reference; Image 4 is the established stone altar reference.
Primary request: create exactly four separate transparent marker icons in a clean 2-column by 2-row sheet. Row-major order: top-left marker:quest, a floating golden leaf badge with one bright amber star, clearly signaling a quest; top-right marker:portal, a compact miniature turquoise portal arch with a luminous aqua center; bottom-left marker:shop, a small warm wooden merchant awning over a shiny gold coin pouch, no signs; bottom-right marker:player, a tiny simple teal directional diamond-arrow with a small warm-colored hero silhouette in its center. Each marker must remain unmistakable at 24x24 to 32x32 display size.
Scene/backdrop: true transparent background behind each symbol.
Style/medium: crisp, charming pixel-art matching the supplied game assets, clear dark brown outline, slight polished highlights.
Composition/framing: exact square 1024x1024 canvas, exact 2x2 equal cells (512x512 each); one centered icon in each cell with generous transparent margins and no overlaps.
Color palette: gold/amber quest marker, turquoise portal, warm wood and gold shop, green-blue player marker.
Text (verbatim): none.
Constraints: actual alpha transparency; no cell fill, no gridlines, no words/letters/numbers, no question/exclamation marks, no watermark, no extra objects or duplicate icons.
```

## UI skin — prompt

References: `art-source/actors/hero-style-reference-v1.png`, `public/assets/environment/env-town-sign-v1.png`, `public/assets/environment/env-altar-v1.png`, `art-source/interface/interface-items-sheet-v1.png`.

```text
Use case: stylized-concept
Asset type: pixel-art fantasy game UI skin asset sheet for a side-view forest RPG
Input images: Image 1 is the established character style; Image 2 is the established warm timber texture; Image 3 is the established stone and teal-gem palette; Image 4 is the game's item icon pixel-art finish.
Primary request: create nine separate UI skin pieces in a perfectly aligned 3-column by 3-row grid, row-major:
1 panel:frame — a clean rectangular fantasy dialog panel frame, dark walnut plank outer rim with small brass corner fittings and muted blue-gray inner backing; leave the inside mostly transparent and unobstructed.
2 button:normal — a short wide blank wooden button with a warm brown face and thin brass outline.
3 button:hover — same size and shape as normal button, brighter amber-lit face and gold edging.
4 button:pressed — same size and shape as normal button, slightly inset darker wood face with subtle downward shadow, visibly pressed.
5 bar:hp — slim horizontal empty wooden frame with a saturated ruby red fill occupying about 70 percent.
6 bar:mp — slim horizontal empty wooden frame with clear sapphire blue fill occupying about 70 percent.
7 bar:exp — slim horizontal empty wooden frame with fresh leaf-green and soft gold fill occupying about 70 percent.
8 slot:normal — one square inventory slot, dark slate-blue interior, thin warm wooden rim.
9 slot:selected — same size square slot but bright teal-gold highlighted rim and softly glowing corners.
Scene/backdrop: true transparent background around each separate UI piece; the panel interior and the interiors of slot/bar frames are empty transparent or very dark flat neutral texture, suitable for later UI content.
Style/medium: charming crisp pixel-art game UI, layered beveled wood and stone, subtle handcrafted details, matching supplied game references; no 3D rendering.
Composition/framing: exact square 1024x1024 canvas, exact 3x3 equal square cells, each piece centered in its own cell with safe margins; the button and bar shapes are wide, thin horizontal pieces within their cells. Preserve a common style while making normal/hover/pressed and normal/selected states visibly different.
Color palette: warm brown wood and aged brass with cool slate/teal details; clear red, blue, green bar fills.
Text (verbatim): none.
Constraints: real transparent alpha around pieces; no complete screen mockup, no text, letters, numbers, icons, glyphs, gridlines, tile backgrounds, watermark, or overlapping pieces.
```

## VFX — generation prompt and targeted repair

Generation references: `art-source/actors/hero-style-reference-v1.png`, `art-source/interface/interface-skills-sheet-v1.png`, `art-source/interface/interface-markers-sheet-v1.png`.

```text
Use case: stylized-concept
Asset type: five transparent animated VFX sprite strips for a pixel-art side-view RPG
Input images: Image 1 is the game's hero pixel-art style and scale reference; Image 2 is the exact game's skill-icon palette; Image 3 is the exact game's portal and marker pixel-art style.
Primary request: one clean chronological sprite-sheet grid, six frames across and five animation rows down. Every row is its own six-frame animation, with each frame a centered effect on genuine transparency, no character, no fixed damage numbers. Read each row left-to-right in this exact order:
Row 1 vfx:heavy-strike — six clearly progressive frames of one fast sword slash: tiny amber spark, steel blade glint, bright diagonal gold-white arc forming, arc sweeps across and peaks, arc fragments into sparks, final fading glimmer. A diagonal slash curve from upper-left toward lower-right.
Row 2 vfx:sweep — six progressive frames of one wide horizontal blue-silver crescent sweep expanding from left toward right, broad fan-shaped arc at its peak then receding into small cool sparks.
Row 3 vfx:hit — six progressive compact impact frames: tiny contact spark, orange-red starburst grows, sharp bright center with 3 short radial streaks, peak, burst breaks into small ember pixels, transparent final fade. Keep the shape localized.
Row 4 vfx:levelup — six progressive frames of a vertical golden level-up flourish: small floor glint, rising gold beam, bright warm column with tiny ascending stars, peak bright crown, falling leaflike sparkles, final soft glimmer. No letters or symbols.
Row 5 vfx:guard — six progressive frames of a circular teal and pale-blue protective ring surrounding a fully empty transparent center for a player sprite overlay. The ring grows, stabilizes with two small side glints, subtly pulses, and fades. Keep the center unobstructed and do not draw a person.
Scene/backdrop: fully transparent around every effect pixel and in the empty center of the guard ring.
Style/medium: clean luminous pixel-art VFX matching the supplied hand-painted pixel icon palette, crisp pixel clusters, no blur or photorealism.
Composition/framing: exact 1536x1280 canvas with an exact 6-column by 5-row grid of equal 256x256 square cells. Each effect stays safely inside its cell. Consecutive frames must visibly change and read as a continuous animation at 60ms per frame.
Lighting/mood: bright but controlled magical highlights, readable at 128x128; each effect has a distinct shape/color identity.
Color palette: heavy slash warm gold with steel, sweep cool blue, hit amber-red, levelup radiant gold, guard teal-blue.
Text (verbatim): none.
Constraints: true transparent alpha; five visibly different 6-frame actions; no canvas background, no filled cell backgrounds, no gridlines, no text, letters, numbers, HUD, watermark, repeated static frames, or opaque aura that obscures a player's face.
```

Repair references: `art-source/interface/interface-vfx-sheet-v1.png` (opened at original size before editing).

```text
Use case: background-extraction
Asset type: repair the existing five-row VFX sprite sheet for the side-view pixel-art RPG.
Input images: Image 1 is the edit target: the exact VFX sheet just generated.
Primary request: make one targeted correction to Image 1. Remove the tinted orange, blue, yellow, and cyan bands/backdrop from all rows so every empty area around and between the effect pixels becomes true transparent alpha. Preserve the existing effects themselves, their colors, their pixel-art rendering, their cell layout, and their left-to-right six-frame chronology as closely as possible.
Constraints: change only the empty/background pixels to transparency; preserve the five effect rows, all visible slash/crescent/impact/level-up/aura pixels, positions and colors; keep the guard ring center transparent. Do not redraw, simplify, recolor, rearrange, add, or remove any effect pixel. Output with genuine transparency, not a black/white checkerboard or solid-color backdrop. No text, gridlines, or watermark.
```

## UI skin — targeted layout repair

Reference: `art-source/interface/interface-skins-sheet-v1.png` (opened at original size before editing).

```text
Use case: precise-object-edit
Asset type: repair the nine-piece pixel-art UI skin sprite sheet for a side-view forest RPG.
Input images: Image 1 is the exact UI skin sheet; use it as the source for the existing wood, brass, slate and teal designs.
Primary request: one targeted layout correction only. Re-layout the same nine pieces as an exact 3-column by 3-row sheet, in the same row-major order: panel:frame, button:normal, button:hover; button:pressed, bar:hp, bar:mp; bar:exp, slot:normal, slot:selected.
Composition/framing: keep every component fully inside its own equal square cell with at least 12% transparent margin on every side. The panel must be a complete closed rectangular frame with all four sides and four corners visible inside cell 1; shrink it to fit. Keep buttons and bars fully intact and centered in their cells; remove any stray partial border fragments. Keep all slots fully inside their cells. No component may touch or cross a cell edge.
Style/medium: preserve the existing handcrafted pixel-art UI style, warm dark walnut and brass framing, cool slate interior and teal selected-slot glow. Keep hover visibly brighter and pressed visibly inset.
Scene/backdrop: transparent alpha around all nine pieces and inside the panel frame, slot interiors and bar frames as in the source.
Constraints: preserve the nine key designs and order; only correct the scale and containment within cells. No new pieces, no labels, text, numbers, glyphs, grid lines, background fills, watermark, or mock screen.
```

## VFX — isolated six-frame strips (current candidates)

The prompt blocks below are copied verbatim from the built-in ImageGen tool records' `revisedPrompt` fields. Reference paths and the recorded output path are noted per request. ImageGen's PNG output metadata is empty, so the standalone source files preserve the originals. The prior multi-row VFX generation and rejected alpha repair above remain as historical evidence; these are separate one-row generations using a changed prompt/composition strategy. Only the four passing strips are in the runtime manifest. The heavy-strike saved path was recovered from the tool record after the original wrapper failed to surface it; it remains pending independent inspection.

### heavy-strike — generated candidate, inspection pending

References: `art-source/actors/hero-style-reference-v1.png`, `art-source/actors/equip-starter-sword-v1.png`, `public/assets/interface/skill-heavy-strike-v1.png`.

Tool record: `exec-d3f4075a-d44c-43ed-8c4a-c9a3a3ac0048`; recorded output path: `D:\dev-data\codex-home\generated_images\01a14bf5-5184-74b2-8896-d592c289c679\exec-d3f4075a-d44c-43ed-8c4a-c9a3a3ac0048.png`. The initial wrapper did not expose a usable artifact; this saved path was recovered from the ImageGen record and must be separately inspected before runtime acceptance.

```text
Use case: stylized-concept
Asset type: six-frame horizontal transparent VFX sprite strip for an original pixel-art side-view fantasy RPG.
Input images: Image 1 is the established hero style and warm color reference; Image 2 is the game's plain short sword silhouette and pixel finish; Image 3 is the heavy-strike skill icon motif reference.
Primary request: create one clean left-to-right animation strip for vfx:heavy-strike: a fast diagonal sword-energy slash made only of crisp, compact pixel clusters. Show exactly six distinct chronological frames: (1) tiny amber contact spark, (2) narrow steel glint beginning diagonally, (3) a gold-white diagonal crescent starts forming, (4) the crescent reaches its brightest sweep, (5) the arc breaks into a few amber sparks, (6) only two tiny fading sparks. The slash runs upper-left to lower-right, with no sword or character. Keep every frame visually isolated and centered in its own cell.
Composition/framing: exact 1536×256 transparent canvas, six equal 256×256 square cells in one horizontal row, no margins between cells; each frame stays entirely inside its cell with clear internal margin. Pixel clusters align consistently across adjacent frames and read smoothly at 60ms each. This separate 6×1 strip is not a multi-row sheet.
Style/medium: crisp hand-painted pixel-art particles matching the supplied game's icon rendering, hard-edged pixels with small controlled highlights; no blur, no photorealism.
Color palette: warm amber and gold with a small steel-white highlight.
Constraints: genuine transparent alpha for every empty pixel; keep all negative space fully transparent. No colored haze, soft glow field, tinted band, gradient, floor, canvas fill, shadow, checkerboard, gridlines, cell borders, lettering, numbers, HUD, watermark, repeated static frames, extra objects, or overlapping frame cells.
```

### sweep — accepted source

References: `art-source/actors/hero-style-reference-v1.png`, `art-source/actors/equip-starter-sword-v1.png`, `public/assets/interface/skill-sweep-v1.png`.

Tool record/output: `exec-d77a90af-f472-4989-aa4a-a8bb3d3f7c5b`; preserved as `interface-vfx-sweep-v2-attempt1.png` (2172×724 RGBA). Accepted runtime strip: `public/assets/interface/vfx-sweep-v2.png`.

```text
Use case: stylized-concept
Asset type: six-frame horizontal transparent VFX sprite strip for an original pixel-art side-view fantasy RPG.
Input images: Image 1 is the established hero style and warm color reference; Image 2 is the game's plain short sword silhouette and pixel finish; Image 3 is the game's broad sweep skill icon motif.
Primary request: create one separate chronological animation strip for vfx:sweep: a wide cool blue-silver horizontal crescent sweep, made only of crisp compact pixel clusters. Show exactly six distinct frames left-to-right: (1) tiny pale-blue spark, (2) short curved blue glint starts, (3) a crescent grows into a broad left-to-right fan, (4) full sweeping arc at peak with bright silver-blue edge, (5) arc recedes into a few cool blue sparks, (6) one tiny fading glimmer. The crescent is the only subject; no character, no drawn sword. Keep each frame centered and isolated in its own cell.
Composition/framing: exact 1536×256 transparent canvas; six equal 256×256 square cells across one row, no margins between cells; each frame safely inside its cell with clear internal margin. Consecutive frames change visibly and read smoothly at 60ms each. This is one horizontal strip, not a multi-row sheet.
Style/medium: crisp hand-painted pixel-art particles consistent with the supplied game's icon finish; hard-edged pixel clusters, no blur or photorealism.
Color palette: pale silver-blue core, bright cyan edge, sparse dark-blue accent pixels.
Constraints: genuine transparent alpha for every empty pixel and all negative space. No color mist, soft halo/background band, gradient, floor, shadow, canvas fill, checkerboard, gridlines, cell borders, text, letters, numbers, HUD, watermark, repeated static frames, extra objects, or overlapping cells.
```

### hit — accepted source

References: `art-source/actors/hero-style-reference-v1.png`, `public/assets/interface/skill-heavy-strike-v1.png`, `public/assets/interface/item-stone-chip-v1.png`.

Tool record/output: `exec-75b5a4ee-4845-410f-8148-6ad9e8d162b9`; preserved as `interface-vfx-hit-v2-attempt1.png` (2172×724 RGBA). Accepted runtime strip: `public/assets/interface/vfx-hit-v2.png`.

```text
Use case: stylized-concept
Asset type: six-frame horizontal transparent impact VFX sprite strip for an original pixel-art side-view fantasy RPG.
Input images: Image 1 sets the game's hero and overall pixel-art palette; Image 2 is the exact sword-impact visual style; Image 3 is a reference for small, sharp stone-like pixel fragments.
Primary request: create one separate six-frame chronological strip for vfx:hit, a compact melee contact impact with no characters or weapon. Left-to-right: (1) a tiny pale contact spark, (2) a small amber-red four-point burst begins, (3) the center brightens and three short angular streaks radiate out, (4) strongest compact starburst, (5) it breaks into a few small orange and red pixel fragments, (6) one tiny fading ember. Keep the impact localized, with a clear non-looping beginning, peak, and ending.
Composition/framing: one horizontal row of exactly six equal frame cells, intended as a six-frame sprite strip. Keep a centered compact effect with ample transparent space in every cell. All frames are separated by equal spacing, none touch or cross cell boundaries; clear chronology at 60ms per frame.
Style/medium: crisp hand-painted pixel-art VFX matching the supplied small game icons, hard pixel clusters and controlled highlights; no blur or photorealism.
Color palette: amber, warm gold, and restrained orange-red with small cream-white center.
Constraints: real transparent alpha throughout all empty areas. Avoid any full-canvas color, row or column tint, atmosphere, background gradient, ground, shadow, checkerboard, gridline, border, text, letters, numbers, HUD, watermark, extra characters, extra objects, repeated frames, or oversized diffuse aura.
```

### levelup — accepted source

References: `art-source/actors/hero-style-reference-v1.png`, `public/assets/interface/skill-vitality-v1.png`, `public/assets/interface/skill-heavy-strike-v1.png`.

Tool record/output: `exec-17b72070-4597-4cb0-85ff-3ab66b500c0c`; preserved as `interface-vfx-levelup-v2-attempt1.png` (2172×724 RGBA). Accepted runtime strip: `public/assets/interface/vfx-levelup-v2.png`.

```text
Use case: stylized-concept
Asset type: six-frame horizontal transparent level-up VFX sprite strip for an original pixel-art side-view fantasy RPG.
Input images: Image 1 is the established hero art style; Image 2 supplies the game's bright life-energy accent; Image 3 supplies the warm gold-and-steel effect palette.
Primary request: create a distinct non-looping six-frame animation for vfx:levelup, a vertical golden flourish without a character, words, numerals, or symbols. Read left-to-right: (1) a tiny gold glint close to the bottom of the frame, (2) a thin golden beam rises upward, (3) a taller warm-gold column with two ascending star motes, (4) a brief bright crown-shaped flare at the top of the column, (5) the column dissolves into several falling leaf-like golden pixels, (6) one small fading amber glimmer. Keep the flourish elegant and readable, not a solid rectangle of light.
Composition/framing: exactly six equal animation cells across a single row, each cell intended to be square and centered; leave generous transparent negative space around the effect and preserve a consistent center position. In the available panoramic strip, keep all visible effect pixels within a centered square region of each cell so the strip can be cropped to square frames without losing artwork. No element crosses a cell boundary. Six successive frames must read as a smooth progression at 60ms each.
Style/medium: crisp hand-painted pixel-art VFX consistent with the supplied icons, distinct pixel clusters, controlled highlights; no blur or photorealism.
Color palette: restrained amber, warm gold, pale cream highlights, a few leaf-green spark pixels.
Constraints: request genuine transparent alpha; all empty pixels fully transparent. No colored haze, tinted bands, gradients, background, floor, shadow, gridlines, cell borders, checkerboard, lettering, numbers, HUD, watermark, duplicate still frames, extra characters or objects.
```

### guard — accepted after one targeted repair

Generation references: `art-source/actors/hero-style-reference-v1.png`, `public/assets/interface/skill-iron-guard-v1.png`, `public/assets/interface/skill-heavy-strike-v1.png`. Repair references: `art-source/interface/interface-vfx-guard-v2-attempt1.png`, `art-source/actors/hero-style-reference-v1.png`, `public/assets/interface/skill-iron-guard-v1.png`.

Generation tool record/output: `exec-56408955-07af-4a08-9e2b-1b2da72be992`; preserved as `interface-vfx-guard-v2-attempt1.png` (2172×724 RGBA). Repair record/output: `exec-c5882e01-06d1-4053-bf1c-2c19e60c7c61`; preserved as `interface-vfx-guard-v2-repair1.png` (2172×724 RGBA). Accepted runtime strip: `public/assets/interface/vfx-guard-v2.png`.

Generation prompt:

```text
Use case: stylized-concept
Asset type: six-frame horizontal transparent defensive VFX sprite strip for an original pixel-art side-view fantasy RPG.
Input images: Image 1 establishes the game's hero pixel-art scale; Image 2 is the exact iron-guard shield and teal-ring motif; Image 3 supplies the matching crisp luminous pixel-effect finish.
Primary request: create a distinct non-looping six-frame animation for vfx:guard, a protective teal and pale-blue circular ring effect with no person, shield, or other subject. Read left-to-right: (1) two tiny teal arcs begin at opposite sides, (2) four curved segments grow toward a circle, (3) the full thin protective ring closes, (4) the complete ring brightens with two small side glints, (5) it subtly pulses and dims, (6) the ring breaks into a few tiny teal sparks and fades. Keep a perfectly empty transparent center large enough for a character sprite overlay in every frame; draw only the outer ring and sparse small glints, never fill the center.
Composition/framing: six equal centered animation cells in a single horizontal row; each effect remains fully within its cell with generous transparent margin. Keep the ring round and centered, with consistent scale across frames. No pixels cross cell boundaries; visible changes form a smooth sequence at 60ms per frame.
Style/medium: crisp, handcrafted pixel-art effect consistent with the supplied skill icon, distinct hard-edged pixel clusters, controlled highlights; no blur or photorealism.
Color palette: turquoise teal, pale icy blue, small silver-white highlights, restrained darker teal outline.
Constraints: genuine transparent alpha across all empty space, especially the full open ring center. No colored haze, tinted bands, filled center, background gradient, floor, shadows, canvas fill, checkerboard, gridlines, borders, text, letters, numbers, HUD, watermark, character, shield, repeated still frames, or diffuse aura.
```

Repair prompt:

```text
Use case: background-extraction
Asset type: targeted alpha cleanup of a six-frame defensive VFX strip for the same pixel-art RPG.
Input images: Image 1 is the exact generated vfx:guard strip to repair; Image 2 is only the hero scale/style reference; Image 3 is the exact iron-guard icon reference.
Primary request: make one precise repair to Image 1. In each of the six existing frames, remove only the few stray teal/cyan pixels and tiny glints that appear inside the circular ring opening. The entire interior hole of every ring must be genuinely transparent, completely empty so a player sprite face and body remain unobstructed. Keep the circular outer arcs, their color, the two small outside side glints, the frame order, positions, scale, style, and 6-frame chronology exactly as they are.
Composition/framing: preserve the same single horizontal six-frame strip and the same cell layout. Do not recompose or redraw the rings.
Constraints: change only pixels inside the ring openings to transparent alpha; preserve all effect pixels on or outside the ring. Maintain real transparent alpha everywhere empty. No background, glow field, filled center, checkerboard, text, labels, gridlines, borders, watermark, new pixels, or added objects.
```
