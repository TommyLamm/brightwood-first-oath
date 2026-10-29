# Plan 49 Release 候選：1.0.0-beta.57

2026-10-29（Asia/Hong_Kong）

## 狀態與版本

- 狀態：`SOURCE_DELIVERED`／`ZIP_VALIDATED`／`BROWSER_UNVERIFIED`。
- 遊戲：`brightwood-first-oath`；作者：`TommyLamm`；裝置：`desktop`；Playroom tools：`1.2.0`。
- 候選成品：[artifacts/plan49-1.0.0-beta.57](../../artifacts/plan49-1.0.0-beta.57/)；執行紀錄：[.playroom/tmp/plan49-candidate-beta57](../../.playroom/tmp/plan49-candidate-beta57/)。
- 本候選相較 beta56 包含已審閱的 Frost 返回文字修補：霜潮洞窟可返回時顯示「返回雪痕海岸」，首領戰中 disabled title 提示不能返回安全地點。路由與其他地圖行為不變。
- 本報告交付 beta57 source／ZIP 候選；Git tag 與 GitHub Release 由 root 接手，這裡尚未發布。平台人工預覽、確認及上架也未執行。

## Prepare 與版本一致性

從唯讀 `.playroom/tmp/plan38-candidate-beta45/prepare_candidate.py` 建立新副本。六組整體字串替換及命中數為 `plan38→plan49`（3）、`plan37→plan49`（3）、`beta45→beta57`（2）、`beta44→beta56`（3）、`beta.45→beta.57`（4）、`beta.44→beta.56`（3）。新 prepare 的 audit 複製只將 `beta56→beta57`（1）與 `beta.56→beta.57`（4）；不把合法 `plan49` 當 legacy token。

Prepare 前唯讀核對的來源 audit 為 `.playroom/tmp/plan49-candidate-beta56/audit_candidate.py`。新候選路徑經 AST／Path 解析為：

| 名稱 | 實際路徑 |
|---|---|
| `artifact` | `artifacts/plan49-1.0.0-beta.57` |
| `dist` | `artifacts/plan49-1.0.0-beta.57/dist` |
| `zip_path` | `artifacts/plan49-1.0.0-beta.57/game.zip` |
| `tmp` | `.playroom/tmp/plan49-candidate-beta57` |

只修改 `package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 版本欄位，從 `1.0.0-beta.56` 精確升至 `1.0.0-beta.57`，命中數為 1／2／1。六個版本位置（上述三份 source metadata、dist `game.json`、ZIP 內 `game.json`）均為 `1.0.0-beta.57`。source／dist／ZIP 的 `id`、`author`、`devices` 與存檔宣告一致：`brightwood-first-oath`、`TommyLamm`、`["desktop"]`、讀取格式 1–5／寫入格式 5；schema 2、SDK 1.1.0、protocol 1。

## 執行紀錄

Build、pack、完整 ZIP validate 與有限 audit 均各執行一次；成功後未重跑。

| 步驟 | 結果 | 日誌 |
|---|---|---|
| 新目錄與 prepare 副本 | exit 0；六組替換數如上 | [prepare-setup.log](../../.playroom/tmp/plan49-candidate-beta57/prepare-setup.log) |
| Prepare 前唯讀檢查 | exit 0；source audit、metadata 計數及 AST/Path 路徑正確 | [prepare-preflight.log](../../.playroom/tmp/plan49-candidate-beta57/prepare-preflight.log) |
| Metadata prepare | exit 0；source 版本替換數 1／2／1，audit 替換數 beta56=1、beta.56=4 | [prepare.log](../../.playroom/tmp/plan49-candidate-beta57/prepare.log) |
| Node 24.22.1 Vite build | exit 0；82 modules；執行一次 | [build.log](../../.playroom/tmp/plan49-candidate-beta57/build.log) |
| Playroom pack | exit 0；tools 1.2.0；執行一次 | [pack.log](../../.playroom/tmp/plan49-candidate-beta57/pack.log) |
| 固定工具完整 ZIP validate | exit 0；執行一次 | [validate.log](../../.playroom/tmp/plan49-candidate-beta57/validate.log) |
| Python 3.11 有限 audit | exit 0；執行一次 | [audit.log](../../.playroom/tmp/plan49-candidate-beta57/audit.log)；摘要 [zip-audit.json](../../.playroom/tmp/plan49-candidate-beta57/zip-audit.json) |

本批依指示未跑 tests、tsc、browser 或 server。

## 成品雜湊與有限掃描

Source／dist 的 SHA-256 是各自檔案清單（`source-files.sha256`／`dist-files.sha256`）的雜湊；ZIP 雜湊是完整 `game.zip`。

| 項目 | 檔案數／ZIP entries | bytes | SHA-256 |
|---|---:|---:|---|
| Source | 435 files | 135,791,604 | `6e9b12ae41db36b51ce0ceb77f58f9305adceacba9b1a0b64f5df47ee54a5a42` |
| Dist | 274 files | 135,755,101 | `0eae50ef85417a6f15a03a75bbd1882f22da032655abcd24d74856fcf4214b0c` |
| ZIP | 274 entries | 131,528,778 | `6d5afe2557db1a1119ffb55e087772b358d79f9d31a81a8c969c832c2d6d9ddc` |

ZIP 解壓 entries 共 135,755,101 bytes，壓縮 entries 合計 131,480,954 bytes。根目錄 entries 為 `assets`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor`。

有限文字掃描檢查 14 個 entries、1,772,764 bytes、8 類 pattern，findings 為 0；超過 16 MiB 的文字 entries 為 0。pattern 類別：PEM private key header、AWS access key ID、Google API key、GitHub token、Slack token、Stripe secret/restricted key、quoted credential assignment、JWT-like value with encoded JSON header。260 個 binary entries、133,982,337 bytes 未由這些文字 pattern 掃描；這不代表完整 binary 或機密檢查。

真實瀏覽器／跨來源 iframe、遊戲 click 與旅行流程、focus、reader、layout、音效／全螢幕及裝置行為未驗。候選已完成 source 交付及固定工具 ZIP 驗證，尚待 root 處理 GitHub Release；平台人工預覽確認與上架仍未完成。
