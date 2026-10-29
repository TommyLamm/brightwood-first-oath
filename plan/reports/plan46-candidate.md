# Plan 46 候選成品：1.0.0-beta.53

- 候選：`brightwood-first-oath`；作者 `TommyLamm`；裝置 `desktop`；Playroom tools `1.2.0`。
- 狀態：SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED；未發布。
- 成品目錄：[artifacts/plan46-1.0.0-beta.53](../../artifacts/plan46-1.0.0-beta.53/)；執行記錄：[.playroom/tmp/plan46-candidate-beta53](../../.playroom/tmp/plan46-candidate-beta53/)。

## 執行步驟

本次只把 `package.json`、`package-lock.json` 頂層與 `packages[""]`、source `public/game.json` 的版本從 `1.0.0-beta.52` 精確替換為 `1.0.0-beta.53`，保留原始格式及其餘內容。Python 3.11 確認 JSON 欄位及 byte occurrence 數分別為 1、2、1。新 audit 副本從 Plan 45 唯讀複製，以 AST 更新 artifact/tmp Path 元件、版本 assertion 及摘要路徑；解析確認 `artifact`、`dist`、`zip_path`、`tmp` 都解析到 Plan 46 beta.53 預期路徑。

| 步驟 | 結果 | 完整命令、輸出與 exit code |
|---|---:|---|
| 新目錄建立、metadata prepare 與 audit 副本路徑設定 | exit 0 | `.playroom/tmp/plan46-candidate-beta53/prepare.log` |
| 指定 Node 24.22.1 Vite build（81 modules） | exit 0 | `.playroom/tmp/plan46-candidate-beta53/build.log` |
| Playroom pack | exit 0 | `.playroom/tmp/plan46-candidate-beta53/pack.log` |
| 完整 ZIP validate | exit 0 | `.playroom/tmp/plan46-candidate-beta53/validate.log` |
| 指定 Python 3.11 audit | exit 0 | `.playroom/tmp/plan46-candidate-beta53/audit.log` |

準備日誌記錄了兩次 audit prepare 腳本字串調整的 guard 失敗（exit 1）：一次目標摘要路徑字串重複，一次複合字串行尾不符。兩次都在寫入調整後腳本或修改 metadata 前停止。修正後的 prepare 執行一次成功；build、pack、validate、audit 各執行一次，成功步驟沒有重跑。每個成功步驟的完整命令、輸出與 exit code 均在表列日誌。

Build 使用 `node_modules/vite/bin/vite.js`，pack 與 validator 使用固定 `tools/playroom/pack.mjs`、`tools/playroom/validate.mjs`。Audit 摘要另存為 `.playroom/tmp/plan46-candidate-beta53/zip-audit.json`。

## 成品與 metadata

六處版本一致為 `1.0.0-beta.53`：`package.json`、`package-lock.json` 頂層、`package-lock.json` 的 `packages[""]`、source `public/game.json`、dist `game.json`、ZIP 內 `game.json`。Source、dist、ZIP metadata 一致：作者 `TommyLamm`、ID `brightwood-first-oath`、裝置 `desktop`、存檔讀取格式 1–5／寫入格式 5。

| 項目 | 檔案數／ZIP entries | 檔案總 bytes／ZIP bytes | SHA-256 |
|---|---:|---:|---|
| Source manifest（`source-files.sha256`） | 433 source files | 135,785,958 source bytes | `bea319372577d932ad6410c01654687c64582f603099de007557889f880d8cab` |
| Dist manifest（`dist-files.sha256`） | 274 dist files | 135,753,607 dist bytes | `c3532e32dbf9c483d7bda7cf0f4ceb301e1c73a1c82a3b0da4bfd581d8e6d783` |
| ZIP（`game.zip`） | 274 entries | 131,528,370 ZIP bytes | `c14f87f9060d6291b95cd230535c6c916fe55177cf9cea44e9661e8d99abe869` |

ZIP entries 解壓後共 135,753,607 bytes，壓縮 entries 合計 131,480,546 bytes；根目錄 entries 為 `assets`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor`。Audit 的 metadata `manifestConsistent` 為 `true`。

## 有限文字掃描與限制

Audit 對 14 個文字 entries、1,771,270 bytes 執行 8 類 pattern 掃描，findings 為 0。類別為 PEM 私鑰標頭、AWS access key、Google API key、GitHub token、Slack token、Stripe secret/restricted key、引號包住的 credential assignment、JWT-like 值。260 個 binary entries、133,982,337 bytes 未掃描；超過 16 MiB 的文字 entries 為 0。這不是完整 binary 檢查。

本次未執行 tests、tsc、browser 或 server。W01 指定 tsc 單次執行與局部 diff 已由 root 審閱接受，依指示未重跑。遊戲內 click、focus、reader 與 layout 未由 browser 驗證；候選未發布。
