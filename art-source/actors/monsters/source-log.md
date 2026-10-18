# 怪物圖集來源紀錄

所有正式怪物圖集均明確參考本地主角風格圖：`F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png`。輸出以 ImageGen 產生，保留來源原稿；只有通過當前包視覺與格數檢查的檔案才複製到 `public/assets/actors/monsters/`。

## 嫩芽史萊姆 (`actor:slime`)

狀態：正式入選；一次針對 attack row 的修正後檢視。最後原稿 `slime-atlas-v1.png`，runtime `public/assets/actors/monsters/slime-atlas-v1.png`。

參考：
- `F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png`（主遊戲點陣觀感、比例、輪廓和暖色層次）
- 首次輸出的史萊姆圖集（只用於對齊自身輪廓及局部修正）

首次生成 prompt 全文：

> Create a transparent-background pixel-art sprite atlas for the original MapleStory-inspired side-view game in this project. Use the attached local short-haired swordsman image as the game's style reference; do not copy the human character. Subject: one original lime-green forest slime with a rounded soft blob silhouette, cream-yellow spots, dark outline, tiny expressive dark eyes, and a small leaf-like highlight. Keep the same character design in every cell. The canvas must be a strict grid of exactly 6 columns and 5 rows, with equal square cells and no gutters. Row order from top: idle, walk, attack, hurt, dead. Idle: first two subtly different breathing poses, repeat pose 2 in cells 3–6. Walk: six readable squash-and-hop poses. Attack: four distinct compress, stretch, forward-lunge, and recoil poses, repeat pose 4 in cells 5–6. Hurt: two recoiling/flinching poses, repeat pose 2 in cells 3–6. Dead: four progressively flattened/fading poses, repeat pose 4 in cells 5–6. Center each slime in its cell, keep feet/baseline consistent, leave clear transparent padding, and keep every silhouette completely inside its cell. Crisp hand-authored pixel-art look, limited cohesive green/cream palette, clean opaque edges with true alpha outside the sprite. No checkerboard, no background, no ground, no text, no labels, no watermark, no extra characters, no objects.

局部修正 prompt 全文：

> Edit only the third horizontal row from the top (the attack row) in the supplied slime sprite atlas. Preserve the exact 6-column by 5-row grid, canvas dimensions, transparent background, cell placement, colors, outline style, and the character in every other row. Make the first four cells of this row read as a clear attack: low anticipation squash, strong upward stretch, a short forward lunge with the slime body visibly projected to the right, then a recoil/recovery pose. Repeat the fourth attack pose in cells five and six. Keep the feet baseline consistent, no effects or extra objects, no text. Use the attached local swordsman image only as the game's pixel-art style reference; do not add or copy the human.

檢視：
- 生成工具原稿位置：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-3a3843bb-458d-46ae-8251-730a35744a68.png`
- 局部修正版原稿：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-b2b3c33c-c7e9-4098-b05a-7b94463c8035.png`
- 專案原稿：`art-source/actors/monsters/slime/slime-atlas-attempt-01.png`、`art-source/actors/monsters/slime/slime-atlas-v1.png`
- 尺寸 1374×1145，整除 6×5，每格 229×229；四角 alpha 為 0。局部修正後抽樣可見透明及半透明邊緣；紅色像素僅在極低 alpha（1 或 3）抽樣到 163 個，無可見紅暈。已實際檢視完整圖集，輪廓在格內、攻擊列有壓低/伸展/前撲/回復差異，無背景與文字。
- Runtime 與入選原稿為同一份輸出。manifest 顯示 96×96，pivot (.5, 1)；普通怪 attack 用 `enemy-melee` 的總時長 1400ms，四格各 350ms。

## 苔殼蝸牛 (`actor:snail`)

狀態：`UNFINISHED`，不進 runtime，不進子集 manifest。一次局部修正後仍見明顯紅色殘留；依規定不再修正、不以假素材替代。

生成 prompt 全文：

> Create a transparent-background pixel-art sprite atlas for the original side-view forest game. Use the attached local short-haired swordsman image as the game's style reference; do not include the human. Subject: one small original snail monster with a warm cream-colored body, two short eye stalks, and a rounded dark-brown shell covered in moss and tiny leaf accents. Keep the same design and proportions in every cell. Exact strict grid: 6 equal columns by 5 equal rows, square cells, no gutters. Rows top to bottom: idle, walk, attack, hurt, dead. Idle uses two gentle poses then repeats pose 2; walk has six distinct slow crawling poses; attack has four readable lean/extend/bump/recoil poses then repeats pose 4; hurt has two recoiling poses then repeats pose 2; dead has four progressively slumped poses then repeats pose 4. Consistent baseline and center placement, full silhouette inside each cell, transparent padding. Crisp warm pixel art matching the attached game's limited palette and outline. True alpha outside the snail, no checkerboard, no scenery, no text, labels, watermark, extra character, or separate effects.

修正 prompt 全文：

> Edit only the visible red-colored edge residue around the snail sprites in this supplied sprite atlas, making those red fringe pixels transparent or replacing them with the immediately adjacent natural outline/body pixels. Preserve every snail pose, exact 6-column by 5-row grid, dimensions, cell placement, shell colors, pixel-art style, and true transparent canvas. Do not change character design or add anything. Use the attached local swordsman only as style reference; do not add the human.

輸出及檢視：
- 首次原稿：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-75962bd6-b289-4673-b7fe-fec06725ae95.png`
- 一次修正版：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-4027f846-61ad-4e82-afde-d2661521c304.png`
- 專案原稿：`art-source/actors/monsters/snail/snail-atlas-attempt-01.png`、`art-source/actors/monsters/snail/snail-atlas-attempt-02.png`
- 兩張皆為 1374×1145、可整除 6×5，四角為透明；局部修正後抽樣仍有數千個鮮紅像素，肉眼可見腳邊紅暈。未選入遊戲。

