# Plan 49 候選成品：1.0.0-beta.56

- 遊戲：`brightwood-first-oath`；作者：`TommyLamm`；裝置：`desktop`；Playroom tools：`1.2.0`。
- 狀態：`SOURCE_DELIVERED`／`ZIP_VALIDATED`／`BROWSER_UNVERIFIED`。未發布；這不是平台人工驗收。
- 成品：[artifacts/plan49-1.0.0-beta.56](../../artifacts/plan49-1.0.0-beta.56/)；執行記錄：[.playroom/tmp/plan49-candidate-beta56](../../.playroom/tmp/plan49-candidate-beta56/)。

## 範圍與版本

依 Plan 49 W02，從唯讀 `.playroom/tmp/plan38-candidate-beta45/prepare_candidate.py` 建立新 prepare 副本。六組整體替換依序是 `plan38→plan49`、`plan37→plan48`、`beta45→beta56`、`beta44→beta55`、`beta.45→beta.56`、`beta.44→beta.55`；實際替換數為 3、3、2、3、4、3。prepare 從唯讀 Plan 48 audit 產生新 audit 副本；AST／Path 解析確認目標分別是：

| 名稱 | 實際路徑 |
|---|---|
| `artifact` | `artifacts/plan49-1.0.0-beta.56` |
| `dist` | `artifacts/plan49-1.0.0-beta.56/dist` |
| `zip_path` | `artifacts/plan49-1.0.0-beta.56/game.zip` |
| `tmp` | `.playroom/tmp/plan49-candidate-beta56` |

只將 `package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 的版本從 `1.0.0-beta.55` 換成 `1.0.0-beta.56`；精確替換數為 1／2／1。以 bytes 修改 JSON，保留 package-lock 其餘 bytes。

## 執行紀錄

| 步驟 | 結果 | 詳細日誌 |
|---|---|---|
| 新候選目錄、prepare 副本 | exit 0；六組實際替換數如上 | [prepare-setup.log](../../.playroom/tmp/plan49-candidate-beta56/prepare-setup.log) |
| prepare metadata、audit 副本與路徑解析 | exit 0；metadata 替換數 1／2／1 | [prepare.log](../../.playroom/tmp/plan49-candidate-beta56/prepare.log) |
| Node 24.22.1 Vite build（82 modules） | exit 0；執行一次 | [build.log](../../.playroom/tmp/plan49-candidate-beta56/build.log) |
| Playroom pack | exit 0；tools 1.2.0；執行一次 | [pack.log](../../.playroom/tmp/plan49-candidate-beta56/pack.log) |
| 固定工具完整 ZIP validate | exit 0；執行一次 | [validate.log](../../.playroom/tmp/plan49-candidate-beta56/validate.log) |
| Python 3.11 audit | exit 0；執行一次 | [audit.log](../../.playroom/tmp/plan49-candidate-beta56/audit.log)；摘要 [zip-audit.json](../../.playroom/tmp/plan49-candidate-beta56/zip-audit.json) |

Build、pack、validate、audit 各執行一次且成功後未重跑。W02 未執行 tests、tsc、browser 或 server。

## Manifest 與成品雜湊

六個版本位置（`package.json`、`package-lock.json` 頂層、lock 的 `packages[""]`、source `public/game.json`、dist `game.json`、ZIP 內 `game.json`）均為 `1.0.0-beta.56`。Audit 確認 source／dist／ZIP 的作者 `TommyLamm`、ID `brightwood-first-oath`、裝置 `desktop`、`cloudSave` 讀取格式 1–5／寫入格式 5 一致，`manifestConsistent: true`。

| 項目 | 檔案數／ZIP entries | 檔案總 bytes／ZIP bytes | SHA-256 |
|---|---:|---:|---|
| Source（`source-files.sha256`） | 435 source files | 135,791,402 source bytes | `40f27be4d6d07d1b70ba17133383f71f0b758737dfb6a5aafb827786c8deacd9` |
| Dist（`dist-files.sha256`） | 274 dist files | 135,754,960 dist bytes | `b61002c0fdd4e25f49ca0e06fadff492d545899e7808a9b932d566eaf2028689` |
| ZIP（`game.zip`） | 274 entries | 131,528,762 ZIP bytes | `8c8228a0f356d811187aef9d22c97e8c4df1fcd3cdd242fa4d64371906bc531f` |

ZIP 解壓 entries 共 135,754,960 bytes，壓縮 entries 合計 131,480,938 bytes。ZIP 根目錄 entries 為 `assets`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor`。

## 有限文字掃描

Audit 對 14 個文字 entries、1,772,623 bytes 執行 8 類 pattern 掃描，findings 為 0；超過 16 MiB 的文字 entries 為 0。pattern 類別為 PEM private key header、AWS access key ID、Google API key、GitHub token、Slack token、Stripe secret/restricted key、quoted credential assignment、JWT-like value with encoded JSON header。260 個 binary entries、133,982,337 bytes 未由這些文字 pattern 掃描；這不是完整 binary 或機密檢查。

遊戲內真實 click、跨區選圖、focus、reader 與 layout 未經 browser 驗證。候選已完成 source 交付及固定工具 ZIP 驗證，尚未發布。
