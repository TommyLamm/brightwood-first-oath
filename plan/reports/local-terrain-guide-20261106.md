# 地形導覽 — beta.75

2026-11-06 01:33 HKT，本機`1.0.0-beta.75`，`dist/`已建置，未發布。JS`index-F9mx9vYW.js`、CSS`index-5cxzHtXt.css`。

## 改動

世界地圖工具列下新增可展開地形導覽，只提供目前／已探索區域。沿用18張MapDef的地面、可下跳平台、攀爬線、牆、居民與出口座標；N／P文字圖例列名稱及實際通行條件，角色用菱形標記。這是方向與高低示意，橫縱非等比例。

`UiSnapshot.playerPosition`複製即時位置，不進存檔。`updateLocalMapPlayer`只更新標記，不重建atlas／重置details、焦點或捲動。其他區域不顯示主角標記；未探索地形不揭露。沒有傳送命令、怪物位置、任務與存檔規則變更。使用原生HTML／SVG／CSS，沒有外部或點陣資源。

參考[Microsoft XAG112](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/112)對地圖補充文字清單的建議，不宣稱符合整套可及性規範。開工前重新經GitHub取得Playroom範本及七份規格，與已完整讀取全文一致。固定ID／相對資源／SDK與可讀1–5寫5保留。

## 驗證

- 使用既有`C:/Users/Tommy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`，實測24.22.1。`tests/local-map.test.ts`4/4、typecheck、build通過。
- 一次隔離headless:true Chrome：`localmap-beta75-20261106-01`，1280×720再640×480（遊戲仍16:9）／DPR1／43788。
- 正常建Map QA；鍵盤Enter展開；實際ArrowRight令marker.left由12.7917%到16.1426%，原details仍連接／open，scrollTop維持0。
- 營地地面1／平台1／攀爬1／居民1／出口1與資料一致。選未探索木葉鎮時沒有導覽；定位目前區域可再展開。
- 1280／640橫向溢出皆0；640局部圖已視審，地形及不同形狀標記可辨。正常垂直捲動保留。
- 頁面／console／request／HTTP錯誤皆0。核對後刪Map QA，具名session／server exec20099正常關閉；相符程序0、43788 listener0。
- [證據目錄](../../output/playwright/localmap-beta75-20261106-01/)保留runtime-summary、腳本／log／storage／cleanup及[局部圖](../../output/playwright/localmap-beta75-20261106-01/camp-terrain-640-review.jpg)。

未跑全回歸、content（資料未改）、ZIP／平台／帳號／雲端。18張地圖只有座標投影測試，實畫僅營地；高DPI及讀屏未驗。較早檢查的Node24.19.0界線不因本輪改用24.22.1而回溯改稱通過。
