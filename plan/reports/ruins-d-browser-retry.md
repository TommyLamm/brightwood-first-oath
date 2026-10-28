# 遠古遺跡 D：瀏覽器主線續作報告

日期：2026-10-26（香港時間）。Owner：`brightwood-beta15-retry-20261025`。本批只操作凍結的 beta.15 成品及自有 localhost origins；未修改 `src/`、`dist/`、ZIP 或正式平台資料。

## 讀取文件與驗收範圍

- 已讀 `plan/15-ruins-acceptance-and-package.md` §5–§6、`plan/reports/ruins-d-browser-retry-dispatch.md`、`plan/reports/ruins-c-handoff.md`、`plan/reports/ruins-c-world.md`，以及 Playwright skill、CLI、running-code 與 storage-state 參考。
- Playroom 線上模板與其規格由主代理在本 goal 開始時完整讀取並交接，本 owner 沿用已轉述要求，沒有重讀規格文件。
- 本批驗收：正常 camp→Town 手動領取 q19 並保存 raw；使用獨立合法 `boss-retry-ready` fixture 實際西返、重進；同一 q19 完成進度由 1280×720 調整至 960×640，檢查 Esc 暫停／恢復與進度；核對 versioned／preview-shaped 相對資源路徑及 console／資源錯誤。

## SUT 與 session 恢復

- 舊 Playwright session `brightwood-beta15-retry-20261025` 已不存在。舊 ownership 記錄 PID 4164 顯示 running，但 PID 查無程序，指定 ports 52667、52668 各自回覆 `ECONNREFUSED`；保留舊 ownership，不修改它。
- 建立本 owner 專用 session 與靜態 harness：PID 30448、父頁 `127.0.0.1:53017`、遊戲 origin `127.0.0.1:53018`。harness 只讀 `artifacts/ruins-d/dist/`。`game.json` 確認 ID `brightwood-first-oath`、版本 `1.0.0-beta.15`、entry `index.html`；凍結 dist tree SHA-256 為 `8789d7abde697223beb41fcc2cd4fe5077869848d579b52691035fd8311f715a`，未重新 build。
- Versioned parent／iframe 路徑實際載入遊戲。Preview-shaped iframe 直接回應 `game.json` 200，manifest ID／版本／entry 正確；相對 entry script `assets/index-Db4FNXmc.js` HEAD 200。該 preview 頁共有 146 個 preview-path 靜態請求，146 個均為 200；本 session 列出的 210 個請求均為 200，沒有遊戲資源失敗。

## R1：q19 正常手動回報

本次不是從原始 R1 連續遊玩：quota 中斷後，q17–q18 已由合法 synthetic checkpoint 分段重建；此續作從已保存的 q19-active checkpoint 開始。q15／q16 的真實 UI 流程及 q17／q18 的先前分段結果依主代理交接保留，本 owner 沒有重跑它們，也不把本批描述為無縫原始通關。

- q19-active raw 在當前 rules、world、save validators 下均通過；初始 SHA-256 `58d9e931db0f60828644393e2b5c8cfd2d3b2b15a292466efee2fb749cc0eb18`。q17、q18 均 claimed，town 已 visited，q19 active，location 為潮痕營站／left。
- 以一般方向鍵走到 camp 的 Town portal，按 Space 進木葉鎮；再以方向鍵走到 x=700 的岩嶺教官，按 Space 開啟對話並點擊一般「領取任務獎勵」按鈕。任務卡先顯示「任務完成，向岩嶺教官回報」；領取後 q19 claimed，金幣 4,900→5,200，location 記為 town／ruins-camp。
- 領取後立即匯出完整 browser canonical raw：[q19-claimed-canonical-save.json](../../artifacts/ruins-d/browser/retry-20261025/q19-claimed-canonical-save.json)，2,142 bytes，SHA-256 `df4b00ccd49c03dc24dbc6f9ce74a2928909cb1ab59fe9a42255bd60236928ee`。這個 compact raw 通過當前 rules、world、save validators。
- 與 q19-active raw 比對後，完整 `data` 在只套用預期變化（coins、location、q19 status／counter）後深度相同。claimed raw 有 q01–q19 共 19 筆任務；q17／q18 claimed；背包仍有 oathfarer-circlet，帽欄仍為 iron-helm；`bossDefeated=true`、`chapterComplete=false`。2,142 bytes 與原本 3,866 bytes 的差別是 pretty JSON 與 compact browser raw，不是資料截斷或進度重設。
- q19 回報畫面證據：[47-q19-claimed-town-1280x720.png](../../artifacts/ruins-d/browser/retry-20261025/47-q19-claimed-town-1280x720.png)。Town 接近教官的畫面：[46-q19-town-after-walk.png](../../artifacts/ruins-d/browser/retry-20261025/46-q19-town-after-walk.png)。

