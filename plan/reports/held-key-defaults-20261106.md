# 長按鍵預設動作 — beta.73

2026-11-06 01:12 HKT，本機`1.0.0-beta.73`，未發布。

既有KeyboardInputState忽略repeat命令時同時回傳preventDefault:false，導致方向／空白等遊戲綁定的重複事件可交回瀏覽器。本輪對已識別的遊戲動作回傳preventDefault:true，維持首次按下才發命令。文字輸入、UI一般控制、失焦與未綁定鍵仍不攔截；UI Escape仍只處理一次。沒有新增連發或改變移動速度。

`tests/key-bindings.test.ts`7/7、typecheck、build通過。兩項新案例涵蓋長按後不再觸發跳躍／攻擊／互動／面板及輸入焦點邊界。未開browser，因此不宣稱已實測主頁捲動；沒有content／全回歸／ZIP／平台驗收。成品`dist/`，JS`index-Cb6RyQQr.js`；Node24.19.0，不作24.22.1+發布環境符合聲明。

開工前重新經GitHub網路取得Playroom main範本及七份規格，內容與01:07完整已讀全文相同。固定ID、相對路徑、SDK及可讀1–5／寫5存檔宣告保持。
