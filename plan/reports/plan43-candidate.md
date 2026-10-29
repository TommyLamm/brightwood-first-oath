# Plan 43 候選成品：1.0.0-beta.50

- 候選：`brightwood-first-oath`；作者 `TommyLamm`；裝置 `desktop`；Playroom tools `1.2.0`。
- 狀態：SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED；未發布。
- 成品目錄：[artifacts/plan43-1.0.0-beta.50](../../artifacts/plan43-1.0.0-beta.50/)。本次接續既有 W02 候選，未重跑 prepare 或 build，亦未修改 metadata、遊戲來源、既有 dist 或 audit 副本。

## 執行步驟

原候選 owner 已完成 metadata prepare 與指定 Node 24.22.1 build。prepare 將 `package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 的版本分別替換 1、2、1 次；audit 副本 resolved paths 均指向 beta.50 的 artifact、dist、ZIP 與 tmp。用量中斷後由續作代理接手剩餘步驟。

| 步驟 | 結果 | 完整命令、輸出與 exit code |
|---|---:|---|
| 原 owner metadata prepare | exit 0 | `.playroom/tmp/plan43-candidate-beta50/prepare.log` |
| 原 owner 指定 Node 24.22.1 Vite build（80 modules） | exit 0 | `.playroom/tmp/plan43-candidate-beta50/build.log` |
| 續作 Playroom pack | exit 0 | `.playroom/tmp/plan43-candidate-beta50/pack.log` |
| 續作完整 ZIP validate | exit 0 | `.playroom/tmp/plan43-candidate-beta50/validate.log` |
| 續作指定 Python 3.11 audit | exit 0 | `.playroom/tmp/plan43-candidate-beta50/audit.log` |

Audit 使用原有唯讀副本 `.playroom/tmp/plan43-candidate-beta50/audit_candidate.py`，輸出摘要至 `.playroom/tmp/plan43-candidate-beta50/zip-audit.json`。pack 使用 `tools/playroom/pack.mjs`，validator 使用 `tools/playroom/validate.mjs`，兩者均由固定 Node 24.22.1 路徑執行。三個續作步驟各執行一次，完整命令、輸出與 exit code 已立即保存於表列日誌。

## 成品與 metadata

以下六處版本均為 `1.0.0-beta.50`：`package.json`、`package-lock.json` 頂層、`package-lock.json` 的 `packages[""]`、source `public/game.json`、dist `game.json`、ZIP 內 `game.json`。Source、dist、ZIP metadata 一致：作者 `TommyLamm`、ID `brightwood-first-oath`、裝置 `desktop`、存檔讀取格式 1–5／寫入格式 5。

| 項目 | 檔案數／ZIP entries | 檔案總 bytes／ZIP bytes | SHA-256 |
|---|---:|---:|---|
| Source manifest（`source-files.sha256`） | 431 source files | 135,777,242 source bytes | `b579bbaa863aa6269d086a655d20b3b6b7b214d3e42833a76784909bda63bf23` |
| Dist manifest（`dist-files.sha256`） | 274 dist files | 135,752,358 dist bytes | `e4e0ec116fdf123b2e2916ebed044ac0267364cfa668cf028140f83299c45826` |
| ZIP（`game.zip`） | 274 entries | 131,528,096 ZIP bytes | `a4534e5752f630e0cfb1c893506485919f053cbeb996c1996db73fd1f32995f6` |

ZIP entries 解壓後共 135,752,358 bytes，壓縮 entries 合計 131,480,272 bytes；根目錄 entries 為 `assets`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor`。Audit 的 `manifestConsistent` 為 `true`，pattern findings 為空。

## 有限文字掃描與限制

Audit 對 14 個文字 entries、1,770,021 bytes 執行 8 類 pattern 掃描，findings 為 0。類別為 PEM 私鑰標頭、AWS access key、Google API key、GitHub token、Slack token、Stripe secret/restricted key、引號包住的 credential assignment、JWT-like 值。260 個 binary entries、133,982,337 bytes 未掃描；超過 16 MiB 的文字 entries 為 0。這不是完整 binary 檢查。

本次接續未執行 tests、tsc、browser 或 server。W01 指定 tsc 與五處局部 diff 已由 root 審閱接受，未重跑。遊戲內 click、focus、reader 與 layout 未由 browser 驗證；候選未發布。