## R2：獨立 fixture 西返及重進

- 使用獨立 fixture `artifacts/ruins-d/fixtures/boss-retry-ready.json`（SHA-256 `dcfd40ac7b555a3d0e1bd0887656ca1d41ee9bea968a168843f5784cc8cc504a`）。載入前當前 rules、world、save validators 均通過；起點為誓鐘內殿／entry，q18 active 且 `ruins-bell-keeper: 1`，boss flag 為 true。該 fixture 不是 R1 連續存檔。
- 在 entry x=160 與西 portal x=100 的 60px 距離按 Space，正常退回回聲長廊；在 right spawn 再按 Space，正常進入誓鐘內殿。沒有重打首領，也沒有繞行其他地圖。
- 重進後 raw：[r2-after-reentry-canonical-save.json](../../artifacts/ruins-d/browser/retry-20261025/r2-after-reentry-canonical-save.json)，1,975 bytes，SHA-256 `539cf89a8a40bbc703b9722bcade19e2871f4361e168ad2fa1249c778a5be76b`。當前三項 validators 通過；`data` 與 fixture 完全相同，location 回到誓鐘內殿／entry，q18 及兩個 flags 未變。

## Resize、暫停與資源檢查

- q19 claimed、Town／5,200 金幣進度在 1280×720 畫面後，於同一 browser context 調整至 960×640。較小 viewport 的 HUD 與操作按鈕仍可讀取；按 Esc 顯示「冒險已暫停」，再按 Esc 恢復。恢復後仍為木葉鎮、5,200 金幣且存檔狀態正常。
- Versioned 與 preview-shaped 路徑都載入 beta.15 iframe。Preview 的 `game.json` 與 entry script 回應 200；146 個 preview 靜態請求全部 200。
- Console 有 Phaser 啟動 log、harness 明確要求的 `allow-scripts`＋`allow-same-origin` sandbox warning，以及父頁 `127.0.0.1:53017/favicon.ico` 404。該 404 是父頁 favicon，不是遊戲 origin 的資源錯誤；遊戲 bundle／preview 靜態請求沒有失敗。

## 未驗證項目與清理

- 未聆聽 phase 2 音樂／復原短音，未做 45–80 秒或首次觀察 60–120 秒不間斷量測，未驗證瞬時 phase／攻擊清理時序；本批沒有進入首領戰。
- 正式平台原生全螢幕、平台 SDK／雲端存檔、正式帳號與發布仍未驗證；localhost preview-shaped URL 只證明相對資源路徑。
- 已關閉本 owner Playwright session，並只對 PID 30448 發送 SIGINT。harness ownership 記錄為 stopped；獨立確認 PID 30448 absent，ports 53017／53018 各自回覆 `ECONNREFUSED`。起始與停止 ownership copy、清理驗證保存在 `artifacts/ruins-d/browser/retry-20261025/`；舊 PID 4164 記錄及其他 session／port 未動。
- 沒有新增或執行 automated tests，沒有 source/build/package/ZIP 變更。
