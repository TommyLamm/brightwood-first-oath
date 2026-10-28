# Plan16・format5 存檔升級與四區手帳瀏覽器驗收（b4）

日期：2026-10-27（香港時間）。狀態：**LOCAL_UI_CHECKS_COMPLETE／VISUAL_REVIEW_PENDING**。本報告只記錄 frozen beta.19 dist 的本機 browser UI 操作；不代表 Playroom preview、雲端格式5或正式發布已驗。

## 依據與範圍

已讀 repo `AGENTS.md`、Plan16 W06／W07 與第7／8節、b3 的 `world-completion-ui-browser.md`、save-implementation、UI journal、candidate、live-handoff，以及 Playwright skill、CLI reference、workflows。根代理本輪已重新完整閱讀八份 Playroom main 規格；本次依其摘要保留遊戲 ID／Lv30／desktop／canonical namespace、既有玩家資料、相對資源及跨來源 sandbox iframe。format4 升級先明示備份並取得玩家確認；暫時遊玩不保存；本機 UI 不宣稱正式雲端相容。沒有發布授權。

驗收限 A format4 備份升級、B 暫玩不保存、C q19 回顧／主支線分類／boss 地名、D 同頁操作尺寸及 Esc／J；不重跑已通過的 focused tests、全套、build、pack、ZIP validate、雲端或正式 preview。

## 候選與隔離方式

- 唯讀使用 `artifacts/world-completion-beta19/dist/`。ZIP SHA-256 與候選紀錄一致：`68644dc701fb51fa8f11d69a0698819b4cb01203c8a258d9085c37c5aca6b53b`；dist 有274個檔案，ID `brightwood-first-oath`、版本 `1.0.0-beta.19`、desktop、read format 1–5／write format 5。`index.html` SHA 與 b3 snapshot 相同；bundle 為 `index-DJXQwIzk.js`，SHA-256 `7756f44c6e5c2861bb752f4051ce2335f78eac8f7b9b82a2f1760aff5ef7bd56`。
- 使用 cached Playwright CLI、bundled Node、headless Chrome 與四個獨立命名 session。暫時 host `http://localhost:63753/` 以 sandbox iframe 載入 `http://127.0.0.1:63752/index.html`；sandbox 為 `allow-scripts allow-same-origin allow-pointer-lock`。兩個不同 origin 的相對資源均由候選子目錄提供。沒有接帳號或 Playroom cloud bridge。
- 每個 fixture 在新 browser context 的空 localStorage 讀回確認後，只種入一次。先用當前 `createPersistence.initialize` 嚴格驗 envelope／SaveData：format4 回 `upgradeRequired`，format5 回 `ready`；validator 初始化沒有寫入來源。

## 結果

| 項目 | 結果與證據 |
| --- | --- |
| A・明確升級 | format4 gate 明示確認前不改原件、備份原 format4 並升至 format5。確認前 canonical raw 完全相同，SHA-256 `f4ca66a5a93a8a72ee3d389891351fb23c8b949f4798049a17e93049f60275ea`，沒有 backup／format5 key。點「備份 format4 並升級繼續」後，format4 backup 逐字相同且 SHA 不變；canonical 為 format5（SHA `8fc62bac3df9e0c1ff6a99756889b53ed2fab88cb49c4e99de046c2cdb44e582`），SaveData 深比對相同：Lv30、8項已領主線、q09進行中、背包兩疊與武器／衣服裝備保全。reload 後不再顯示 gate；「繼續冒險」進入木葉鎮。 |
| B・暫時遊玩 | 第二個空 context 使用不同 format4 fixture；按「暫不升級，暫時遊玩（不保存）」後，UI 明示「暫時遊玩不會寫入本機或雲端存檔。」送出一次 ArrowRight、開任務手帳，再以 Escape 關閉。之後回 child origin 讀取 canonical raw，與種入前完全相同，SHA-256 `6b6101258ba8d7abe892101c4c6913b351a9a7d538391a8b758a75349de306ff`；storage 只有 canonical key，沒有 format5 或 format4-backup。可見 URL 請求93筆、非本機 origin 0筆；此本機 harness 沒有雲端帳號／bridge，故未執行雲端寫入。 |
| C・q19 town／回顧 | 合法 format5 q01–q19 claimed、q20–q22進行中 fixture 只有1張已訪地圖（town），仍直接進標準 title，無升級或強制結局 modal。按 J 開手帳，顯示木葉、霜雪、沙海、遺跡四個主線群（8/8、3/3、3/3、5/5）及獨立「四區支線」q20／q21／q22。回顧顯示四區完成、可自由往返，並列出 q20 巡鈴石獸／失聲鈴片→行舟（回聲長廊）、q21 霜松航標→雪芽（雪痕海岸）、q22 日井盆地→琉砂（琥珀砂岸）。在 visitedMaps=1 的 fixture 可用，未要求18/18探索。Escape 關閉、J 可重開；reload 後只有標準 title，Continue＋J 再次開回顧。 |
| C・boss 地名 | 另一獨立 q19 claimed fixture，location 為 `ruins-bell-sanctum`、visitedMaps=2。正常 title 顯示「上次進度：QA-B4-Q19-Boss・Lv.30 劍士・誓鐘內殿」，沒有誤顯「古礦入口」。 |
| D・操作區 | q19 同一頁明確 resize 並以 `innerWidth/Height` 驗證：960×540→640×360，兩次 `devicePixelRatio=1`。最低尺寸按 J／Escape 可開關手帳並重開回顧，iframe 保持 active。format4 gate 在640×360有實際 snapshot 與按鈕操作；本輪沒有另做 gate 的960×540視覺截圖。 |

## 證據與限制

- 合成 fixture、驗證摘要、raw before／after、SHA、filtered network summary 及 CLI 原始 PNG／快照均保存在 `output/playwright/world-ui-beta19-b4/`。主要視覺樣本：`screenshots/a-gate-crossorigin-640x360.jpg`、`screenshots/q19-journal-review-640x360.jpg`、`screenshots/q19-boss-last-progress-960x540.jpg`。另有一張在顯式設 viewport 前由 CLI 預設尺寸產生的 `q19-journal-review-1280x720.jpg`；不以該圖代表最低尺寸，視覺審核應使用640圖。所有 JPEG 為 quality 70，長邊不超過1280。
- 視覺是否合理、文字／按鈕是否裁切交同一 Sol reviewer；browser owner 不判視覺 PASS。候選音訊未作實際耳聽／loopback 驗收；CLI 沒有可用的系統輸出擷取，因此不能用載入或播放 promise 當作聽過。正式 Playroom preview、雲端保存與發布仍未驗。
- 未修改 source／tests／build／pack／metadata，未執行測試套件或發布。只逐一執行 `playwright-cli -s=world-ui-beta19-b4-a close`、`-s=world-ui-beta19-b4-b close`、`-s=world-ui-beta19-b4-ctown close`、`-s=world-ui-beta19-b4-cboss close`；沒有執行 `close-all`／`kill-all`。四個 context 回報的 browser PID `25332`、`18288`、`14440`、`11040` 之後均查無程序。先核對 server PID `23660` 的命令列與兩個 listener 都屬於本報告 harness，再停止該程序；兩個 port 均確認沒有 listener。沒有推定任何其他 QA session 的狀態與本次清理有關。沒有讀寫真實玩家存檔、既有 profile 或帳號。

## 後續

把三張指定 JPEG 交同一 Sol reviewer；若視覺審查發現具體裁切／控制區缺陷，回報根代理處理 frozen candidate，不在本 browser owner 任務中改 source 或重建候選。其餘雲端、音訊與平台驗收維持未驗。
