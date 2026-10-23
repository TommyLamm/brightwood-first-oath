# 世界地圖與圖像化介面 · beta.5

- 遊戲 ID：brightwood-first-oath
- 本機版本：1.0.0-beta.5（未發布）
- 規格核對日期：2026-10-23（香港時間）。本次已讀 Playroom game-agent-template 與其中的 game-development、command-contracts、Manifest schema、release workflow、SDK、sdk-versioning、save-compatibility。
- 靜態成品：dist/。保留原有遊戲 ID、七張可遊玩地圖及存檔格式 1。

## 變更

世界地圖以完整群島插畫呈現。木葉島七區對應既有地圖；霜雪群島、黃金沙海、遠古遺跡明確標為「待開發」，僅能查看規劃資訊，不寫入存檔或新增可進入地圖。M 開關，點選查看區域；探索狀態與通道條件讀取實際存檔。日後新增新世界時建立獨立世界地圖。

能力頁 C 改為力量／敏捷訓練插畫、可用 AP／SP、圖示能力總覽與原有加點操作。詳細公式收進可展開說明，沒有更改能力公式。

任務頁 J 改為冒險插畫、八站主線路線、單一任務詳情、怪物／道具圖像、數量進度條、NPC 肖像、獎勵圖示。NPC 接取及領獎規則保留；未解鎖任務只顯示解鎖條件。詳細故事可展開，畫面更新會保留捲動與已展開說明。

## 素材

本次由 Luna Max 子代理分工，使用內建 ImageGen 生成圖片。三張介面插畫採每張圖一位子代理並行。Luna Max 是子代理設定，ImageGen 底層生成模型由內建工具控制。

- 世界底圖：public/assets/interface/world-map-background-v2.png
- 羅盤：public/assets/interface/map-compass-rose-v1.png
- 力量、敏捷、任務：public/assets/interface/illustrated/
- 完整 prompt 與來源：art-source/world-map/、art-source/illustrated-panels/

## 驗證

已通過：
- npm run typecheck
- npm test -- tests/world-map.test.ts tests/journal-selection.test.ts（2 檔、5 項）
- npm run build
- node tools/playroom/pack.mjs dist artifacts/game-world-map-visual-beta5.zip
- node tools/playroom/validate.mjs artifacts/game-world-map-visual-beta5.zip（固定 tools 1.1.0）
- git diff --check
- 目視檢查世界底圖與三張介面插畫。透明 PNG 的 alpha 由素材子代理確認。

依使用者最小驗證要求，未啟動瀏覽器、未跑全套回歸測試。瀏覽器版面、完整遊玩、跨來源 iframe、全螢幕及正式雲端保存均未驗收。ZIP 驗證只代表靜態包符合驗證器要求，不代表以上項目通過。沒有建立 GitHub Release，也沒有進行平台驗收確認或上架。

舊世界單島 v1 原稿保留在 art-source/world-map/brightwood-world-map-main-v1.png，未再放進 public/ 成品；來源記錄內的 v1 參考路徑是生成當時使用的原始路徑。
