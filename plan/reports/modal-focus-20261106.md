# 模態畫面鍵盤焦點 — beta.74

2026-11-06 01:22 HKT，本機`1.0.0-beta.74`，成品`dist/`，JS`index-XFZTe4zG.js`，未發布。

## 改善

標題、建角、暫停等screen card原本已宣告`aria-modal=true`，但Tab可走向遮罩後的控制。本輪用`screen-modal-focus.ts`管理：開啟時保留背景原有inert狀態並令其不可操作，焦點放入建角輸入或對話框；Tab／Shift+Tab在可操作控制中循環，關閉時還原背景與可用的原焦點。既有失焦後明確恢復與面板焦點還原保留。一般背包／手帳面板沒有改成模態。

參考：[W3C模態對話框模式](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)、[MDN inert](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert)。開始前重新取得Playroom範本與七份規格，與01:07完整已讀全文一致。固定ID／相對路徑／SDK／存檔可讀1–5寫5未變。

## 最小驗證與界線

- typecheck與build通過；Node24.19.0，不宣稱符合24.22.1+發布環境。
- 一個隔離Chrome headless:true session：`modal-beta74-20261106-01`，1280×720／DPR1／port43786。
- 正常UI建角Modal QA；21筆觀察涵蓋標題／暫停正反Tab、建角欄位初始焦點、遊戲背景恢復、手帳面板暫停及回到原`track-quest:q01`。頁面、console、request、HTTP錯誤皆0。
- 同時觀察到beta.71開始前header的computed visibility為hidden。沒有截圖，不擴大宣稱實畫視審。
- `finish-run.js`最後立即讀取時仍是命令尚未套用的暫停DOM；後續等待screen-layer hidden後確認還原成功，未改遊戲／未重跑前段。匯出時一次dynamic import受CLI VM限制，改用既有download方式保存；是工具腳本問題。
- [證據目錄](../../output/playwright/modal-beta74-20261106-01/)保留原始腳本／log／storage／runtime-summary及cleanup。只刪核對為Modal QA的合成存檔；具名close、專屬server Ctrl+C。
- 沒有新增DOM測試框架，未跑全回歸／content／ZIP／平台、真OS失焦、其他screen分支或讀屏軟體驗收。已通過檢查不重複。
