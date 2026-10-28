# 遺跡司鐘者視覺驗收

日期：2026-10-26（香港時間）

## 範圍與隔離設定

- 僅檢視凍結的 `artifacts/overnight-20261026/portal-labels/dist`，遊戲 `brightwood-first-oath` 1.0.0-beta.18、schema 2、desktop、read 1–4/write 4；bundle SHA-256：`1c26346100c38d09beee5b7cc331210e29274ba1dc757c67021d9b3c302e6cab`。
- 依 `plan/reports/ruins-visual-approval-20261026.md` 所記使用者明確同意，在新建的隔離 origin `127.0.0.1:60188` 確認 localStorage 為空後，一次寫入已 catalog 驗證的 `boss-retry-ready.json` 原始文字。來源 SHA-256 為 `dcfd40ac7b555a3d0e1bd0887656ca1d41ee9bea968a168843f5784cc8cc504a`，3,514 UTF-8 bytes；寫入後及重新載入後讀回皆逐 byte 相等，接著按可見「繼續冒險」。沒有更改 fixture、source 或 frozen dist。
- 遊戲 ID、版本、schema 與 bundle hash gate 均通過。沒有 build、測試、pack、commit、push 或 publish。

## 可見結果

- **Phase 1 高重擊：** `approach2.jpg` 可見 boss 周圍紅褐半透明矩形與淡黃色邊框；`phase1-high-06.jpg`、`phase1-high-08.jpg` 保留警示到命中後畫面。該序列 HUD 從 HP 712 降至 655。這只證明畫面層級的提示／命中結果，不推論精確作用影格。
- **Phase 1 低掃：** `phase1-sweep-*.jpg` 與 `sweep-contact-check.jpg` 保留寬而貼地的矩形區域及同場後續畫面；該觀察窗 HUD 從 HP 655 降至 607。`sweep-contact-check.jpg` 另有敵人身上可見「暴擊 667」及縮短的 boss HP bar，證明一次玩家攻擊確實命中 boss。攻擊 active 的精確 sub-frame 未驗。
- **半血轉場：** `half-threshold.jpg` 的可見 boss bar 已略低於一半。`phase-transition-01.jpg` 可見 boss 鐘胸前青綠半透明光與淡色圓框；`phase-transition-07.jpg` 的後續抽樣中該圓光已消失，畫面出現新的低掃矩形提示。依可見畫面支持轉場中／轉場後的差異；截圖不能證明 sub-frame 精確的開始或結束時刻。首個約 3 秒採樣中有正常攻擊提示；未將它誤稱為轉場殘留。多留一段 1.7 秒無攻擊 follow-up，檔案見 `phase-transition-followup-*.jpg`。
- **結果畫面：** 一次正常戰鬥在 phase 2 以角色倒下結束。`terminal-result.jpg` 顯示「角色倒下了」及「返回木葉鎮／返回標題」，背景未見明顯矩形預警或青綠 phase 光圈殘留。這是死亡結果畫面，**不是勝利畫面，也不是勝利後再次挑戰司鐘者的重試入口**；因此勝利／首領重試畫面的清理未驗收。

## 證據與清理

完整截圖、採樣 JSON、fixture setup read-back、短錄影與服務記錄保存在 `output/playwright/ruins-boss-approved/`。重點檔案：

- `fixture-seed-readback.log`
- `phase1-high-batch.json`、`phase1-sweep-batch.json`
- `half-threshold.jpg`、`phase-transition-01.jpg`、`phase-transition-07.jpg`、`phase-transition-batch.json`
- `terminal-result.jpg`、`final-combat-batch.json`
- `ruins-boss-normal-run.webm`
- `harness-ownership-25376-started.json`、`harness-ownership-25376-stopped.json`

Named Playwright context `ruins-boss-approved-20261026` 已關閉。停止前確認 PID 25376 的命令列只指向本目錄的 `serve-beta18-boss-harness.mjs`；停止後 PID 25376 與其 60187、60188 兩個 loopback listener 均不存在。啟動與停止記錄分開保存。

本驗收只覆蓋瀏覽器可見畫面；不推論可聽音訊、正式平台／雲端／原生全螢幕、FPS 或 sub-frame 精度。
