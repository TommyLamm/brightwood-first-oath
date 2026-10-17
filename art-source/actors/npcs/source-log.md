# NPC 圖集來源紀錄

每張正式 NPC 圖均明確以本地主角風格參考 `F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png` 生成，保留每輪原稿在專案 `art-source/actors/npcs/`；runtime 只指向入選圖。

## 森芽 (`actor:guide`, `npc:guide:idle`)

狀態：正式入選，第二次（一次局部修正）版本通過。runtime：`public/assets/actors/npcs/guide-idle-v1.png`。

生成 prompt 全文：

> Create a transparent pixel-art NPC idle spritesheet for the original side-view game. Use the attached local short-haired swordsman as the primary style reference for pixel scale, proportion, palette, and outline; the sentinel is secondary rendering reference only. Do not copy or include either reference. Character: 森芽, a friendly young forest scout/guide with short chestnut hair, teal-green hooded cape over a cream tunic, small belt pouch, warm approachable face. No visible text or labels. Exact atlas layout is 2 equal square columns by 1 row, transparent background, no gutters. Show the same full-body character in two subtly different idle poses: pose 1 relaxed, pose 2 gentle breathing and a small hand gesture; keep feet on the same baseline, same facing direction and scale, centered within each square cell with transparent margin. Crisp readable warm pixel art consistent with the game's hero reference; true alpha outside the character; no colored fringe, no glow, no red matte. No background, checkerboard, scene, props beyond the small belt pouch, extra characters, text, watermark, or label.

局部修正 prompt 全文：

> Repair the first attached two-frame guide NPC spritesheet while preserving the exact 2 equal square columns by 1 row layout, canvas bounds, positions, costume, face, identity and both poses. Use the second local short-haired swordsman only as style reference. Convert the character rendering to crisp, clearly visible hand-crafted pixel art that matches the attached game's pixel scale: hard pixel clusters, stepped contours, limited warm palette, no smooth airbrush or painterly gradients. Make the guide's actual body and clothing fully opaque with clean natural edges; only pixels outside each character silhouette should be transparent. Remove stray red/brown matte pixels outside the figures. Preserve the two subtle idle poses with identical baseline and scale. No new objects, scene, floor, text, labels, watermark, or extra characters.

檢視：
- 首次工具輸出：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-5a210ac5-884c-440c-9e61-9c41060ad540.png`
- 修正版工具輸出：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-ce0817fc-f007-4e53-bc86-61f227c1dc37.png`
- 專案圖：`art-source/actors/npcs/guide/guide-idle-attempt-01.png`、`guide-idle-attempt-02.png`、`guide-idle-v1.png`
- 修正版尺寸 1774×887，正好 2×1 等寬方格，每格 887×887；四角 alpha=0；兩格均完整、姿勢有細微差異、同朝向與足底基線；alpha 抽樣有大量高 alpha 主體區域，背景透明。輸出具清晰階梯輪廓及點陣色塊；外緣不存在明顯色暈。Runtime 與入選 source SHA-256 相同。
- 顯示 96×96、pivot (.5, 1)，兩格 idle 各 350ms 循環。

## 岩嶺教官 (`actor:mentor`, `npc:mentor:idle`)

狀態：正式入選，一次局部外緣修正後通過。Runtime：`public/assets/actors/npcs/mentor-idle-v1.png`。

生成 prompt 全文：

> Create one NPC idle atlas in the same original side-view pixel-art game. Use the local short-haired swordsman as primary style reference and the completed forest guide as secondary palette/style continuity. Do not include either reference character. Character: 岩嶺教官, a sturdy middle-aged sword instructor with short salt-and-pepper hair, a small neat beard, dark navy training coat with muted ochre trim, leather bracers, calm stern expression. He is friendly and authoritative, not hostile. No weapon in hands. Exact 2 equal square columns by 1 row, transparent background, no gutters. Two full-body idle poses of the same instructor: first arms relaxed, second one hand lifted slightly as if explaining a stance; same direction, baseline, scale, costume and face. Keep figure fully within each cell, centered with clear transparent margin; crisp pixel clusters, stepped silhouette and warm limited game palette, not smooth painted portrait. True alpha outside silhouette, clean edge no glow/matte/fringe. No scene, floor, checkerboard, text, label, watermark, extra characters, or props.

局部修正 prompt 全文：

