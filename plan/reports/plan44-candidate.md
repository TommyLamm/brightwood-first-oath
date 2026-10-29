# Plan 44 候選成品：1.0.0-beta.51

- 候選：`brightwood-first-oath`；作者 `TommyLamm`；裝置 `desktop`；Playroom tools `1.2.0`。
- 狀態：SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED；未發布。
- 成品目錄：[artifacts/plan44-1.0.0-beta.51](../../artifacts/plan44-1.0.0-beta.51/)；執行記錄：[.playroom/tmp/plan44-candidate-beta51](../../.playroom/tmp/plan44-candidate-beta51/)。

## 執行步驟

本次只將 `package.json`、`package-lock.json` 頂層與 `packages[""]`、source `public/game.json` 更新至 `1.0.0-beta.51`，保留 JSON 原格式。metadata 由 Python 3.11 讀取並確認指定版本欄位；替換數分別為 1、2、1。Plan43 的 `audit_candidate.py` 保持原樣，只讀複製至新 tmp，再以 AST 欄位及 Path 元件更新候選路徑與版本 assertion。AST 解析後解析出的 `artifact`、`dist`、`zip_path`、`tmp` 均指向本次 beta.51 目標路徑。

| 步驟 | 結果 | 完整命令、輸出與 exit code |
|---|---:|---|
| metadata prepare 與新 audit 副本路徑設定 | exit 0 | `.playroom/tmp/plan44-candidate-beta51/prepare.log` |
| 指定 Node 24.22.1 Vite build（81 modules） | exit 0 | `.playroom/tmp/plan44-candidate-beta51/build.log` |
| Playroom pack | exit 0 | `.playroom/tmp/plan44-candidate-beta51/pack.log` |
| 完整 ZIP validate | exit 0 | `.playroom/tmp/plan44-candidate-beta51/validate.log` |
| 指定 Python 3.11 audit | exit 0 | `.playroom/tmp/plan44-candidate-beta51/audit.log` |

準備時第一次建立 tmp 的 PowerShell 命令誤用 `New-Item -LiteralPath`，該參數不受支援，因而未建立目錄且後續複製失敗；接著以 `New-Item -Path` 建立新 tmp 並完成 audit 副本。第一次 setup 呼叫的 wrapper 未回報 process exit code；該次未執行任何候選驗收或修改 metadata。之後五個步驟各執行一次，完整原命令、輸出與 exit code 已即時寫入表列日誌，沒有重跑成功步驟。

Audit 使用新副本 `.playroom/tmp/plan44-candidate-beta51/audit_candidate.py`，摘要另存為 `.playroom/tmp/plan44-candidate-beta51/zip-audit.json`。pack 使用 `tools/playroom/pack.mjs`，validator 使用 `tools/playroom/validate.mjs`，均由固定 Node 24.22.1 執行。

## 成品與 metadata

六處版本一致為 `1.0.0-beta.51`：`package.json`、`package-lock.json` 頂層、`package-lock.json` 的 `packages[""]`、source `public/game.json`、dist `game.json`、ZIP 內 `game.json`。Source、dist、ZIP metadata 一致：作者 `TommyLamm`、ID `brightwood-first-oath`、裝置 `desktop`、存檔讀取格式 1–5／寫入格式 5。

| 項目 | 檔案數／ZIP entries | 檔案總 bytes／ZIP bytes | SHA-256 |
|---|---:|---:|---|
| Source manifest（`source-files.sha256`） | 433 source files | 135,783,962 source bytes | `29c6e6d765c6abfc4516018cfa75da8067806b976d9fb81bef4c6da0610d39b4` |
| Dist manifest（`dist-files.sha256`） | 274 dist files | 135,752,557 dist bytes | `339d3d7770d338548b85b3ab770520d44c62cbb5b6cab21877408a0ad79b6dfe` |
| ZIP（`game.zip`） | 274 entries | 131,528,168 ZIP bytes | `76126b929caf3e7334770e45ffca5d5727fccc81586d478817135948e1a3be87` |

ZIP entries 解壓後共 135,752,557 bytes，壓縮 entries 合計 131,480,344 bytes；根目錄 entries 為 `assets`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor`。Audit 的 metadata `manifestConsistent` 為 `true`，有限 pattern findings 為 0。

## 有限文字掃描與限制

Audit 對 14 個文字 entries、1,770,220 bytes 執行 8 類 pattern 掃描，findings 為 0。類別為 PEM 私鑰標頭、AWS access key、Google API key、GitHub token、Slack token、Stripe secret/restricted key、引號包住的 credential assignment、JWT-like 值。260 個 binary entries、133,982,337 bytes 未掃描；超過 16 MiB 的文字 entries 為 0。這不是完整 binary 檢查。

本次未執行 tests、tsc、browser 或 server。W01 focused tests、W02 tsc 與局部 diff 已由 root 審閱接受，未重跑。遊戲內 click、focus、reader 與 layout 未由 browser 驗證；候選未發布。
