# 標題期間略過世界繪製 — beta.82

2026-11-06 02:58 HKT，本機`1.0.0-beta.82`，`dist/`已建置，JS`index-vJr1iKsy.js`，未發布。

WorldScene原本在返回標題後仍render舊世界，雖被DOM封面遮住。本輪沿用既有needsVisuals條件，將不需世界的場景visible設false並略過world resize／render；app.update仍在前面處理命令。開始／繼續會重新顯示世界，暫停等需世界背景的畫面保留。

已讀本地Phaser3.90的ScenePlugin／Systems／SceneManager原碼：visible只影響render，step依status執行。未使用scene sleep／pause，未量測FPS／耗電，不宣稱量化效能提升。

開工前02:55 HKT重新網路取得Playroom範本與七份規格，8/8與完整已讀全文一致。ID、相對資源、SDK及存檔可讀1–5寫5未變。

## 驗證

- Node24.22.1：typecheck／build通過。三行呈現流程改動，沒有新增unit套件或重跑既有passing checks。
- 一輪隔離headless:true Chrome、1280×720／DPR1／43796，正常建Title QA，CDP只讀scene狀態。
- 初始標題visible=false／active=true；開始後true／true；返回標題false／true且原map／renderer仍就緒；正常Continue後true／true、camp就緒。四階段status皆5，owner仍Title QA。
- 0page／console／request／HTTP錯誤，無截圖。按owner只刪Title QA；具名close、server exec6714 Ctrl+C，cleanup程序0／listener0。
- [證據](../../output/playwright/title-beta82-20261106-01/)保留runtime-summary／腳本／log／storage／cleanup。
- 未實機覆蓋建角取消／error／雲端載入分支、其他尺寸／高DPI／平台；沒有全回歸、content／ZIP／帳號驗收。
