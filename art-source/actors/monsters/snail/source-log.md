# 苔殼蝸牛素材來源紀錄

## actor:snail — attempt-05

狀態：UNFINISHED，僅 source。這是一次全新構圖，沒有使用 targeted repair。PNG 已按工具輸出原樣複製到專案來源目錄；未複製至 runtime，也未新增 creature subset manifest entry。

- 生成工具：內建 ImageGen，image_gen.imagegen；transparent_background=true。
- 工具原始輸出：D:\dev-data\codex-home\generated_images\01a14d21-3495-7050-91ea-252dfca325ac\exec-06f7a7db-b964-44b6-af53-50ec97371210.png
- 專案來源副本：F:\Desktop\MapleStory\art-source\actors\monsters\snail\snail-atlas-attempt-05.png
- 來源檔大小：1,340,550 bytes；尺寸 1373×1145；PNG 8-bit RGBA。
- SHA-256：C49109C1CE9C1AEA4C2BEA95804BA6F9533B370874C0383635EF42C1E54C0BF6。工具輸出與專案來源副本 hash 相同。

### 參考路徑

- F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png — 遊戲角色的色盤、輪廓與插畫式點陣呈現參考。
- F:\Desktop\MapleStory\public\assets\actors\monsters\slime-atlas-v1.png — 怪物尺寸、像素群組與透明間距參考。
- F:\Desktop\MapleStory\public\assets\actors\monsters\sentinel-atlas-v1.png — 側視構圖與腳底基線參考。

三張本地圖均在生成前以 view_image 實際檢視，並以絕對路徑傳入 referenced_image_paths；提示明確禁止把任何參考圖中的角色、怪物、道具或場景帶入畫面。

### 新構圖策略

舊 snail 素材多採奶油色身體和較高的殼形，並在輸出後嘗試清除紅邊。本次改為低伏、橫向身體、寬闊棕色螺殼和奶油色殼緣；以低飽和苔綠身體及緊湊角色輪廓區別舊構圖。提示新增每格固定 229×229、16px 四邊安全區及 y=208 腳底線，先約束構圖而非生成後修邊。這是新生成，並非舊圖編輯。

### 生成 prompt 全文

~~~text
Use case: stylized-concept
Asset type: production 2D game enemy animation atlas for the existing side-view pixel-art adventure.
Input images: Image 1 is the local traveler style reference, used only for the game's warm illustrated pixel-art presentation and dark outline. Image 2 is the accepted forest slime atlas, used only for monster scale, compact pixel clusters, and transparent spacing. Image 3 is the accepted iron sentinel atlas, used only for side-view framing and consistent feet baselines. Do not copy or include any reference character, enemy, prop, scene, or background.
Primary request: create one fresh, clearly recognizable small moss-shell snail monster, with a new low, horizontal silhouette. Its body is muted olive-moss green and hugs the ground; two short forward eye stalks carry small dark eyes; one broad chestnut-brown spiral shell sits low on its back, with a clean pale-cream rim and a few muted moss patches integrated into the shell. Keep the same shell spiral, facial details, proportions, and restrained palette in every frame. The attack is a short body-first bump, not a projectile or separate effect.
Scene/backdrop: genuinely transparent canvas only. No floor, cast shadow, scenery, or ground line.
Style/medium: crisp, hand-authored-looking pixel sprite art with stepped pixel-cluster contours, solid color groups, a clean dark umber outline, and simple warm shading consistent with the provided game assets. Use hard pixel edges and true alpha outside each sprite; no painterly blur, gradients, soft antialiasing, bloom, glow, or fuzzy edge treatment.
Composition/framing: exact 1374×1145 px canvas, divided into a strict 6-column × 5-row grid of exactly 229×229 px cells; no gutters, dividers, grid marks, outer frame, or extra margins. Place one complete snail in each cell. Keep each snail compact and low, no more than 190 px wide and 145 px high. Center each pose horizontally. Preserve at least 16 fully transparent pixels on all four sides of every cell; no part of a sprite may touch or cross a cell edge. Keep the feet and lowest point of every pose on the same local baseline y=208 in its cell, including the dead poses. The snail must remain fully readable at 96×96 runtime display size.
Row order, top to bottom: idle, walk, attack, hurt, dead. Effective frame counts by row are 2, 6, 4, 2, 4. Idle: two nearly identical but clearly distinct breathing poses in columns 1–2; repeat pose 2 exactly in columns 3–6. Walk: six distinct slow crawl poses, shifting the two feet and eye stalks while preserving the shell silhouette. Attack: four readable body-bump poses (lower and coil, lean forward, short forward bump, recoil); repeat pose 4 exactly in columns 5–6. Hurt: two recoiling poses; repeat pose 2 exactly in columns 3–6. Dead: four progressive slumps ending as a small still side-lying snail; repeat pose 4 exactly in columns 5–6. Keep action direction and character identity consistent. No additional animation states.
Color palette: low-saturation olive/moss green body, chestnut/dark-brown shell, pale cream shell rim and small natural highlights, dark umber outline. Keep every color within the natural snail silhouette. No red, yellow, neon, or colored outer halo.
Materials/textures: simple pixel-cluster shell spiral, a few discrete moss patches, minimal body shading, readable dark eyes. Avoid noisy speckles and detached pixels.
Text (verbatim): none.
Constraints: preserve the exact 6×5 grid, 229×229 cells, row order, effective frame counts, repeated final poses, fully transparent outside, 16 px safety margin, consistent baseline, and one coherent snail design.
Avoid: any reference image content in the output, extra characters or creatures, weapons, objects, detached particles, red/yellow/green fringe, colored matte, halo, glow, antialiasing, soft alpha, blur, floor, ground plane or line, background, checkerboard, grid lines, captions, labels, logos, watermark, or cropped poses.
~~~

### 檢視與驗收

- 尺寸檢查：1373×1145；width mod 6 = 5，height mod 5 = 0。寬度不是 6 的倍數，不能切成六個相等整數寬度格，6×5 格線驗收失敗。
- PNG alpha：alpha=0 為 932,316 pixels，partial alpha 1–254 為 638,942，alpha=255 為 827；四角 alpha 均為 0。大量半透明邊緣且全幅檢視可見紅色外緣殘留，不符合乾淨硬 alpha。
- 因寬度無法整除，以下格界只用 floor 等分作診斷，不能作正式 cell 驗收：30 個近似格共 120 個邊中，110 個邊的非透明安全距離小於 16px；多格的最低非透明像素位於該近似格 local y=228。idle/walk/attack/hurt 各列近似最低點皆在 local y=228；dead 列範圍 local y=200–228，基線不一致。安全邊及基線檢查失敗。
- 全幅視檢：低伏蝸牛、棕色螺殼、苔綠身體與五列姿勢仍可辨；idle 有細微差異、walk 變化不足以清楚表達爬行，attack/hurt/dead 狀態大致可辨。輪廓有明顯紅色外緣及柔化的部分透明像素，不符合乾淨硬邊要求。
- 唯一一次新構圖已用完；不再對本候選做 targeted repair。只保留來源副本和此記錄。沒有 runtime PNG、animation entry 或完整 actors manifest 變更；creature subset manifest 保持不變。

只執行本圖的視覺檢查、PNG grid/alpha/bounds/baseline 診斷與 hash 比對。未跑 build、typecheck、browser 或全套測試。
