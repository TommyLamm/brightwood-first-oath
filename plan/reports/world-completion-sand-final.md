# Plan16 W04・沙海 q22 最後一輪真實瀏覽器補證

日期：2026-10-27（香港時間）  
狀態：**PARTIAL；未能看清遊戲場景，q22／q14 閉環未驗**

## 規格與範圍

開工前以網路工具完整讀取 Playroom `game-agent-template.md` 及其中列出的七份 main 規格：game development、command contracts、manifest schema、release workflow、starter SDK、SDK versioning、save compatibility。此輪只復用 beta.19 凍結候選、b6 真實 profile 與既有 origin；要求是沿用原遊戲 ID／desktop／Lv30、真跨來源 iframe、使用實際 UI、正式保存只以 `saved:true` 為準，且不得把未驗項目寫成通過。

沒有改遊戲源碼、版本或 dist；沒有重跑 build、tests、pack、validate；沒有發布、平台 API 操作，也沒有讀寫 dirty 的真實 q08 raw。

## Profile、server 與起始資料

使用 `output/playwright/world-completion-sand-b6/profile/` 原 persistent profile，以自有 Playwright session `sand-final-b7` 開啟原網址 `localhost:56989`；遊戲仍由 `127.0.0.1:56988` 載入，sandbox 含 `allow-scripts allow-same-origin allow-pointer-lock`。開啟前確認該 profile 沒有其他 Chrome process 使用。

b6 最後檢查點 `output/playwright/world-completion-sand-b6/checkpoints/04-east-scan-no-portal.json` SHA-256 為 `aa32efbc5ae0b20f01bd3216056e97f91d2a82df51a0796d0ef8a0798f984051`：format 5、`frost-shore/right`、HP 660、MP 98、q14 active、q22 缺省。該檔與原 fixture 均保留。

按標題畫面的「繼續冒險」正常載入原存檔。首個 HUD snapshot 顯示 QA-Sand-B6、Lv30、雪痕海岸、HP 660/760、MP 98/98、金幣 4,321。隨後使用 HUD 暫停；沒有移動、按 Space、攻擊或使用藥水。暫停前 HUD 變為 HP 732/760、MP 98/98。靜態查閱 `src/app/app.ts` 的 `continue` 只切換畫面狀態，`restoreGame()` 複製來源玩家資料；`recoverWhileResting()` 對 rank 6 每 2 秒回復 12 HP（傷害／攻擊後等待 3 秒）。這與 Continue 後 HP 自然回復相符；沒有手動補血或回載補血。

從原遊戲 iframe 只讀重讀 canonical localStorage 字串，未寫回；保存檔逐字等於讀取字串：

- Raw：`output/playwright/world-completion-sand-final-b7/checkpoints/01-current-canonical-after-continue-paused.json`
- SHA-256：`A93BD5834742BD6C915E89DDDEA00D3B5A3E238984C239DAF38883BE91F2192C`（1,432 bytes）
- 內容摘要：format 5、`frost-shore/right`、HP 732、MP 98、金幣 4,321、q14 active、q22 absent。
- `02-current-canonical-cli-read-envelope.json` 保留 CLI 對字串結果的外層 JSON envelope，SHA-256 `B5DF4F9B3C3D8AF611016F5CAE8E694A3C51182589584AA383A8465D4E077333`；此檔不是遊戲 canonical raw。其 hash 與先前誤存的序列化 envelope 相同，canonical raw 已另外正確解封並逐字比對。

## 畫面結果與停止點

第一張暫停畫面遮住角色與門。遵照原 Sol 的建議，只按一次 Escape，等 160ms 擷取一張 960×540、JPEG quality 70，並在 `finally` 立即按 HUD 暫停。原 Sol 檢視這張唯一未遮擋圖後回報：HUD 可見，但整個 canvas 區域均一深灰，角色、地形與 portal 均不可見；因此不能判斷應往哪裡移動，也不能由畫面判定缺門。依停止指示，沒有再移動、按 Space、重截、重種或嘗試其他 origin。

- Escape 後唯一未遮擋圖：`output/playwright/world-completion-sand-final-b7/screenshots/frostshore-continue-escape-960x540-q70.jpg`，SHA-256 `18CB3694DD6561CF2E0CFBF8664B06D0AF01E59EBCA8B87C2C6D3665106BE75F`。
- 暫停 overlay 圖：`output/playwright/world-completion-sand-final-b7/screenshots/frostshore-continue-paused-960x540-q70.jpg`，SHA-256 `1E966B79CC29C260CCABFBEBB46380E7D51B6E3F389C21077D7F82155905604C`。

本輪未接 q22，未進日井盆地、未擊退兩隻甲蟲、未手動領 q22 獎勵；q14 首領勝利／離場／手動領獎與 q15 接縫亦未驗。以上均非 PASS。

## 最小診斷與清理

- 自有 session `console error` 回報 0 errors、0 warnings。CLI `requests` 摘要沒有失敗／4xx／5xx 行；這只是摘要檢查，不是完整網路 audit，也不能證明整體玩法通過。
- Source renderer 使用 Canvas 2D（`src/render/index.ts:451`），因此沒有 WebGL context 可丟失。本輪沒有足以支持更換 Chrome 設定或重啟環境的錯誤證據，未做設定修正。
- 關閉自有 `sand-final-b7` session 後，確認沒有使用 b6 profile 的 Chrome process 殘留。核對原 server PID 22560 的命令列確為 b6 `serve-candidate.mjs`、port 56988／56989 也均由其持有後，對該 PID 發送 SIGTERM；程序退出且兩個 port 已釋放。未關閉其他 browser session 或程序。b6 profile、raw、checkpoint、server-info 與候選 dist 均保留；`server-info.json` 是已停止 server 的歷史啟動資訊。

## 結論

本輪只完成原 profile 的正常 Continue、HUD 暫停、raw 保全與有限畫面診斷。場景畫面不可見使 q22 與 q14 無法安全續做；不宣稱 q22、日井首領、q15 或完整瀏覽器流程通過。候選仍未發布。
