# beta.61 地圖材質實機驗收

2026-11-05（Asia/Hong_Kong）。狀態：完成，測試資源已關閉。

候選：`brightwood-first-oath`／`1.0.0-beta.61`，成品 `dist/`。
沿用上一輪已建置的 `index-DUD8m3mO.js`；本輪沒有修改遊戲程式、素材或候選版本。

## 範圍與方法

使用者於實作交付後明確要求「進行實機測試」。本輪使用 Playwright CLI 操作真正的
Chrome，明確 `headless: true`，沒有桌面瀏覽器視窗。

- Session：`terrain-biomes-20261105-01`。
- 本機 origin：`http://127.0.0.1:43766/`，候選目錄為 repository 的 `dist/`。
- 獨立 profile／config／log：`output/playwright/terrain-biomes-20261105-01/`。
- 實際 viewport 1920×1080，deviceScaleFactor 1，Canvas 同為 1920×1080。
- 遵循 AGENTS.md 已驗證的一般使用者環境啟動路徑，沒有重試已知受限 Chrome 失敗路徑。
- 使用全新測試 origin，起始正式 key 為 null，保留 `before.storage.json`。
  只向本輪 profile 寫入 QA 角色；沒有讀取或覆寫使用者既有瀏覽器存檔。
- 兩份 format5 QA 起點由既有 QA 基線產生，皆通過正式 `prepareSave` 驗證器。
  名稱 Terrain QA、Lv.30；必要前置任務已領取，以便有界測試。這不代表實際重玩任務流程。
- 森林與紅岩以 QA 存檔載入；礦坑透過遊戲中的正常 Space 傳送門互動進入。
- 移動、攻擊、上下攀爬和跳躍皆使用真實鍵盤輸入。
  CDP 僅唯讀查詢正式 Phaser Game、Scene 和 Sprite，沒有設置位置、改動物理狀態或呼叫移動捷徑。
  角色腳點由實際顯示圖格的 alpha 邊界與 Sprite transform 計算。

這是本機瀏覽器實機驗收，不是平台 iframe、全螢幕、雲端存檔或發布驗收。

## 操作結果

| 地圖 | 實際攀爬中腳點 (x,y) | 平台站立／跳回落地 y | 下攀到地面 (x,y) | 圖格覆蓋平台範圍 |
| --- | --- | --- | --- | --- |
| 嫩芽林道 | (600,549) | 490／490 | (600,600) | 400–800 |
| 赤岩山徑 | (950,525) | 440／440 | (950,600) | 800–1200 |
| 古礦入口 | (500,534) | 470／470 | (500,600) | 350–700 |

三個區域均確認：

- 正確使用各自主題的平台及藤蔓／繩子／礦工梯。
- 角色能上攀，移離攀爬線後由平台支撐，再跳躍並落回相同平台高度。
- 角色可下攀至原有地面 y=600。
- 實際 Sprite 裁切後的平台兩端及攀爬首尾與地圖範圍一致；中段沒有隨總高度拉伸。
- 檢視三張站立全圖與三張攀爬局部圖，未見明顯缺圖、裂縫或主題錯配。
  礦坑攀爬局部圖剛好處於正常怪物受擊閃爍；正式 renderer 會對角色及裝備套用
  invulnerable grace alpha，沒有把這一瞬間當作貼圖遺失。礦坑站立全圖的角色清楚可見。

正常傳送門：赤岩山徑 x≈2067.67，Space 後抵達古礦入口 x=100、y=600；
當前地形由 `env:ridge:*` 換成 `env:mine:platform`／`env:mine:ladder`，舊紅岩圖格未殘留。

六張 `*-biome-v1.png` 均由遊戲實際請求並回應 HTTP 200。
頁面錯誤、失敗請求、console error、HTTP≥400 均為零。
結果詳 `output/playwright/terrain-biomes-20261105-01/runtime-summary.json`。

## 測試調整與證據界線

- 最初測試選點 (80,350) 被既有 `.ms-action-bar` 透明覆蓋區擋住，Playwright 等待超時。
  唯讀量測後改點畫布中央 (960,400)，無須改遊戲 CSS 或繞過點擊檢查。
- CLI run-code 不提供 CommonJS `require`；QA fixture 從工作區編入測試腳本，沒有新增依賴。
  QA 建立腳本曾因自行設定 MP 超過上限而被驗證器拒絕，修正後才載入瀏覽器。
  以上是測試腳本問題，與遊戲 console 錯誤分開保存。
- 森林第一次下攀採 1px 容差，停在 y=599.5；檢圖期間角色再受怪物擊退。
  後續沒有把空閒時的地面狀態冒充完整下攀證據，而是只重做森林上攀／下攀終點，
  使用 0.1px 容差驗證 (600,600)，隨即暫停；沒有重拍截圖或重跑已通過的跳躍項目。
- 本輪只實測三張代表地圖的指定路線。菌傘深林、守衛祭壇和其餘平台／攀爬線未逐一實測；
  第一輪對所有本批地圖的幾何測試，與本輪代表路線實機證據分開記錄。
- 未新增遊戲測試碼，未重跑已通過的型別、建置與單元測試，亦未跑完整回歸、效能矩陣、
  其他尺寸／DPR、iframe／全螢幕或雲端帳號流程。沒有發布。

## 截圖與記錄

完整 PNG、QA fixtures、config、原始 storage、腳本與 log 都保留在
`output/playwright/terrain-biomes-20261105-01/`。

- `forest-edge-platform.png`／`forest-edge-climbing.png`
- `red-ridge-platform.png`／`red-ridge-climbing.png`
- `mine-gate-platform.png`／`mine-gate-climbing.png`
- 各圖對應 `*-review.jpg` 為必要檢視縮圖，長邊≤1280、JPEG 72。
- `candidate-fingerprints.json`、`environment.json`、`runtime-summary.json` 記錄候選及結果。
- 主要腳本：`runtime-helpers.js`、`test-forest.js`、`install-area-check.js`、
  `test-ridge.js`、`test-mine-transition.js`、`forest-descent-final.js`。
  最終觀察以 `final-results.log` 與 `runtime-summary.json` 為準。

## 正常收束

歷史 owner：Python PID25392（parent2312）；CLI Node PID24712（parent25324）；
Chrome 主程序 PID3968（parent24712）。完整 command line／建立時間見 `ownership.json`，
關閉前重核 `ownership-before-close.json`。以上是本輪歷史證據，不能供下一輪終止程序。

指定 session close 成功；只向本輪 server exec88059 傳送 Ctrl+C，預期中斷 exit1。
`close.log`、`server-output.log`、`console-check.log` 保留。
`cleanup.json`：2026-11-05 16:33:01 +08:00，在目前一般使用者 CIM／loopback 觀察範圍內，
本輪匹配程序 0、port43766 listener 0。

本輪未發現需要修改遊戲程式的問題。後續可繼續其他主題素材批次。
