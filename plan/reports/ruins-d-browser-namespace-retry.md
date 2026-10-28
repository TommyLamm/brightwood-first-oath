# Plan 15 D browser namespace retry

日期：2026-10-26（香港時間）。本報告整理 `artifacts/ruins-d/browser/namespace-retry-20261025/` 的既有小型日誌與上一批交接；沒有重開 browser、重跑驗收、build、測試或封包，也沒有修改 src/dist/tests/package/manifest/ZIP。

## 凍結基線

沿用已 gate 的來源與 beta.15 成品：source tree SHA-256 `8c9388902ffee77d3081e56bbf6caa80388902e8c1ef8beb162a4d2ab6401407`、凍結 dist SHA-256 `8789d7abde697223beb41fcc2cd4fe5077869848d579b52691035fd8311f715a`。此批未重算雜湊。Plan 15 §3／§6 要求明確匯入格式 1–4、保留原始存檔與備份、測取消／canonical 優先／無效舊檔／寫入失敗，並分離 dev/build key；以下只報 browser namespace 範圍，不能代表 Plan 15 其他路線、戰鬥、聲畫或平台驗收。

## 觀察結果

- **格式 1–4 匯入保留 raw。** 匯入後舊 key 與 canonical 都存在且 `rawEqual: true`；每筆均 2862 bytes。對應 log：`format1-import-raw-check.log`（SHA-256 `86d61340…`）、`format2-import-raw-check.log`（`2e802de0…`）、`format3-import-raw-check.log`（`a8e02262…`）、`format4-import-raw-check.log`（`66541dae…`）。
- **格式 1–3 正常存檔建立 format 4 canonical 備份。** UI 從 Continue 進入遊戲並開設定，變更主音量後走一般本機保存；之後 canonical 為 format 4，原格式的 `:formatN-backup` 與舊 raw hash 相同。證據：`format1-after-settings-storage.log`、`format1-backup-raw-check.log`、`format2-after-save-storage.log`、`format3-after-save-storage.log`；舊 key 留存。這是各格式代表操作，不表示所有設定流程均測過。
- **暫不匯入。** `cancel-result.log` 顯示舊 raw 仍在（2862 bytes）、canonical 不存在；同一 app session 隱藏匯入按鈕。未把 session 內隱藏當成永久拒絕狀態。
- **有效 canonical 優先。** format 4 canonical 與不同的 format 3 舊 raw 同時存在；`canonical-priority-snapshot.log` 顯示既有「誓刃驗收・Lv.30」進度且沒有舊進度提示，`canonical-priority-storage-check.log` 確認兩份原始 hash 不同且均在。該 log 的 `importButtonCount:23` 實際查的是全部 `button` 元素數，不能當作匯入按鈕數量證據。
- **同文件競爭寫入。** 在匯入提示顯示後注入 format 4 canonical，再點匯入；`conflict-same-doc-result.log` 記錄按下前有匯入按鈕，結果保留 format 3 舊 raw 與 format 4 canonical，raw 不相等；`conflict-storage-check.log` 顯示兩份 hash 未變，status 區文字為空。之後快照回到 canonical 的既有進度。此情境證明沒有覆寫競爭資料，但沒有獨立呈現衝突訊息；上一 owner 未將其判為產品 failure。
- **未知格式保留。** `invalid-result.log` 中 format 99 舊字串未變、canonical 不存在、沒有匯入按鈕，並出現不相容提示。
- **單次 setItem 失敗。** `setitem-failure-result.log` 顯示舊 format 1 raw 保留、canonical 不存在、注入恢復，UI 提示「匯入未能完成；舊版進度仍保留」。
- **dev/build 隔離。** `dev-isolation-result.log` 只有 `maplewood-swordsman:save:v1:dev`；build 舊 key 與 canonical 均不存在，沒有匯入提示。
- **路徑形狀可載入。** `frame-urls.log`／`initial-snapshot.log` 顯示 versioned beta.15 遊戲 iframe 與遊戲介面；`preview-shape-result.log` 顯示 `/preview/games/brightwood-first-oath/1.0.0-beta.15/index.html` 標題及建立角色按鈕。這只證明本機路徑與畫面載入，不代表平台 preview／SDK。

## 清理與限制

`session-close.log` 記錄自有 `ruins-d-namespace-retry` browser session 已關閉。原harness PID是32588，父頁／遊戲的TCP ports是63509／63510；兩者不能混為PID。本次只讀PID查詢支持32588已不存在；對數字63510的PID查詢不證明同號port已關閉，故不採用為socket證據。父頁port63509的connection-refused是前owner checkpoint所記，本批未重驗；遊戲port63510的關閉狀態未獨立驗證。沒有檢查或關閉其他session／socket。初始console曾記錄harness的`/favicon.ico` 404；`final-console-errors.log`記錄最後檢查為0 errors、1 warning。沒有證據支持把這些列為遊戲功能失敗。

引用證據時以本目錄的小型 `*-result.log`、storage-check 與 snapshot 為準；原始服務長日誌未展開。browser namespace batch 未發現舊 owner 判定的產品 failure；競爭寫入案例只確認資料保全，沒有確認獨立衝突文案。正式平台、雲端、完整 Plan 15 R1–R4、聲畫及發布仍未由本批驗證。
