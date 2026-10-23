# beta.5 發布驗證

- 日期：2026-10-24（香港時間）。已重新完整讀取 Playroom 範本及七份 main 線上規格。
- 遊戲 ID：brightwood-first-oath；版本 1.0.0-beta.5；存檔格式 1，Manifest schema 2，desktop。
- 發布目標：https://github.com/TommyLamm/brightwood-first-oath/releases/tag/v1.0.0-beta.5
- 本機靜態成品：dist/；ZIP：artifacts/game.zip。

## 已通過

- npm run typecheck
- npm test -- tests/world-map.test.ts tests/journal-selection.test.ts（2 檔、5 項）
- npm run check:content
- 本次樣式修正後的 npm run build，以及固定 tools 1.1.0 pack / validate（見上一輪輸出，程式及成品沒有再變更）。
- git diff --check
- Playwright 可見 Chromium：最新建置透過版本子目錄與不同 port 的跨來源 sandbox iframe 開啟。
- 世界地圖頁籤在 1440×1000、1024×768、960×540：文字行數 1、有足夠內容寬度、按鈕在畫面內；1440 實機截圖 output/playwright/release-tabs-1440.png。
- 點選世界地圖頁籤成功開啟地圖；Esc、C、J 可切換能力與任務面板。
- 960×540 能力頁插畫不覆蓋標題、無橫向溢出；任務頁有 8 站路線、缺圖 0、無橫向溢出；console 0 errors / 0 warnings。

沒有重跑全套回歸、完整通關、正式雲端存檔、音效、平台全螢幕或手機實機驗收。此為 beta Release；未操作 Playroom 人工驗收或平台上架。發行 notes 詳列範圍與限制。