> Make one narrowly targeted edge cleanup on the first attached 岩嶺教官 two-frame NPC atlas. The second local swordsman is only a pixel-art style reference; do not add him. Remove stray vivid red fringe pixels and red glow outside the natural dark outline of the instructor; make those outside pixels fully transparent or replace them with adjacent dark outline pixels. Preserve the two poses, same instructor identity, gray-streaked hair, small beard, navy training outfit, cell positions, exact 2 square columns by 1 row, dimensions, baseline, and transparent canvas. Do not alter pose, add props, text, label, background, or extra figures.

輸出及檢視：
- 首稿：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-61d1cd22-769d-4cf2-899d-954f52b1fa4c.png`
- 修正版：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-e2b42d79-10b5-402f-a37d-e66cd05ee3c8.png`
- 專案圖：`art-source/actors/npcs/mentor/mentor-idle-attempt-01.png`、`mentor-idle-attempt-02.png`、`mentor-idle-v1.png`
- 尺寸1774×887、格數正好2×1且四角 alpha=0，姿勢與人物身份一致；紅色 alpha>32 抽樣由25升至47，但總紅樣本由86降至66。完整查看修正版，沒有明顯外緣色暈，故保留為正式素材；source/runtime SHA-256 相同。
- 顯示96×96、pivot(.5,1)，兩格350ms循環。

## 木葉商人 (`actor:merchant`, `npc:merchant:idle`)

狀態：`UNFINISHED`，不進 runtime/manifest。原兩版之外新增一次不同提示生成及一次針對性修正，仍見清楚紅色輪廓殘留，依上限停止。

生成 prompt 全文：

> Create one NPC idle atlas in the same original side-view pixel-art game, using the attached short-haired swordsman as primary pixel-scale/style reference and the completed mentor as secondary rendering consistency. Do not include either reference character. Character: 木葉商人, a friendly traveling forest merchant with shoulder-length dark auburn hair tied back, layered moss-green and tan merchant clothes, a broad leather belt with small coin pouches, and a compact rolled pack on their back. Warm welcoming expression. Do not show signs, goods, or written prices. Exact layout: 2 equal square columns by 1 row, transparent background, no gutters. Two full-body subtly different idle poses of the same merchant: first relaxed stance holding hands low, second one hand raised in a small welcoming gesture; same facing direction, costume, baseline and scale. Center each character wholly inside its own square cell with ample transparent margin. Clear pixel-art clusters and stepped edges, limited warm palette, game sprite rather than portrait. True alpha outside the silhouette, no red fringe/glow/matte. No scene, floor, checkerboard, text, label, watermark, extra characters or props beyond the small back pack and belt pouches.

局部修正 prompt 全文：

> Clean only the visible vivid-red fringe pixels outside the two merchant silhouettes in the first attached sprite sheet. The second local short-haired swordsman is only a style reference; do not add that character. Make stray external red pixels transparent or replace with neighboring natural dark brown outline pixels. Keep reddish hair that belongs inside the merchant character unchanged. Preserve exact canvas size and strict 2 square columns by 1 row, both idle poses, costume, face, baseline, colors, and all cell positions. Maintain crisp pixel-art edges and true alpha outside each silhouette. No redesign, no added scene, signs, text, watermark, or extra characters.

輸出及檢視：
- 首稿：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-fa7fcaa1-4e98-4344-b281-e0815f3558af.png`
- 修正版：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-b4e7108e-f1d0-45c6-8c01-b0158752d252.png`
- 專案圖：`art-source/actors/npcs/merchant/merchant-idle-attempt-01.png`、`merchant-idle-attempt-02.png`
- 尺寸為1774×887，可整除2×1。格子中人物身份、動作與足底位置可辨，但修正版預覽仍有清楚紅色外輪廓殘留，不入遊戲。

第二輪生成 prompt 全文（使用 built-in ImageGen、`transparent_background: true`，並以 `F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png` 作唯一風格參考）：

