# Plan 39 候選成品：1.0.0-beta.46

- 候選：`brightwood-first-oath`；作者 `TommyLamm`；Playroom tools `1.2.0`。
- 狀態：SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED；未發布。
- 成品目錄：`artifacts/plan39-1.0.0-beta.46/`。

## 執行步驟

| 步驟 | 結果 | 完整命令、輸出與 exit code |
|---|---:|---|
| Metadata 與 audit 副本準備 | exit 0 | `.playroom/tmp/plan39-candidate-beta46/prepare.log` |
| 指定 Node runtime 的 Vite build | exit 0 | `.playroom/tmp/plan39-candidate-beta46/build.log` |
| Playroom pack | exit 0 | `.playroom/tmp/plan39-candidate-beta46/pack.log` |
| 完整 ZIP validate | exit 0 | `.playroom/tmp/plan39-candidate-beta46/validate.log` |
| Python 3.11 audit | exit 0 | `.playroom/tmp/plan39-candidate-beta46/audit.log` |

Metadata 精確替換數：`package.json` 1、`package-lock.json` 2、`public/game.json` 1。Audit 由 beta45 唯讀來源複製到新 tmp；依內容實際替換 `plan38` 3、`beta45` 1、`beta.45` 4 次，舊標記均為 0。Audit 的 Path 元件解析結果為 `artifacts/plan39-1.0.0-beta.46`、其 `dist`、`game.zip` 與 `.playroom/tmp/plan39-candidate-beta46`。

## 成品與 metadata

| 項目 | 檔案數／ZIP entries | bytes | SHA-256 |
|---|---:|---:|---|
| Source manifest（`source-files.sha256`） | 429 | 135,767,411 | `8366413b8a7c05907fea8da97eceb6f25180d39236fbe4081b6bae7015f05952` |
| Dist manifest（`dist-files.sha256`） | 274 | 135,751,108 | `e3b7cdbd228e025b0fefaf2d24ed7be3d54593cf9b2b7ae1504897406431f10d` |
| ZIP（`game.zip`，compressed） | 274 | 131,527,831 | `06233d285e565db2d799fcd1d806619f014c81fbf7bd205088ffd270fdf71afd` |

ZIP 解壓後為 135,751,108 bytes。以下六處版本均為 `1.0.0-beta.46`：`package.json`、`package-lock.json` 頂層、lock 的 `packages[""]`、source `public/game.json`、dist `game.json`、ZIP 內 `game.json`。Source、dist、ZIP metadata 一致：作者 `TommyLamm`、ID `brightwood-first-oath`、裝置 `desktop`、存檔讀取格式 1–5／寫入格式 5。

## 有限文字掃描與限制

Audit 對 14 個文字 entries、1,768,771 bytes 執行 8 類 pattern 掃描，findings 為 0；涵蓋 PEM 私鑰標頭、AWS／Google／GitHub／Slack／Stripe 憑證、引號包住的 credential assignment、JWT-like 值。260 個 binary entries、133,982,337 bytes 未掃描；沒有超過 16 MiB 的文字 entries。這不是完整 binary 檢查。

本候選步驟未執行 tests、tsc 或瀏覽器驗收；真實 UI 點擊、focus、版面與讀屏未驗證。beta45 舊候選保留。
