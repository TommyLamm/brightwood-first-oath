# beta.5 瀏覽器檢視與返工

- 遊戲：brightwood-first-oath，1.0.0-beta.5，未發布。
- 日期：2026-10-24（香港時間）。已重新完整讀取線上 game-agent-template、game-development、command-contracts、game.schema.json、game-release.yml、playroom-sdk.js、sdk-versioning、save-compatibility。
- 發現：能力頁的圖片實際高 270px，但容器只有約 132px，插畫覆蓋能力名稱、數值與效果。
- 修正：src/ui/illustrated-panels.css 將圖片絕對定位於具有明確高度的插畫容器，避免圖片固有尺寸影響 grid；調整插畫區高度，保持 object-fit: contain。
- 保留原 ID、未發布 beta.5 版本、玩法、能力公式、存檔格式 1。

## 實際檢查

使用指定 Playwright CLI 開啟可見 Chromium，以暫時遊玩進入，沒有修改玩家存檔。

- 1440×1000 與 1024×768：目視查看世界地圖、能力頁、任務頁。小視窗長面板透過面板捲動存取。
- 點選霜雪群島，確認只顯示待開發資訊；點選未解鎖任務，確認顯示前置任務與等級條件。
- 能力規則展開、Esc 關閉、C/J/M 面板切換。
- 修正後能力圖片與文字不再重疊，修正前後截圖見 output/playwright/。
- 建置成品透過 /games/brightwood-first-oath/1.0.0-beta.5/ 子目錄，嵌入不同 port 的跨來源 iframe，使用 sandbox="allow-scripts allow-same-origin allow-pointer-lock" 及 allow="fullscreen; autoplay; gamepad"。確認三個面板載入與切換，目視確認能力修正。
- 瀏覽器 console：0 errors、0 warnings。
- npm run build、npm run typecheck 通過。
- 固定 Playroom tools 1.1.0 pack / validate 通過：artifacts/game-world-map-visual-beta5-reviewed.zip。
- git diff --check 通過。

本次只有 CSS 修正，沒有新增或重跑邏輯測試／全套回歸。沒有驗收完整通關、有 AP 時的加點、音效、全螢幕、正式雲端存檔或手機實機；沒有建立 Release 或平台上架。初期沙箱終端無回應，改由沙箱外執行同一 Playwright wrapper 完成檢視。此版本 CLI 不支援 network 指令，未以該指令取得網路清單。