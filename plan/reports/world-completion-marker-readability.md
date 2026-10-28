# W03-02・霜松航標辨識收尾

日期：2026-10-27（香港時間）  
狀態：**SOURCE_READY／FOCUSED_PASS／beta20正常調查＋SOL_TARGETED_VISUAL_PASS**（視覺限本1280構圖）。

後續已完成：beta20中正常爬梯／接近／調查一次，q21counter1；同Sol確認唯一1280×720構圖名稱完整避開右手帳，接平台／梯頂關係合理、既有素材足夠。詳[新候選單點取證與Sol結論](world-completion-marker-visual-beta20.md)。下文尚待視覺是此source包當時狀態，不再代表本項未審。

## 改動

- 將 `frost-route-marker` 在 `frost-pine-pass` 的位置由 `(1910, 430)` 移至 `(1770, 430)`，只調整既有航標座標。
- 將 world validator 中航標專用的兩處精確座標契約同步到 `(1770, 430)`；精確 ID／地圖／任務目標與互動範圍限制維持不變。
- 兩個直接受影響的 q21 聚焦案例改為從 `worldCatalog.maps['frost-pine-pass'].npcs` 讀取航標位置，避免測試重複寫死座標。
- 沿用 `actor:ruins-stele` 石造物素材；本次沒有生成或改動圖像，也沒有改 HUD、平台、梯、怪物、入口、任務或存檔格式。

## 位置依據與畫面限制

- 新位置在既有高台 x=1710–1980、y=430 內，距西端 60；相對梯頂 x=1840 在左側 70。此為由梯頂接近時將航標放在角色左側的有界位置調整。
- 此圖的 NPC 清單只有航標；東西 portal 分別在地面 x=100、x=2060，與航標不重疊。附近巡邏蟹在地面 y=600，航標則在平台 y=430。這是靜態內容幾何核對，不代表實際攀梯、怪物行為或互動優先序的視覺／遊玩驗收。
- 原 Sol 在 1280×720 畫面觀察到：航標名稱約從 x=910 起，右上手帳約從 x=947 起，名稱被部分遮住；接地與石碑輪廓合理，沒有必須新造美術的證據。調整位置旨在增加與右上手帳的間距。
- 新座標仍需 Sol 在新候選畫面確認名稱與航標可見程度。本報告不宣稱已解決畫面遮擋、不代表所有視窗尺寸通過，也不替代 W03 其餘驗收。

## 檢查

- Node 24.22.1：`vitest run tests/integration/frost-quests.test.ts tests/world-region-sidequests.test.ts --exclude '**/.worktrees/**'`，2 個檔案、5 項測試通過；`tsx tools/check-content.ts` 的 rules 與 world 跨表驗證通過；`tsc --noEmit` 通過。
- 首次未加排除條件的 Vitest 路徑篩選也掃到 `.worktrees` 內舊副本，對它們的舊 q09／q11 fixture 斷言失敗；沒有修改那些工作樹。隨後明確排除 `.worktrees` 的工作區 q21 案例通過。
- 未執行：瀏覽器／新截圖、build、pack、全回歸；不發布或改 beta.19。
