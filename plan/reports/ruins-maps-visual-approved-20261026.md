# 遺跡地圖短視覺驗收

日期：2026-10-26（香港時間）。狀態：**三張限定短樣本完成**。

## 範圍、規格與隔離

- 已讀取 [使用者同意與分工紀錄](./ruins-visual-approval-20261026.md) 及 Playwright skill。該紀錄列明模板與七份線上規格由 root 本輪完整讀取；本次沿用該已記錄規格資訊，未重讀或猜測規格內容。
- 範圍僅為潮痕營站、盤根石道、誓鐘內殿各一段正常移動的地面／背景短觀察；不重驗回聲長廊，不進行全地圖巡查、boss戰、FPS、音訊、正式平台或原生全螢幕驗收。
- SUT 固定為 `artifacts/overnight-20261026/portal-labels/dist`：`brightwood-first-oath` `1.0.0-beta.18`、desktop、schema 2、讀 1–4／寫 4。入口 `assets/index-BPLc23-E.js` SHA-256：`1c26346100c38d09beee5b7cc331210e29274ba1dc757c67021d9b3c302e6cab`，與指定 gate 相符。
- fixture-index 記錄三份 fixture 均已通過 catalog validation。本次各用一個全新、依序開啟的 browser context 與專用 localhost game origin；先確認 canonical localStorage 為空，再載入 fixture 原文並逐字讀回相等，之後以正常「繼續冒險」及遊戲按鍵操作。

## 觀察結果

| 遊戲地圖 | Fixture／map ID | 正常移動樣本 | 可見結果與界線 |
|---|---|---|---|
| 潮痕營站 | `q18-full-bag-ready.json`／`ruins-tide-camp` | 1280×720，ArrowRight 3.5 秒 | 角色由中央向右移動；前後畫面腳底都貼近同一地面頂線。前後抽樣中未見明顯背景空洞或跳位。截圖 HUD HP 均為 712/712。 |
| 盤根石道（遊戲內名稱） | `q17-q20-ready.json`／`ruins-root-causeway` | 由回聲長廊正常 Continue 後，單次 Space 進入；1280×720，ArrowLeft 3.5 秒 | 第一個向右短段只到入口側邊緣，僅作校準並保留，不作有效樣本。採用的修正樣本中，角色向左移動，平台、梯子與背景在前後抽樣中連續，腳底仍在地面。終點角色靠近畫面內的苔陶蟲，但未攻擊；前後 UI HP 仍為 712/712，截圖時敵方血條全綠。此項只支持入口側有限片段。 |
| 誓鐘內殿 | `boss-retry-ready.json`／`ruins-bell-sanctum` | 1280×720，入口 ArrowRight 2.5 秒 | 玩家從入口左側移至畫面中段；地面接觸和背景在前後抽樣中連續。HP 仍為 712/712。此段沒有 boss 同屏，也沒有接敵；不代表首領場景或全圖驗收。 |

每張地圖均另存放鍵後、暫停中的 960×640 同進度截圖。影片記錄只呈現各段短樣本與其短暫收尾；前後 JPEG 是有限視覺抽樣，不能證明每一子影格都無抖動。

## 證據與清理

- 標有來源檔名、只含三張地圖 before／after 地面與背景裁圖的聯絡表：[ruins-maps-contact-sheet-q70.jpg](../../output/playwright/ruins-maps-approved/evidence/ruins-maps-contact-sheet-q70.jpg)（1280×851，JPEG q70；裁切包含腳底與地面線下約 50px）。
- 原始前後圖、960×640 pause 截圖與短 WebM 均在 `output/playwright/ruins-maps-approved/evidence/`。盤根石道選用 `stonepath-left-*`；`stonepath-edge-calibration-*` 是未計入結果的入口邊緣校準檔。
- 瀏覽器 loaded-game 頁面為 0 errors、每個父頁各有 1 個 harness warning：iframe `allow="fullscreen; autoplay; gamepad"` 與 `allowfullscreen` 重複，瀏覽器指出 `allow` 優先。這是本次父頁標記警告，非遊戲錯誤。
- 本 owner 三個 named contexts 均已逐一關閉；只在核對 PID 328 的完整命令列與 65520–65523 四個 listener 都屬本任務後停止服務。停止後 PID 與四個 port listener 均不存在。boss owner 的 `ruins-boss-approved-20261026` session 未動。
- 未改 source、設定、metadata、平衡或 fixture；未執行 build、測試、pack、commit、push 或 release。
- 啟停與 seed 明細：[service-ownership.json](../../output/playwright/ruins-maps-approved/service-ownership.json)、[cleanup-record.json](../../output/playwright/ruins-maps-approved/cleanup-record.json)。