## 菌傘菇 (`actor:mushroom`)

狀態：`UNFINISHED`，不進 runtime，不進子集 manifest。一次局部修正後仍見可見紅邊；保存兩版，不再重試。

生成 prompt 全文：

> Create one original monster sprite atlas for the side-view pixel-art game shown by the attached local short-haired swordsman and existing green slime. The swordsman is the primary style reference for pixel scale, outline, warm palette, and overall game look; the slime is only a secondary rendering consistency reference. Do not include either reference character. Subject: one cute but clearly hostile forest mushroom creature, short cream stalk body, broad warm red-orange cap with pale cream spots, small dark eyes and a tiny frown; preserve one consistent design throughout. Exact sprite sheet: strict 6 columns by 5 rows, equal square cells, no gutters, transparent background. Top-to-bottom row states: idle, walk, attack, hurt, dead. Idle row: two subtly distinct breathing poses, repeat pose 2 in cells 3-6. Walk row: six readable waddling steps with cap bounce. Attack row: four clear poses: crouch/aim, lean forward, cap-and-body headbutt lunge forward, recoil; repeat pose 4 in cells 5-6. Hurt row: two flinch/recoil poses, repeat pose 2 in cells 3-6. Dead row: four progressive topple/fade poses, repeat pose 4 in cells 5-6. Keep baseline and character scale consistent, center each pose in its own cell with generous transparent padding, no silhouette crossing cell boundaries. Pixel-art only, warm forest palette, sharp clean pixel edges, true alpha outside the sprite. No background, no ground plane, no checkerboard, no text, labels, watermark, magic effects, extra characters, or props.

局部修正 prompt 全文：

> Edit the supplied local mushroom sprite atlas. The first attached image is the target; the second local short-haired swordsman image is only the game's pixel-art style reference, and must not be added. Make one narrowly scoped repair: remove the vivid red fringe/stray red pixels around every mushroom silhouette by making those red pixels transparent or replacing them with neighboring natural mushroom edge colors. Preserve the exact current canvas size and strict 6-column by 5-row grid, all poses and frame positions, mushroom cap/stalk colors, facial expressions, pixel-art shading, and transparent background. Do not alter poses, redraw the character, shift any frame, or add effects. Keep all silhouettes fully inside their existing cells. No text, labels, scenery, checkerboard, or extra objects.

輸出及檢視：
- 首次原稿：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-dc2dc3c0-ef7e-41f4-8af4-c74ea0574c36.png`
- 一次修正版：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-362da7a4-7e59-429c-a020-36552d31df23.png`
- 專案原稿：`art-source/actors/monsters/mushroom/mushroom-atlas-attempt-01.png`、`art-source/actors/monsters/mushroom/mushroom-atlas-attempt-02.png`
- 輸出尺寸 1374×1145，格數可整除 6×5；視覺檢視確認姿勢和格序可讀，但兩版都有明顯紅色邊緣殘留。修正已按每組一次限制用完；無 runtime 檔或 manifest entry。

## 赤背野豬 (`actor:boar`)

狀態：`UNFINISHED`，不進 runtime，不進子集 manifest。一次針對外緣紅色殘留的修正後仍可見紅暈，保存兩版，不再重試。

生成 prompt 全文：

> Create one original side-view pixel-art game enemy sprite atlas, using the attached local short-haired swordsman as the primary style reference for pixel size, warm outline palette, and polish. The attached slime is a secondary style reference only; do not include it or the swordsman. Subject: one sturdy reddish-brown forest boar with a distinct red-brown back stripe, cream tusks, dark hooves, short legs, and a determined face. Keep its proportions and identity consistent across cells. Make a strict grid of 6 equal columns by 5 equal rows with transparent background, no gutters, square cells. Top to bottom rows: idle, walk, attack, hurt, dead. Idle two subtle breathing poses then repeat pose 2; walk six distinct four-legged steps; attack four clear poses: lower head, brace, charge forward with tusks leading, recoil; repeat pose 4 in cells 5-6; hurt two flinches then repeat pose 2; dead four poses ending on its side then repeat pose 4 in cells 5-6. Consistent hoof baseline, centered and fully inside each separate cell with transparent margin. Crisp pixel art, natural brown and warm red-brown body colors with cream accents. IMPORTANT: transparent alpha outside the boar; no red matte, red glow, bright red fringe, or red pixels outside the natural silhouette. No background, ground, checkerboard, text, label, watermark, extra characters, or props.

局部修正 prompt 全文：

> Make a single local cleanup edit to the first attached boar sprite atlas. Use the second attached local swordsman only as the project's pixel-art style reference; do not add the swordsman. Remove the visible bright red pixels, red outlines, red glow, and red specks that sit OUTSIDE or halo around the natural boar silhouette; make external fringe transparent or replace it with the adjacent natural brown/black outline color. Preserve the boar's intended reddish-brown back stripe inside its body. Preserve every pose and every pixel except necessary edge-fringe cleanup, the exact canvas size and 6 columns by 5 rows, equal cells, cell positions, transparent background, palette, anatomy, and outline. No redesign, no shifted frames, no added effects or objects, no text, no background.

輸出及檢視：
- 首次原稿：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-78d0abca-a441-4bd7-bdbf-2d0d332f7c8f.png`
- 一次修正版：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-d2144c89-2482-4315-a251-136bee927107.png`
- 專案原稿：`art-source/actors/monsters/boar/boar-atlas-attempt-01.png`、`art-source/actors/monsters/boar/boar-atlas-attempt-02.png`
- 兩版可見完整 6×5 動作序列；視覺檢視均有紅色外緣瑕疵，修正未解決。無 runtime 檔或 manifest entry。

## 礦岩魔像 (`actor:golem`)

