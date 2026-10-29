# Plan 48 候選成品：1.0.0-beta.55

- 候選：`brightwood-first-oath`；作者 `TommyLamm`；裝置 `desktop`；Playroom tools `1.2.0`。
- 狀態：SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED；未發布，這不是平台驗收。
- 成品：[artifacts/plan48-1.0.0-beta.55](../../artifacts/plan48-1.0.0-beta.55/)；執行記錄：[.playroom/tmp/plan48-candidate-beta55](../../.playroom/tmp/plan48-candidate-beta55/)。

## 範圍與來源

依 Plan 48 W03，使用唯讀 `.playroom/tmp/plan38-candidate-beta45/prepare_candidate.py` 建立新 prepare 副本，六組全域替換依序為 `plan38→plan48`、`plan37→plan47`、`beta45→beta55`、`beta44→beta54`、`beta.45→beta.55`、`beta.44→beta.54`。實際匹配數依序為 3、3、2、3、4、3；未預設 occurrence 數。新 prepare 從唯讀 Plan 47 audit 產生 Plan 48 audit 副本，AST／Path 解析結果為：

| 名稱 | 實際路徑 |
|---|---|
| `artifact` | `artifacts/plan48-1.0.0-beta.55` |
| `dist` | `artifacts/plan48-1.0.0-beta.55/dist` |
| `zip_path` | `artifacts/plan48-1.0.0-beta.55/game.zip` |
| `tmp` | `.playroom/tmp/plan48-candidate-beta55` |

只更新 `package.json`、`package-lock.json` 頂層及 `packages[""]`、`public/game.json` 的版本至 `1.0.0-beta.55`；精確替換數為 1／2／1。其他 metadata bytes 由 prepare 以 bytes 操作保留。

## 執行步驟

| 步驟 | 結果 | 命令、輸出與 exit code |
|---|---:|---|
| 建立新 artifact/tmp，複製 prepare 腳本 | exit 0 | [prepare-setup.log](../../.playroom/tmp/plan48-candidate-beta55/prepare-setup.log) |
| metadata prepare、audit 副本及路徑解析 | exit 0 | [prepare.log](../../.playroom/tmp/plan48-candidate-beta55/prepare.log) |
| 指定 Node 24.22.1 執行 Vite build（82 modules） | exit 0 | [build.log](../../.playroom/tmp/plan48-candidate-beta55/build.log) |
| Playroom pack | exit 0 | [pack.log](../../.playroom/tmp/plan48-candidate-beta55/pack.log) |
| 固定工具完整 ZIP validate | exit 0 | [validate.log](../../.playroom/tmp/plan48-candidate-beta55/validate.log) |
| 指定 Python 3.11 audit | exit 0 | [audit.log](../../.playroom/tmp/plan48-candidate-beta55/audit.log)；摘要 [zip-audit.json](../../.playroom/tmp/plan48-candidate-beta55/zip-audit.json) |

Build、pack、validate、audit 各執行一次且成功後未重跑。未執行 tests、tsc、browser 或 server。

## 成品與 metadata

Source、dist、ZIP 六處版本一致為 `1.0.0-beta.55`：`package.json`、`package-lock.json` 頂層、`package-lock.json` 的 `packages[""]`、source `public/game.json`、dist `game.json`、ZIP 內 `game.json`。Audit 確認 source／dist／ZIP 的作者 `TommyLamm`、ID `brightwood-first-oath`、裝置 `desktop`、存檔讀取格式 1–5／寫入格式 5 一致；`manifestConsistent` 為 `true`。

| 項目 | 檔案數／ZIP entries | 檔案總 bytes／ZIP bytes | SHA-256 |
|---|---:|---:|---|
| Source manifest（`source-files.sha256`） | 435 source files | 135,790,534 source bytes | `6412589972b2b62240b6a4e34920acc8cdae9dbcdf68bc2c3ebeba9a4279d318` |
| Dist manifest（`dist-files.sha256`） | 274 dist files | 135,754,495 dist bytes | `db13926e7d11fef3f09fbef44706c93da41feace9c68e288f16cb619b87c0920` |
| ZIP（`game.zip`） | 274 entries | 131,528,625 ZIP bytes | `ef4f758160bd30100032e0fd7bd8c0551c6562e21027f92bb4c717a54e957b7c` |

ZIP 解壓 entries 共 135,754,495 bytes，壓縮 entries 合計 131,480,801 bytes。根目錄 entries 為 `assets`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor`。

## 有限掃描與驗證界線

Audit 對 14 個文字 entries、1,772,158 bytes 執行 8 類 pattern 掃描（私鑰標頭、AWS access key、Google API key、GitHub token、Slack token、Stripe secret/restricted key、引號包覆的 credential assignment、JWT-like 值），findings 為 0；超過 16 MiB 的文字 entries 為 0。260 個 binary entries、133,982,337 bytes 未掃描，這不是完整 binary 檢查。

候選已交付 source 並通過固定 Playroom ZIP validate；遊戲內 click、focus、跨區選圖、讀屏與 layout 未經 browser 驗證。
