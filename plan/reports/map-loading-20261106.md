# 地圖載入等待與恢復 — beta.76

2026-11-06 01:55 HKT，本機`1.0.0-beta.76`，`dist/`已建置，未發布。JS`index-ozmedQbR.js`、CSS`index-CxSfk5Xa.css`。

## 問題與改動

WorldScene原本每幀先推進GameApp，即使首張地圖圖片仍在非同步載入。現在視覺尚未就緒時只處理命令、不累積模擬時間；app另有執行期載入閘門，暫停世界／音訊並清除前後的瞬時輸入與跳躍記憶。畫面顯示地圖名稱、已完成／總素材檔數，下載完成後仍待地圖整理完才恢復。

首次失敗停在安全狀態，提供「重試地圖載入」與返回標題；requestId隔離過期進度／完成／失敗回呼。一般換圖失敗仍保留原圖並解除等待。標題不預載已存角色的地圖圖片。進度只計檔案，不宣稱位元組百分比。狀態不進存檔；固定ID、相對資源、SDK、可讀1–5／寫5未變。

先前唯讀審查：圖片已按地圖載入，並非一次讀完整manifest；beta.75成品374檔／159,993,110 bytes，manifest直引272條去重URL／116,612,219 bytes。差額包含其他成品資源與舊檔，不等同啟動下載量；本輪沒有修改打包篩選或刪來源。

開工前01:38 HKT重新經GitHub取得Playroom範本及七份規格，與完整已讀全文一致；未升工具或執行發布。

## 驗證

- Node24.22.1下新增5項載入安全案例＋既有1項retry gate。首次5/6通過，一項錯把整數遊戲時鐘當小數毫秒比較；只修正斷言、只重跑該1項通過。等待不走時間、恢復不補追、瞬時輸入／jumpAssist清除、進度界線、過期回呼、失敗／明確重試、標題離開與存檔隔離均有coverage。
- 最終typecheck及build通過，沒有重跑已過套件或全回歸。
- 一個隔離headless:true Chrome session `loading-beta76-20261106-01`，1280×720／DPR1／43790，正常建立Load QA。
- 正確路由場景：刻意等待實際使用的`env-village-ground-v1.png`，觀察39/62檔且canvas inert／焦點在dialog，截圖時52/62。該圖回503後，失敗卡含重試／返回；撤除路由再重試恢復遊戲，並可正常暫停／繼續。重載標題後有短觀察窗，未請求actors／environment PNG。
- pageerror0，另有**刻意的503 HTTP及對應1筆console error**，沒有其他失敗；不宣稱全部network／console零錯誤。
- 初始測試攔錯已不用的`env-tile-ground-v1.png`，實際沒攔到：先遇完成期間節點截圖detached，接續等失敗卡逾時。已保留原log，這兩次不算失敗恢復證據；改正路徑後才完成。沒有為測試設定錯誤修改遊戲。
- [證據](../../output/playwright/loading-beta76-20261106-01/)含原腳本／log／runtime-summary與[載入圖](../../output/playwright/loading-beta76-20261106-01/loading-page-review.jpg)。按owner只刪Load QA，具名close、server exec14741 Ctrl+C；cleanup相符程序0／listener0。

未實機重走一般跨圖失敗、所有map／高DPI／平台／帳號／雲端；沒有ZIP或content資料檢查（資料未改）。