狀態：`UNFINISHED`，不進 runtime，不進子集 manifest。一次局部清理後仍可見紅／黃外緣殘色，保存兩版，不再重試。

生成 prompt 全文：

> Create an original monster animation atlas for the same side-view pixel-art game. Use the attached local short-haired swordsman as the primary reference for pixel scale, warm shading, and outline; the green slime is only a secondary pixel-art style reference. Do not include either reference character. Subject: one broad, heavy mineral golem built from layered gray-brown rock plates with a few muted teal mineral veins, glowing amber eyes, blocky forearms and heavy stone feet. Keep silhouette, face, and palette consistent in all cells. Exact 6-column by 5-row equal square sprite grid, transparent canvas, no gutters. Row order top down: idle, walk, attack, hurt, dead. Idle two subtle heavy breathing poses then duplicate second pose; walk six slow stomping steps; attack four readable heavy-slam poses: raise both arms, hold overhead, slam both fists down with body compression, recover; repeat final attack pose in columns 5-6. Hurt two flinch poses and repeat pose 2; dead four poses progressively crumbling/slumping then repeat pose 4. Keep feet on one consistent baseline, fully contained and centered in separate cells with transparent margins. Crisp detailed pixel art, readable stone texture, no excessive particles. True alpha outside character, naturally colored silhouette edges with no red matte/glow/fringe. No background, no floor, no checkerboard, no text, labels, watermark, extra characters, or props.

局部修正 prompt 全文：

> Edit only the transparent edge cleanup of the first attached stone-golem atlas. The second attached local short-haired swordsman image is only a style reference; do not add it. Remove stray red, yellow, and green matte/fringe pixels outside the golem silhouettes; make those outside pixels transparent or replace with the immediately adjacent natural stone outline. Keep the intended muted teal mineral veins and amber eyes inside the golem unchanged. Preserve the exact 6 by 5 grid, canvas size, all poses, cell positions, stone texture, colors, outlines, and alpha transparency. Do not redraw, shift, recolor, or alter any pose. No extra effects, text, or background.

輸出及檢視：
- 首次原稿：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-22c9abdd-ccd2-462c-993f-c3796839ec1e.png`
- 一次修正版：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-012c2c04-9e32-4c4b-8ad1-bceffb63629a.png`
- 專案原稿：`art-source/actors/monsters/golem/golem-atlas-attempt-01.png`、`art-source/actors/monsters/golem/golem-atlas-attempt-02.png`
- 兩版為 1374×1145 且格數整除 6×5；姿勢可辨。修正版輪廓外仍有可見紅／黃殘色，未選入遊戲。

### T10-06 reattempt — `actor:golem` (UNFINISHED, source-only)

One new generation and its single targeted repair were made on 2026-10-18. Both originals are preserved; neither is copied into runtime or the creature subset manifest.

References for generation: `public/assets/actors/monsters/slime-atlas-v1.png` (secondary pixel-cluster/style reference) and `public/assets/actors/monsters/sentinel-atlas-v1.png` (side-view framing and silhouette reference). Both local references were viewed before generation and were passed explicitly through `referenced_image_paths`. The golem itself was not copied from either reference.

#### `golem-atlas-attempt-03.png` — new generation

- Built-in `image_gen.imagegen`; `transparent_background: true`.
- Original output: `D:\dev-data\codex-home\generated_images\01a14c79-c287-7051-aa92-331264232a6b\exec-6aaadfd7-806a-4799-b29e-af242020212b.png`.
- Source copy: `art-source/actors/monsters/golem/golem-atlas-attempt-03.png`.
- Dimensions/encoding: 1374×1145 PNG, RGBA / Format32bppArgb; exactly divides into 6×5 cells of 229×229.
- SHA-256: `D536E2E847469FE9E3BD9D82BCA5663717D87E33E7EBE8FA238D34C37E2B3DF6`.
- Alpha counts: transparent 685,585; partial (1–254) 886,983; opaque 662.
- Full-size view: all five row poses and order are recognizable, but visible red/yellow/green fringe remains and edge pixels look softened. Per-cell scan found the last nontransparent row at local y=228 in all 30 cells (zero transparent bottom margin); thus the feet touch each cell's bottom edge. Rejected.

Full generation prompt:

```text
Use case: stylized-concept
Asset type: production 2D game enemy sprite atlas for an existing side-view pixel-art adventure
Primary request: Create one original mineral golem animation atlas, based on the project style references while designing a new creature. Use Image 1 (the green slime atlas) as the reference for compact pixel clusters, simple readable shading, and the project's monster scale. Use Image 2 (the iron sentinel atlas) as a secondary reference for side-view full-body framing, crisp silhouette readability, and baseline discipline. Do not include, copy, or echo either reference character.
Subject: One broad, heavy stone golem built from layered cool gray and muted gray-brown rock plates, with sparse moss-green patches and a few restrained cool blue-gray mineral veins. Small, subdued amber eyes sit inside its face only. Large blocky forearms, compact torso, and broad stone feet; a distinctive sturdy silhouette. Keep the same face, plate arrangement, proportions, and limited palette throughout all poses.
Style/medium: Deliberate hard-edged pixel art with clear stepped contours and economical, clustered square pixels. Simple, solid value groups; no painterly rendering, no airbrush, no gradient, no soft antialiasing, no blur.
Composition/framing: One exact 6-column by 5-row atlas, 1374 by 1145 pixels if supported, divided into 30 equal 229 by 229 square cells with no gutters, separators, or padding between cells. Every pose centered within its own cell, fully visible with at least 16 pixels of transparent safe margin on every side; silhouettes must never touch or cross cell boundaries. Keep the same foot baseline at the bottom of each row. Row order, top to bottom: idle, walk, attack, hurt, dead. Idle: two subtly different heavy breathing poses, then repeat pose 2 in cells 3–6. Walk: six distinct slow stomping poses with small foot and arm shifts. Attack: raise both arms, hold overhead, slam both fists down with body compression, recover; repeat the final recovery pose in cells 5–6. Hurt: two clear flinch/recoil poses, then repeat pose 2 in cells 3–6. Dead: four progressive crumbling/slumping poses ending as a low heap, then repeat pose 4 in cells 5–6. All frames must visibly communicate their assigned state.
Scene/backdrop: True transparent canvas with no environment.
Color palette: Restrained low-saturation cool stone gray, gray-brown, moss green, and a small amount of cool blue-gray in the mineral veins. Tiny contained amber eyes only. No bright red, orange, yellow, magenta, or green pixels outside the natural silhouette; no warm or colored edge halo.
Materials/textures: Chunky stone plate facets and sparse mineral marks rendered as crisp pixel clusters, without speckled particles.
Text (verbatim): None.
Constraints: Preserve exact grid and row order; maintain one coherent golem design; keep all poses legible and contained within individual cells; true alpha around every sprite and full transparency in empty regions.
Avoid: red/yellow/green fringe, matte, glow, rim light, outlines made of colored pixels, soft edge, antialiasing, bloom, cast shadows, ground plane, floor, background, checkerboard, cell borders, captions, labels, text, logos, watermarks, extra characters, weapons, particles, or decorative props.
```

