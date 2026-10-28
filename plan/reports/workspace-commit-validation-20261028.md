# 工作區測試與分組提交

日期：2026-10-28（Asia/Hong_Kong）。使用者授權測試，沒有問題後 commit「包括工作區的所有文件，分開 commit」。本報告記錄本次實際檢查，遊戲完整驗收界線仍見[唯一狀態入口](../status.md#current-state)。

## 實際檢查

使用 bundled Node **24.22.1** 與現有 node_modules，不下載、升級或安裝依賴。完整執行輸出與一次性檢查腳本保留於 repository 內 `.playroom/tmp/commit-review-20261028-01/`，按原 ignore 不提交；以下僅存短結論。

| 檢查 | 實際結果 | 本機完整輸出 |
| --- | --- | --- |
| 主工作區 Vitest | **45 檔、327 項全通過**，exit 0；最終 run 約 8.11s | `tests-final.log` |
| TypeScript | `tsc --noEmit` exit 0 | `typecheck.log` |
| 內容表 | rules／world 及跨表驗證通過，exit 0 | `content.log` |
| 隔離建置 | Vite build exit 0，約 2.42s；輸出至本 run 的 `dist/`，未改根 dist 或凍結候選 | `build.log` |
| Plan18 文件／fixture | 16 份文件、127 個本地引用、16 個 Markdown 錨點、7 個 provenance 來源均存在；616-byte 副本與原件 bytes／SHA-256 一致，metadata 標歷史接受而非重新 validator | `docs-fixture.log`、`check-docs-fixture.mjs` |
| 有限文字樣式掃描 | 當時 286 個待提交文字檔，指定 private-key／GitHub-token／AWS-key／API-key 樣式無命中；不掃二進位，不宣稱全面機密稽核 | `docs-fixture.log` |

## 測試發現與修正

第一次執行原 `vitest run` 收集了 `.worktrees` 的歷史副本：227 檔中 21 檔失敗、67 項失敗。這不是 67 個已確認遊戲缺陷；主代理先分類，再由三名全新 Luna Max／fork none 修正清楚劃定的測試／設定範圍：

- `vitest.config.ts` 合併現有 Vite config、保留 Vitest 預設排除，再排除 `.worktrees`。`.gitignore` 加入該本機獨立 Git 工作樹目錄，避免誤提交為 gitlink。根 src 與 tests 的 45 個測試檔仍被收集。
- 三份 Ruins 存檔測試及 namespace 測試對齊已存在的讀 1–5／寫 5 與 `confirmSaveUpgrade()` 契約；保留確認前不寫、原件／備份保全、衝突與失敗後停止寫入斷言。原「不支援 format5」負例改用真正不支援的 format6。
- foundation／gallery 兩檔對齊既有新增 `frost-route-marker` 與 q21／q22：NPC13、quests22，並保留精確 ID 與路線斷言。

Luna 先跑受影響 focused 檔；主代理審閱後才跑一次最終正確收集範圍的完整主工作區套件。這批修正只改 tests/config/ignore，沒有修改 runtime 或降低存檔保護。Typecheck 的 include 為 src／tools／vite.config.ts，以上來源未再改，因此沒有重跑已過 typecheck、content 或 build。一次性文件檢查初稿使用了過時的 README 歷史分隔文字，改為現存分隔標題後通過；沒有因此改產品文件來配合檢查。

三份 Luna 短交接與 focused logs 也留在上述本機 run 目錄。測試修正不製作新遊戲版本或候選。

## 提交範圍與保全

主代理依使用者授權將全部可追蹤的工作區變更分組提交，實際 commit ID 以 Git 歷史及最終回報為準：

1. 遺跡素材原稿與產製紀錄：`art-source/ruins-c/`。
2. 遊戲來源、runtime 素材、現有測試及版本 metadata：src／public／tests／tools/audio、package 檔。
3. 既有 Plan14–17 與各階段交接／驗收歷史，以及三張未忽略的 visual-review 原圖／審圖。
4. Plan18 計畫、回饋、證據、QA 文件與 fixture、共用現況入口，以及本報告。
5. 開發執行設定、Vitest 收集配置與工作樹 ignore。

不使用 force-add。node_modules、候選 artifacts、根 dist、Playwright profiles／raw／長 log、工具暫存等沿用現有忽略規則並保留原件；`.worktrees` 內容維持各自獨立 repository，不新增子模組、不 flatten。`.claude/launch.json` 是無憑證的既有本機啟動配置，按全部文件授權一併保留。

本次沒有 browser／視審、正式平台／雲端、音訊或真 OS 焦點測試，沒有 seed、save validator、pack／完整 ZIP validate、tag、push、Release 或上架。沿用歷史 beta24 ZIP 與局部視審證據，未外推為本次重新通過。Git commit 是本機版本保存，不代表發布。
