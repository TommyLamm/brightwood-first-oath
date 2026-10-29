# Plan 45 候選成品：1.0.0-beta.52

- 候選：`brightwood-first-oath`；作者 `TommyLamm`；裝置 `desktop`；Playroom tools `1.2.0`。
- 狀態：SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED；未發布。
- 成品目錄：[artifacts/plan45-1.0.0-beta.52](../../artifacts/plan45-1.0.0-beta.52/)；執行記錄：[.playroom/tmp/plan45-candidate-beta52](../../.playroom/tmp/plan45-candidate-beta52/)。

## 執行步驟

本次只將 `package.json`、`package-lock.json` 頂層與 `packages[""]`、source `public/game.json` 的版本從 `1.0.0-beta.51` 精確替換為 `1.0.0-beta.52`，保留原有格式與其他內容。Python 3.11 確認 JSON 欄位及 byte occurrence 數分別為 1、2、1。Plan44 的 `audit_candidate.py` 唯讀複製到新 tmp，以 AST 更新候選目錄、版本 assertion 及摘要路徑；解析確認 `artifact`、`dist`、`zip_path`、`tmp` 均指向本次 beta.52 目標。

| 步驟 | 結果 | 完整命令、輸出與 exit code |
|---|---:|---|
| 新目錄建立、metadata prepare 與 audit 副本路徑設定 | exit 0 | `.playroom/tmp/plan45-candidate-beta52/prepare.log` |
| 指定 Node 24.22.1 Vite build（81 modules） | exit 0 | `.playroom/tmp/plan45-candidate-beta52/build.log` |
| Playroom pack | exit 0 | `.playroom/tmp/plan45-candidate-beta52/pack.log` |
| 完整 ZIP validate | exit 0 | `.playroom/tmp/plan45-candidate-beta52/validate.log` |
| 指定 Python 3.11 audit | exit 0 | `.playroom/tmp/plan45-candidate-beta52/audit.log` |

每步完整原命令、輸出與 exit code 已即時保存於表列日誌。Build 使用 `node_modules/vite/bin/vite.js`，pack 與 validator 使用固定 `tools/playroom/pack.mjs`、`tools/playroom/validate.mjs`。Audit 摘要另存為 `.playroom/tmp/plan45-candidate-beta52/zip-audit.json`。準備時沒有重跑任何成功步驟。

## 成品與 metadata

六處版本一致為 `1.0.0-beta.52`：`package.json`、`package-lock.json` 頂層、`package-lock.json` 的 `packages[""]`、source `public/game.json`、dist `game.json`、ZIP 內 `game.json`。Source、dist、ZIP metadata 一致：作者 `TommyLamm`、ID `brightwood-first-oath`、裝置 `desktop`、存檔讀取格式 1–5／寫入格式 5。

| 項目 | 檔案數／ZIP entries | 檔案總 bytes／ZIP bytes | SHA-256 |
|---|---:|---:|---|
| Source manifest（`source-files.sha256`） | 433 source files | 135,785,267 source bytes | `2166bed312defa19c75eac357927fff15315fc6f86063908b04111ffe55e80d0` |
| Dist manifest（`dist-files.sha256`） | 274 dist files | 135,753,237 dist bytes | `257fab7b6b863e147e88f9ffcfd136277dbd396680e337d7f70ac6864101364e` |
| ZIP（`game.zip`） | 274 entries | 131,528,288 ZIP bytes | `c3c85150e83b684e8b7d48821f678afbfe520c659d3f66fc019dfe740325ec68` |

ZIP entries 解壓後共 135,753,237 bytes，壓縮 entries 合計 131,480,464 bytes；根目錄 entries 為 `assets`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor`。Audit 的 metadata `manifestConsistent` 為 `true`。

## 有限文字掃描與限制

Audit 對 14 個文字 entries、1,770,900 bytes 執行 8 類 pattern 掃描，findings 為 0。類別為 PEM 私鑰標頭、AWS access key、Google API key、GitHub token、Slack token、Stripe secret/restricted key、引號包住的 credential assignment、JWT-like 值。260 個 binary entries、133,982,337 bytes 未掃描；超過 16 MiB 的文字 entries 為 0。這不是完整 binary 檢查。

本次未執行 tests、tsc、browser 或 server。W01 指定 tsc 單次執行與四區五 hunks diff 已由 root 審閱接受，依指示未重跑。遊戲內 click、focus、reader 與 layout 未由 browser 驗證；候選未發布。

補充：準備期間曾有一次exec包裝字串解析失敗，shell尚未執行、未造成檔案操作；修正包裝後執行上述各實際步驟，未重跑已成功檢查。