#### `golem-atlas-attempt-04.png` — single targeted repair of attempt-03

- Before editing, viewed attempt-03 at its local generated path. Passed only the attempt-03 PNG as the edit target in `referenced_image_paths`; retained `transparent_background: true`.
- Original output: `D:\dev-data\codex-home\generated_images\01a14c79-c287-7051-aa92-331264232a6b\exec-1ea2a135-00ee-4a11-bed1-da273651f905.png`.
- Source copy: `art-source/actors/monsters/golem/golem-atlas-attempt-04.png`.
- Dimensions/encoding: 1373×1145 PNG, RGBA / Format32bppArgb. Width is not divisible by 6, so this output cannot be split into six equal columns and fails the required grid.
- SHA-256: `B1DE080859A8D61221CC2AC9ABEB624DC96F60A83A0E7EEAA80515E734FD454C`.
- Alpha counts over the full image: transparent 696,419; partial (1–254) 874,323; opaque 1,343; all four canvas corners have alpha 0. Since the width does not divide into six equal cells, no valid per-cell bounds/foot scan is possible. Full-size view still shows colored red/yellow/green edge fringe and softened/painterly edges; silhouettes remain close to the row bottoms. Rejected; no further repair is allowed for this candidate.

Full targeted-repair prompt:

```text
Edit the first attached image, which is the target mineral-golem atlas. Make one narrowly scoped repair to its transparent pixel edges and per-cell containment. Preserve the same golem design, rock plates, low-saturation gray and moss palette, cool mineral details, amber eyes, all 30 poses, row order, and the exact 1374 by 1145 canvas with a strict 6-column by 5-row grid of 229 by 229 cells.

Repair only these visible defects: remove every red, yellow, and bright-green fringe or matte pixel outside the natural stone silhouette; make the outside area fully transparent. Convert soft or antialiased edge pixels into crisp stepped pixel clusters with hard opaque-to-transparent edges, without painting a colored rim or outline. Move or scale each pose only as much as needed so every silhouette has at least 12 pixels of fully transparent safety margin on all four sides of its own cell. Keep feet on a consistent row baseline while leaving transparent pixels below the feet; no silhouette may touch the cell boundary. Do not change the pose, facial expression, rock pattern, colors inside the character, lighting, or animation sequence. Do not redraw the atlas, add or remove poses, shift the grid, or introduce props or effects.

Keep the canvas transparent. No background, floor, shadows, grid lines, checkerboard, text, labels, watermark, glow, bloom, soft edge, antialiasing, or colored fringe.
```

## 鏽甲哨兵 (`actor:sentinel`)

狀態：正式入選。首次生成與一次外緣修正後完整檢視。正式原稿 `sentinel-atlas-v1.png`，runtime `public/assets/actors/monsters/sentinel-atlas-v1.png`。

參考：
- `F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png`（主角風格參考）
- `public/assets/actors/monsters/slime-atlas-v1.png`（次要像素密度參考）

首次生成 prompt 全文：

> Create one original enemy animation sprite atlas for the same side-view pixel-art game. The attached local short-haired swordsman is the primary reference for pixel scale, outline, and warm game style; the slime is a secondary style reference only. Do not include either reference character. Subject: one small-to-medium ancient mine sentinel, a humanoid suit of dark gray iron armor with a closed angular helmet, narrow muted cyan eye slit, rust-brown plates on shoulders and knees, and a short rectangular shield-like left forearm integrated into its silhouette. Keep armor shape, helmet and palette consistent. Strict transparent 6-column by 5-row grid of equal square cells, no gutters. Top to bottom states: idle, walk, attack, hurt, dead. Idle two subtle metal-weight shifts then repeat second pose; walk six compact armored steps; attack four clear sword-swing poses with right arm raising, windup, horizontal slash, recovery; repeat attack pose 4 in cells 5-6. Hurt two recoils then repeat pose 2. Dead four stages of armor collapsing into a seated heap, then duplicate final in cells 5-6. Consistent feet baseline, centered in each cell, fully inside with transparent margins. Crisp detailed pixel art, restrained iron-gray, brown rust, muted cyan; clean natural dark iron outline. True alpha outside figure, no red glow, red matte, bright red fringe, or colored edge pixels outside silhouette. No background, ground, checkerboard, text, label, watermark, extra character, or separate weapon lying on ground.

局部修正 prompt 全文：