> Use case: illustration-story. Asset type: production NPC spritesheet for a side-view pixel-art game. Create the missing wooden merchant NPC idle atlas, named 木葉商人 in project data; do not render any name or writing. Use the explicit local short-haired swordsman image only to match pixel scale, warm palette, face proportions, and stepped contour language. Do not include or imitate the swordsman's outfit, weapons, pose sheet, or background. Subject: one friendly traveling forest merchant with shoulder-length dark auburn hair tied back, layered moss-green and tan merchant clothes, a broad leather belt with a few small coin pouches, and a compact rolled pack on the back. Full body, facing right in both cells. Style: crisp hand-crafted pixel art with a small deliberate pixel grid, visibly stepped contours, hard opaque color clusters, limited warm palette, dark natural brown outline pixels, flat sprite shading only; no painterly texture, airbrush, blur, glow, or soft edge antialiasing. Composition: exact 2 equal square columns × 1 row, no gutters or borders. Each cell contains the same single full-body merchant centered at matching scale with ample clear transparent margin. Cell 1 relaxed stance with both hands low. Cell 2 a small welcoming wave. Preserve same face, costume, pack, direction and foot baseline; only the arm/upper-body idle pose changes. Keep both silhouettes entirely within their own cell. Preserve real alpha outside each silhouette; body pixels fully opaque. Keep reddish hair confined to the hair silhouette. Use natural deep brown/green edges instead of any red or magenta matte. Deliver only the sprite sheet on transparency. Avoid red/green fringe, color spill, checkerboard, white/black fill background, semi-transparent edge halo, shadows, extra props, shop signs, goods, labels, text, watermark, extra people, duplicated characters, mixed poses or cross-cell contamination.

第二輪局部修正 prompt 全文（以第二輪首稿及同一個本地主角風格參考作 `referenced_image_paths`，使用 built-in ImageGen、`transparent_background: true`）：

> Use case: style-transfer. Asset type: production NPC idle spritesheet correction. Repair only the rendered pixel treatment and transparent edge quality of the merchant atlas. Keep the first attached image's exact character identity, face, costume, pack, proportions, facing direction, two poses, cell positions, canvas bounds, and 2 equal square columns × 1 row layout. Keep the local swordsman reference only as pixel-style guidance; do not add or copy that character. Convert soft painterly shading into crisp game-sprite pixel art with deliberate hard pixel clusters, stepped contours and limited opaque color blocks matching the reference's pixel scale. Preserve all natural brown hair, green cloth, tan cloth and dark outline pixels inside the character silhouettes. Keep the exact same canvas, two square cells, baseline and cell contents. Outside both character silhouettes must be genuinely transparent. Keep body pixels opaque; use natural dark brown or dark green edge pixels. This is a narrowly scoped correction, not a redesign. Remove every vivid red/magenta pixel outside each silhouette and eliminate soft antialiased halos. Preserve natural auburn hair inside the hair silhouette without recoloring it. Retain the two quiet idle poses and clear transparent margin. Avoid any red matte fringe, glow, blur, airbrush, gradient, semi-transparent halo, background fill, checkerboard, crop, resize, reposition, props, extra characters, text, labels or watermark.

輸出及檢視：
- 第二輪首稿：`D:\dev-data\codex-home\generated_images\01a14b69-4e59-7f90-8f97-3b6ab315d981\exec-3c61c377-0e6d-4984-953d-423277558627.png`
- 第二輪修正版：`D:\dev-data\codex-home\generated_images\01a14b69-4e59-7f90-8f97-3b6ab315d981\exec-469fb1cf-d92e-4dfe-b869-70b93cd760a2.png`
- 專案來源圖：`art-source/actors/npcs/merchant/merchant-idle-attempt-03.png`、`merchant-idle-attempt-04.png`；兩張均為1774×887，2×1格、四角 alpha 均為0。人物身份、姿勢及基線可辨，但修正版仍有明顯紅色外緣像素及柔化陰影，未達清晰硬邊像素風格；不複製至 runtime，也不新增 manifest entry。第二輪後依每項最多一次新生成及一次局部修正的限制停止。

## 晨露 (`actor:healer`, `npc:healer:idle`)

狀態：正式入選，一次針對外緣的局部修正後通過。Runtime：`public/assets/actors/npcs/healer-idle-v1.png`。

生成 prompt 全文：

> Create one original NPC idle atlas for the same side-view pixel-art game, using the local short-haired swordsman as the primary pixel-art style reference and the completed guide as secondary style consistency. Do not include either reference character. Character: 晨露, a gentle village healer with long dark-teal hair in a simple braid, pale cream and soft sage-green healer's robe, small waist satchel with two tiny colored potion vials, kind calm expression. Keep the potions attached to belt, no magical effects. Exact 2 equal square columns by 1 row, transparent background with no gutters. Two full-body idle frames: first standing gently with hands resting, second small breathing motion and one hand near the satchel; same face, direction, costume, baseline and scale. Center each full figure wholly within its own square cell, leaving transparent padding. Crisp pixel-art clusters with stepped contours, restrained warm/green palette matching the game, no smooth painted portrait. True alpha outside character, clean natural edge, no red matte, glow, or fringe. No room, floor, checkerboard, text, labels, watermark, extra characters or separate objects.

