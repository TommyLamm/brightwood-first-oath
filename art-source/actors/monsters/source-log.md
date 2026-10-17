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