> Perform one narrow cleanup edit on the first attached original sentinel atlas. The second attached short-haired swordsman is only a game style reference; do not add the human. Remove the stray bright red specks and red fringe outside the sentinel's natural iron/rust silhouette, making those pixels transparent or recoloring them to the immediately adjacent dark iron outline. Keep the intended rust-brown plates that are inside the armor. Preserve all five animation rows and every pose, exact canvas size, 6 columns by 5 rows, frame alignment, transparent alpha, armor details, colors, and outline. No redesign or frame shifts. No background, no text, no added props or effects.

輸出及檢視：
- 首次原稿：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-db521cd1-c498-413d-bc72-264682bf3ffe.png`
- 修正版原稿：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-a682e061-72ba-409d-b7b9-cb9ff41fb5f6.png`
- 專案原稿：`art-source/actors/monsters/sentinel/sentinel-atlas-attempt-01.png`、`sentinel-atlas-attempt-02.png`、`sentinel-atlas-v1.png`
- 實際尺寸 1374×1145，每格 229×229，四角透明；六欄五列姿勢和行動順序可辨，無文字與背景。局部 alpha 抽樣：紅色像素樣本最大 alpha 首稿 5、修正版 2，均為近透明；完整檢視沒有可見紅暈。正式源圖與 runtime SHA-256 相同。
- 顯示 96×96、pivot (.5,1)，animation attack 四格各 350ms，對應普通怪 `enemy-melee` 總時長 1400ms。

## 古礦守衛 (`actor:guardian`)

狀態：`UNFINISHED`，不進 runtime，不進子集 manifest。一次修正後紅色高 alpha 殘像反而增加，依每組只修正一次規則停止。

生成 prompt 全文：

> Create the single boss monster sprite atlas for the same original side-view pixel-art game. Use the attached local short-haired swordsman as the primary art-style and scale reference, and the smaller iron sentinel as secondary armor/rendering continuity. Do not include either reference character. Subject: one ancient mine guardian, a towering broad-shouldered golem in old bronze-gray mine armor fused with dark stone, a faceless helmet with bright amber eyes, heavy arms and massive fists; silhouette should feel imposing and clearly larger than normal monsters while remaining cute game pixel art. Exact strict grid: 6 equal columns by 5 equal rows, square cells, transparent background, no gutters. Row order top-to-bottom idle, walk, attack, hurt, dead. Idle: two heavy breathing poses, duplicate second in cells 3-6. Walk: six slow heavy stomps. Attack: four clear boss telegraph-to-impact poses: crouched anticipation with one fist low, lift the huge fist overhead for a long charge, slam fist down with body compression, rise into recovery; repeat recovery in cells 5-6. Hurt: two heavy flinches, duplicate pose 2 in cells 3-6. Dead: four progressive collapse poses ending as a heap of armor and stone, duplicate pose 4 in cells 5-6. Keep feet baseline and scale consistent, character fully inside each cell, leave transparent margins. Pixel-art only, detailed old iron and stone plates, muted teal mine mineral accents, amber eyes. True alpha outside silhouette, no red glow, red matte, red fringe or stray bright edge pixels. No scenery, floor, checkerboard, text, labels, watermark, extra characters, or attack effects.

局部修正 prompt 全文：

> Edit only edge transparency of the first attached ancient guardian sprite sheet. The second attached local short-haired swordsman image is only a pixel-art style reference; do not add it. Remove stray bright red specks, red fringe, and colored mattes outside the guardian's natural bronze-gray stone armor silhouette; make those external pixels transparent or replace with neighboring natural dark armor edge colors. Preserve amber eyes and all intended brown/copper armor colors inside the character. Keep exact canvas dimensions and strict 6 columns by 5 rows, all five animation sequences and poses, cell alignment, scale, outline, transparent background, and all details. Do not redesign, shift or recolor the character. No effects, extra objects, text, or background.

輸出及檢視：
- 首次原稿：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-8272671d-7069-418f-a74e-fb255521bcbc.png`
- 一次修正版：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-bf9e9813-3407-4d87-8151-709f216b3e23.png`
- 專案原稿：`art-source/actors/monsters/guardian/guardian-atlas-attempt-01.png`、`art-source/actors/monsters/guardian/guardian-atlas-attempt-02.png`
- 尺寸皆 1374×1145、格數可整除 6×5。抽樣鮮紅色像素 alpha>32 的數量由首稿29增至修正版65（每3像素抽一點），修正後仍有可見殘邊，故不入遊戲。

## Recovery round 2026-10-18: snail, mushroom, boar

All six outputs were generated with built-in ImageGen using `transparent_background: true` and the required local protagonist style reference. Their original output files are in `D:\dev-data\codex-home\generated_images\01a14bf5-1bfc-7890-acf5-669bb893c509`; the project source copies listed below are unchanged copies of those outputs.

Each new attempt and one targeted repair used built-in ImageGen, `transparent_background: true`, and the explicit local style reference `F:/Desktop/MapleStory/art-source/actors/hero-style-reference-v1.png`. Each source output is copied unchanged under its species directory. All candidates have the required 6×5 dimensions (1374×1145 RGBA); none passed alpha-edge review because visible red/yellow fringe persisted after repair. No runtime files or manifest entries were created.