局部修正 prompt 全文：

> Make one narrow edge cleanup on the first attached two-frame healer NPC atlas. Use the second local swordsman only as pixel-art style reference; do not add it. Remove any stray red or bright colored fringe outside the healer's natural dark-green/brown outline by making external pixels transparent or matching nearby outline pixels. Preserve the intended red and blue potion contents attached to the belt. Keep the exact 2 square columns by 1 row, canvas size, both poses, braid, pale healer robe, potion satchel, cell placement, facing, baseline and scale. Keep crisp pixel-art edges and true alpha outside each silhouette. Do not add scenery, effects, text, labels, or extra figures.

輸出及檢視：
- 首稿：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-cae8176d-b004-4e8d-94ec-e91cc9eb8674.png`
- 修正版：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-c1e49f0b-3646-4365-9d84-769f786e1693.png`
- 專案圖：`art-source/actors/npcs/healer/healer-idle-attempt-01.png`、`healer-idle-attempt-02.png`、`healer-idle-v1.png`
- 修正版尺寸1774×887，2×1方格，四角 alpha=0；人物全身置中，兩格姿勢細微差異、同底線。掛在腰間的紅/藍藥瓶不誤認為外緣瑕疵；完整預覽未見明顯色暈。顯示96×96、pivot(.5,1)，350ms循環。source/runtime同檔複製。

## 礦道守望者 (`actor:keeper`, `npc:keeper:idle`)

狀態：正式入選，一次局部邊緣清理後通過。Runtime：`public/assets/actors/npcs/keeper-idle-v1.png`。

生成 prompt 全文：

> Create one NPC idle sprite atlas for the same original side-view pixel-art game. Use the local short-haired swordsman as primary art-style reference and completed mentor as secondary style consistency. Do not include either reference. Character: 礦道守望者, an older mine-path keeper with a broad but gentle face, short gray hair and beard, dark ochre-brown work coat with slate-blue shoulder wrap, heavy gloves and boots, and a small brass headlamp attached to the belt (not glowing). Trustworthy guardian of the mine entrance. Exact sprite grid: two equal square columns by one row, transparent canvas, no gutters. Show the same full-body keeper in two quiet idle frames: first standing with hands resting on a wooden walking stick, second slight breathing motion and one hand raising the stick a little; same facing, face, costume, scale and foot baseline. Center each figure entirely inside its square with generous transparent margin. Crisp pixel-art clusters and stepped edges, limited warm game palette, not a smooth portrait. True alpha outside figure, natural dark outline, no red fringe/glow/matte. No mine or forest backdrop, no floor, checkerboard, text, sign, watermark, extra characters or props beyond walking stick and belt lamp.

局部修正 prompt 全文：

> Perform one narrowly scoped transparency cleanup on the first attached two-frame mine keeper NPC atlas. The second local short-haired swordsman is only the game's pixel-art style reference; do not include that character. Remove vivid red fringe and colored stray pixels outside the keeper's natural dark gray/brown silhouette, making those external pixels transparent or matching the nearby outline. Preserve the intended warm skin, gray hair, brown coat, wooden stick and brass lantern. Keep the exact 2 equal square columns by 1 row, canvas dimensions, both idle poses, costume, face, scale, direction and foot baseline. Crisp stepped pixel-art edges, true alpha outside. No background, floor, labels, text, watermark or extra props.

輸出及檢視：
- 首稿：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-071b3298-1448-4ac6-aa09-2ebf47c57c48.png`
- 修正版：`D:\dev-data\codex-home\generated_images\01a14a6f-0f39-7a42-98c8-ee8fcec1968c\exec-5da6b49b-c49f-4ffe-9545-e7b6262cc9a4.png`
- 專案圖：`art-source/actors/npcs/keeper/keeper-idle-attempt-01.png`、`keeper-idle-attempt-02.png`、`keeper-idle-v1.png`
- 修正版1774×887，2×1、透明角，足底位置與兩姿勢可辨。紅色抽樣由29降至22、alpha>32樣本16降至15，完整預覽未見明顯外緣色暈。正式 source/runtime SHA-256 相同，顯示96×96、pivot(.5,1)、兩格各350ms循環。
