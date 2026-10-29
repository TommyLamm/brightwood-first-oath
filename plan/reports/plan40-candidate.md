# Plan 40 候選成品：1.0.0-beta.47

- 候選：`brightwood-first-oath`；作者 `TommyLamm`；Playroom tools `1.2.0`。
- 狀態：SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED；未發布。
- 成品目錄：`artifacts/plan40-1.0.0-beta.47/`。
- 本次只將三份 source metadata 的舊版本精確替換為 `1.0.0-beta.47`；Plan 39 舊成品及其他既有 dirty work 保留。

## 執行步驟

| 步驟 | 結果 | 完整命令、輸出與 exit code |
|---|---:|---|
| Metadata 更新、audit 副本與 Path 元件解析 | exit 0 | `.playroom/tmp/plan40-candidate-beta47/prepare.log` |
| 指定 Node 24.22.1 的 Vite build | exit 0 | `.playroom/tmp/plan40-candidate-beta47/build.log` |
| Playroom pack | exit 0 | `.playroom/tmp/plan40-candidate-beta47/pack.log` |
| 完整 ZIP validate | exit 0 | `.playroom/tmp/plan40-candidate-beta47/validate.log` |
| 指定 Python 3.11 audit | exit 0 | `.playroom/tmp/plan40-candidate-beta47/audit.log` |

Audit 由唯讀 `.playroom/tmp/plan39-candidate-beta46/audit_candidate.py` 複製；依內容替換 `plan39` 3 處、`beta46` 1 處、`beta.46` 4 處，替換後舊標記均為 0。以 AST 解析及 `Path.resolve()` 核對後，audit 的 `artifact`、`dist`、`zip_path`、`tmp` 分別解析至 `artifacts/plan40-1.0.0-beta.47`、其 `dist`、`game.zip` 及 `.playroom/tmp/plan40-candidate-beta47`。

## 成品與 metadata

| 項目 | 檔案數／ZIP entries | bytes | SHA-256 |
|---|---:|---:|---|
| Source manifest（`source-files.sha256`） | 429 | 135,767,864 | `3b0b26fb4019263e08fc4e8553d3e4370da57a03debd5a7e3b068d838d365c29` |
| Dist manifest（`dist-files.sha256`） | 274 | 135,751,289 | `e7d73723ff1967e9dcfffc8f422ce15b66b58c1213191c3163ee83c8fe01cb58` |
| ZIP（`game.zip`） | 274 | 131,527,889 | `6fd40b0d48792f05bb5c0f4a8e5d88c41091184af416b6cff662f004d6d05acc` |

ZIP 解壓後為 135,751,289 bytes，壓縮 entries 合計 131,480,065 bytes。以下六處版本一致為 `1.0.0-beta.47`：`package.json`、`package-lock.json` 頂層、`package-lock.json` 的 `packages[""]`、source `public/game.json`、dist `game.json`、ZIP 內 `game.json`。Source、dist、ZIP metadata 一致：作者 `TommyLamm`、ID `brightwood-first-oath`、裝置 `desktop`、存檔讀取格式 1–5／寫入格式 5。

## 有限文字掃描與限制

Audit 對 14 個文字 entries、1,768,952 bytes 執行 8 類 pattern 掃描，findings 為 0；涵蓋 PEM 私鑰標頭、AWS／Google／GitHub／Slack／Stripe 憑證、引號包住的 credential assignment、JWT-like 值。260 個 binary entries、133,982,337 bytes 未掃描；超過 16 MiB 的文字 entries 為 0。這不是完整 binary 檢查。

本次 W02 未執行 tests、tsc、browser 或 server；Plan 40 W01 指定的單次 tsc 已由 root 審閱接受，這裡沒有重跑。遊戲內實際 click、focus、冷卻到期、layout 與讀屏仍未由 browser 驗證；本候選未發布。