| Asset | Attempt output / project copy | Repair output / project copy | Sampled alpha 0 / partial / 255 (attempt → repair) | Red-dominant samples (attempt → repair) | Result |
| --- | --- | --- | --- | --- | --- |
| snail | `exec-3b41e6d9-11b3-4625-a623-ecfb1301c5aa.png` / `snail/snail-atlas-attempt-03.png` | `exec-307f8cfb-a2cb-476c-b1b4-7b31dc70489f.png` / `snail/snail-atlas-attempt-04.png` | 12,926 / 11,827 / 15 → 12,879 / 11,881 / 8 | 4,067 → 4,350 | UNFINISHED; visible bright edge contamination |
| mushroom | `exec-66c89898-c63b-4c5c-90db-50a13eb4b8d9.png` / `mushroom/mushroom-atlas-attempt-03.png` | `exec-b3ee9fd7-78b1-4186-b66c-d63cc81ffcf4.png` / `mushroom/mushroom-atlas-attempt-04.png` | 13,926 / 10,821 / 21 → 13,981 / 10,744 / 43 | 5,505 → 5,678 | UNFINISHED; visible bright edge contamination |
| boar | `exec-2c000264-82dd-4b21-84e2-f49e4571fa78.png` / `boar/boar-atlas-attempt-03.png` | `exec-1036391f-2d92-4e9e-9f2e-9608948e80aa.png` / `boar/boar-atlas-attempt-04.png` | 12,023 / 12,728 / 17 → 12,264 / 12,466 / 38 | 9,836 → 10,139 | UNFINISHED; visible bright edge contamination |

Alpha categories and red-dominant pixels were sampled every 8 px (24,768 samples per image). Red-dominant means sampled R > 1.5×G and R > 1.5×B with A > 0; this is an indicator only, and the rejection is based on direct visual inspection as well. All three targeted repairs retained or increased sampled red fringe, so no more retries were made.

### snail generation prompt

```text
Use case: stylized-concept. Asset type: production enemy sprite atlas for a 2D side-view pixel-art game. Input image 1 is a local style reference only: match its warm illustrated pixel-art palette, clean 2D character scale, and crisp rendering; do not include the human character. Primary request: one original small moss-shell snail creature, clearly readable side-on, round teal-green body, large gentle eye stalks, one warm brown spiral shell with pale cream rim and a few moss patches. Canvas exactly 1536x1280 px, strict uniform 6 columns x 5 rows of 256x256 px cells, transparent background, no outer margins/gaps/grid marks. One complete snail per cell, all cells same character design and scale, ground/foot baseline consistent at cell y=232. Row order top to bottom: idle, walk, attack, hurt, dead. Useful poses: idle 2, walk 6, attack 4, hurt 2, dead 4; unused cells repeat that row's final useful pose. Attacks show a clear short forward body lunge; hurt recoils; dead lies still. Keep entire creature inside each cell with no overlap. Crisp pixel-sprite illustration, hard clean alpha edges. Constraints: exact grid and canvas dimensions, transparent pixels outside character, no red/yellow fringe, no glow or soft alpha shadows, no background, floor, text, label, watermark, logo, props, border or extra creatures.
```

Snail repair prompt:

```text
Use case: precise-object-edit. Asset type: transparent sprite atlas cleanup. Input image 1 is the exact six-column by five-row snail atlas. Change ONLY the visible bright red and yellow stray pixels/edge contamination around the shell, body, and ground line, removing the fringe cleanly with fully transparent outside pixels and crisp hard sprite edges. Keep the snail artwork, pose sequence, positions, all 30 cells, dimensions, grid, baseline, colors and details exactly unchanged. Preserve the transparent background and exact canvas size. Do not redraw, crop, scale, shift, add or remove creature details. No background, shadows, glow, labels, watermark, or props.
```

### mushroom generation prompt

```text
Use case: stylized-concept. Asset type: production enemy sprite atlas for a 2D side-view pixel-art game. Input image 1 is a local visual style reference only; do not copy or include the human. Create one original small forest mushroom creature: warm red-orange domed mushroom cap with a few cream spots, pale face and short moss-green root feet, friendly but lively. Exact transparent atlas 1536x1280 px, 6 columns x 5 rows of equal 256x256 cells, no margins, no gutters, no grid marks. Each cell contains one full mushroom, same design/scale and ground baseline at y=232. Row order: idle, walk, attack, hurt, dead. Useful frames per row 2,6,4,2,4; repeat final useful pose in unused cells. Walk steps visibly; attack is a short cap-first bump; hurt recoils; dead lies still. Crisp pixel-sprite illustration, consistent identity, clean hard silhouette. Empty transparent background, fully clear pixels outside sprites. No red/yellow fringe, halo, soft alpha, glow, floor, shadow, text, label, watermark, border, logo, props or extra creature. Exact 6x5 aligned grid and no cell overlap.
```

Mushroom repair prompt:

```text
Use case: precise-object-edit. Asset type: transparent sprite atlas cleanup. Input image 1 is the exact 6-column x 5-row mushroom creature atlas. Edit only the visible red and yellow-green fringe pixels and detached colored specks around the character contours; remove that contamination, keeping transparent outside pixels and crisp hard edges. Preserve every mushroom pose, face, cap, body, palette, sequence, cell boundary, baseline and atlas dimension exactly. Do not repaint the creature or change any character details. Keep the exact 6x5 grid, same output size and transparent background. No crop, resize, shift, extra objects, background, labels or watermark.
```

### boar generation prompt

```text
Use case: stylized-concept. Asset type: production enemy sprite atlas for a 2D side-view pixel-art game. Input image 1 is a local style reference only, to match warm outlined illustrated pixel-art rendering; do not include the human. Create one original small red-backed forest boar: compact stocky dark russet body, pale cream snout, two small ivory tusks, dark hooves, a clear red-brown dorsal patch. Same character across all frames. Exact transparent canvas 1536x1280 px, strict 6 columns x 5 rows, equal 256x256 cells, no margins/gutters/grid lines. One full boar per cell, centered at same scale and ground baseline y=232, no overlap. Row order idle, walk, attack, hurt, dead. Useful poses per row 2,6,4,2,4; unused cells repeat last useful pose. Walk row clearly cycles leg positions; attack row lowers head and charges forward; hurt recoils; dead lies on side. Crisp hard pixel-art sprite edges, true transparent outside, coherent details. No fringe, detached colored pixels, red/yellow halo, soft transparency, glow, floor, cast shadow, background, text, watermark, labels, border, logo, props or other animals.
```

Boar repair prompt:

```text
Use case: precise-object-edit. Asset type: transparent enemy sprite atlas edge cleanup. Input image 1 is the exact 6x5 red-backed boar atlas. Change only the visible red/colored fringe and stray edge pixels outside boar silhouettes, replacing those pixels with clean transparency or natural antialiased outline consistent with the existing sprite. Preserve every boar, pose, cell position, grid, frame order, baseline, colors and art details; keep exact image dimensions and transparent background. Do not redraw, crop, resize, shift, or add anything. No background, shadows, labels, watermark, props, or extra character.
```

### 2026-10-18 T10-06 reattempt — `actor:mushroom` (one new composition)

Before this attempt, at 2026-10-18 01:40:10 UTC, I completed live reads of the following Playroom development/release specifications:

- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md

Applicable requirements for this asset-only work: resource paths stay relative; the project remains accurately desktop-only; the game must adapt to iframe sizing and must not navigate out, open popups, submit forms, call account/admin APIs, or be published as part of this task. Scope is limited to the mushroom atlas, this source log, the T10 task status, the T10 and T10-creatures reports, and (only if accepted) its existing creature-subset metadata entry. Acceptance checks are the actual 6×5 image grid and renderer frame/timing convention, per-cell containment and transparent safety margin, coherent sprite silhouette and baseline, readable motion/state poses, alpha/edge cleanliness, and source/runtime hash plus matching metadata if promoted.

Requirements read before implementation: root `AGENTS.md`; `plan/09-parallel-dispatch.md`; `plan/01-game-design.md`; `plan/07-shared-contracts.md`; `plan/08-content-spec.md`; `plan/10-asset-spec.md`; `plan/tasks/T10-actor-assets.md`; `plan/reports/T10.md`; `plan/reports/T10-creatures.md`; this monster source log; `src/contracts/asset-manifest.ts`; the actual renderer animation validator in `src/render/index.ts`; and the existing accepted slime/sentinel subset metadata. The ImageGen skill was read in full. The required local references were viewed before being passed to ImageGen.

Status before generation: previous mushroom attempts 01–04 remain rejected/source-only because visible red edge contamination persisted after the earlier repair. This is a separate new composition, limited to one ImageGen generation and at most one targeted repair; a failed repair will stop this asset attempt.

Generation prompt (full text):

```text
Use case: stylized-concept.
Asset type: production enemy animation atlas for an original side-view pixel-art adventure game.
Input images: Image 1 is the local short-haired traveler style reference, used only for warm palette, outline character, and pixel-art presentation. Image 2 is the accepted forest slime atlas, used only as a guide to sprite scale, compact silhouette, and clean alpha edges. Image 3 is the accepted iron sentinel atlas, used only as a guide to readable stepped contours and animation-cell clarity. Do not copy or include any reference character, prop, background, or design.
Primary request: create one new original forest mushroom monster, the same recognizable character in every pose. It is a squat cream-colored stalk creature with short root-like olive-green feet, tiny dark expressive eyes, and a broad deep coral-red / warm russet mushroom cap with a few pale cream spots. Keep the cap, face, proportions, spots, and color placement consistent across every frame. The cap is part of the monster, not a hat or a separate object. It should read as a small game enemy with a mildly fierce but charming expression.
Scene/backdrop: completely transparent canvas, with no scenery or ground plane.
Style/medium: crisp hand-authored-looking pixel sprite art with stepped pixel-cluster contours, a restrained dark warm outline, compact layered shading, and the same friendly 2D game scale as the references. No 3D rendering, painterly blur, gradients, glow, bloom, or soft antialiasing.
Composition/framing: one exact 1374×1145 pixel transparent atlas, strict six columns by five rows, each of the 30 cells exactly 229×229 pixels, no gutters, padding between cells, dividers, grid marks, or outer frame. One whole mushroom creature centered in each cell. Keep every silhouette at least 16 fully transparent pixels inside all four edges of its own cell; never crop, touch, overlap, or cross a cell boundary. Keep the feet on one consistent baseline at local cell y=208 in every row, including the dead poses. Keep a compact in-game size, approximately 135 pixels wide and 155 pixels high at most inside each 229-pixel cell.
Row order, top to bottom: idle, walk, attack, hurt, dead. Use these poses and repeat the final useful pose exactly in unused cells: idle has two subtle breathing/weight-shift poses in columns 1–2, then repeat pose 2 in columns 3–6; walk has six distinct readable waddling steps with alternating feet and a small cap bounce in all six columns; attack has four clear poses (lowered anticipation, brace, cap-first forward headbutt lunge, recoil/recovery), then repeat pose 4 in columns 5–6; hurt has two readable flinch/recoil poses, then repeat pose 2 in columns 3–6; dead has four progressive topple/slump poses ending in a low still heap, then repeat pose 4 in columns 5–6. Keep all actions legible at the small runtime display size.
Color palette: deep muted coral/russet cap, pale cream spots and stalk face, olive-moss feet, dark umber outline, a few warm brown shadows. Keep red and green tones entirely inside the natural character silhouette; no colored pixels or halos outside it.
Materials/textures: simple cap shading and sparse crisp spots; no noisy speckles or isolated particles.
Text (verbatim): none.
Constraints: preserve the exact 6×5 equal-cell atlas, row order, frame counts and repeated final poses; true alpha outside each sprite; consistent design, scale, and baseline; no name or lettering in the image.
Avoid: red/yellow/green fringe, matte, halo, detached color specks, soft edge, blur, antialiasing, cast shadow, floor, background, checkerboard, cell borders, captions, labels, logos, watermark, extra monsters, humans, weapons, props, or effects.
```

Planned single targeted-repair prompt (use only if the generated candidate is structurally usable but needs a focused correction; actual repair wording and result will be recorded before any repair call):

```text
Use case: precise-object-edit.
Asset type: transparent sprite atlas repair.
Input image 1 is the new mushroom atlas to repair. The remaining attached local references are style/alpha references only; do not add or copy their subjects.
Primary request: make one narrowly scoped correction to the mushroom atlas while preserving the same design and all animation poses. First priority is to clean visible detached colored fringe and soft colored halos outside the natural mushroom silhouettes so those external pixels are fully transparent; use only neighboring natural cap/body/outline colors where an edge pixel belongs to the silhouette. Keep the mushroom itself unchanged.
Composition/framing: preserve the exact existing 1374×1145 canvas and strict 6×5 grid of 229×229 cells, all cell positions and row order. Keep every sprite fully contained with at least a 16-pixel transparent margin inside its cell and preserve the common local foot baseline at y=208. If the image is not already this exact size/grid, fit the existing frames into that grid without cropping any pose.
Constraints: preserve the cap, spots, face, colors inside the silhouette, all poses, exact repeated final frames, frame sequence, transparent canvas, and hard pixel-cluster style. Change only the specific defect identified for this repair. No redesign, new pose, extra prop, background, floor, text, grid marks, glow, blur, or watermark.
```

Generation result:
- Built-in ImageGen output: `D:\dev-data\codex-home\generated_images\01a14ca6-f044-72d0-9804-f51582846b03\exec-e6ed49f8-5a2d-4e88-bcfc-e0785c02edb6.png` (created 2026-10-18 09:42:16 Asia/Hong_Kong).
- Unmodified source copy: `art-source/actors/monsters/mushroom/mushroom-atlas-attempt-05.png`.
- SHA-256 for output and source copy: `AB6682DE0C27EB3E065FFA10489D8D8C7F41FE936728727D009683E8BD8B1DC6` (equal).
- Dimensions 1374×1145 RGBA; divisible into 6×5 cells of 229×229; all four canvas corners alpha 0. Full-image alpha counts: 823,027 zero; 749,544 partial; 659 fully opaque. Red-dominant nontransparent pixels: 412,520 (mostly cap color; the visual rejection is based on the exterior fringe, not this whole-image count).
- Full-sheet view: all five action rows are present and recognizable, but visible red edge halos remain around the silhouettes. The per-cell alpha>8 bounds check found unsafe contact with cell edges: several attack poses touch left/right cell boundaries, and rows 1–4 touch cell top or bottom edges; required 16-pixel safe margins are not met. The composition is therefore not eligible for runtime as-is.

Executed one targeted-repair prompt (full text):

```text
Use case: precise-object-edit.
Asset type: transparent sprite atlas repair.
Input images: Image 1 is the local mushroom-atlas-attempt-05 target. Images 2–4 are the accepted slime, sentinel, and traveler style references only; do not add or copy their subjects.
Primary request: perform one focused correction to the existing mushroom sprites: remove the visible red fringe, colored halo, and detached edge pixels outside each natural silhouette, and make the affected external pixels fully transparent. Preserve the natural red/russet color inside each mushroom cap. Also fit any pose that touches or crosses a cell edge fully inside its own existing cell by uniformly reducing that pose only as much as needed and recentering it. Do not redraw the atlas or invent new poses.
Composition/framing: keep the exact 1374×1145 canvas and strict 6-column by 5-row grid of 229×229 cells; preserve all current cell positions and row order. Every sprite must have at least 16 pixels of fully transparent safety margin on all four sides inside its own cell. Keep the standing foot baseline consistent at local y=208 for idle, walk, attack, and hurt poses; align the lowest point of each dead pose to the same baseline. Keep each sprite's proportions and contained within its original cell.
Constraints: preserve the mushroom design, cap, spots, face, palette inside the silhouette, all five action sequences, frame order, and final-pose repeats in unused cells. Keep true alpha outside sprites, crisp stepped pixel contours, and legible poses. Change only external fringe/edge pixels and the scale/placement needed for cell containment. No background, floor, cast shadow, glow, soft blur, antialiasing, grid marks, text, labels, watermark, props, extra character, or redesign.
```

Repair result:
- Built-in ImageGen output: `D:\dev-data\codex-home\generated_images\01a14ca6-f044-72d0-9804-f51582846b03\exec-dcc1a23d-49d4-4847-9ec0-d47929484c78.png` (created 2026-10-18 09:47:25 Asia/Hong_Kong).
- Unmodified source copy: `art-source/actors/monsters/mushroom/mushroom-atlas-attempt-06.png`.
- SHA-256 for output and source copy: `81B0A3037584B0C70E9B273D4E89244F46434421064FE15692615C9EF4472B89` (equal).
- Dimensions remain 1374×1145 RGBA, divisible into 6×5 cells of 229×229; all four corners alpha 0. Full-image alpha counts: 824,771 zero; 748,221 partial; 238 fully opaque. Red-dominant nontransparent pixels: 391,376.
- Full-sheet view still shows conspicuous bright red edge halos and detached red pixels; the repair made the visible fringe worse. Alpha>8 per-cell bounds still have less than 16 pixels of safety margin in every cell: rows 1–3 touch cell bottoms/tops, row 4 touches the cell tops and leaves only 7 pixels at the bottom, and the dead-row poses have only 2–17 pixels of horizontal margin. The required containment and edge checks fail despite correct total dimensions and grid divisibility.
- Decision: `UNFINISHED`, source-only. The single allowed repair is exhausted. No copy was placed under `public/assets/actors/`, and no `actor:mushroom` image/animation entry was added to `creature-subset-manifest-v1.json`. Attempts 05 and 06 are both preserved unchanged; no further generation or repair will be made for this task.
