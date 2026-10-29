# Plan 38 候選成品：1.0.0-beta.45

- 候選：`brightwood-first-oath`；作者 `TommyLamm`；Playroom tools `1.2.0`。
- 狀態：SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED；未發布。
- 成品目錄：`artifacts/plan38-1.0.0-beta.45/`。

## 執行步驟

| 步驟 | 結果 | 完整命令、輸出與 exit code |
|---|---:|---|
| Vite build（指定 Node 24.22.1 runtime） | exit 0 | `.playroom/tmp/plan38-candidate-beta45/build.log` |
| Playroom pack | exit 0 | `.playroom/tmp/plan38-candidate-beta45/pack.log` |
| 完整 ZIP validate | exit 0 | `.playroom/tmp/plan38-candidate-beta45/validate.log` |
| Python 3.11 audit | exit 0 | `.playroom/tmp/plan38-candidate-beta45/audit.log` |

準備命令 exit 0 記於 `.playroom/tmp/plan38-candidate-beta45/prepare.log`。版本 metadata 精確替換數為 `package.json` 1、`package-lock.json` 2、`public/game.json` 1。Audit 由 beta44 唯讀來源複製；依內容實際替換 `plan37` 3、`beta44` 1、`beta.44` 4 次，舊標記均為 0。Path 元件解析到本候選的 artifact、dist、ZIP 與 tmp 目錄。

## 成品與 metadata

| 項目 | 檔案數／ZIP entries | bytes | SHA-256 |
|---|---:|---:|---|
| Source manifest（`source-files.sha256`） | 429 | 135,767,311 | `5dc8ac4e26faeb407f000343212049099d581ddcc7bbf64409994ad3abdf5747` |
| Dist manifest（`dist-files.sha256`） | 274 | 135,751,067 | `fc0ccb9add021f804d854ebc9b02c84ddb88219fb73ec2530daa9402ffad0f3c` |
| ZIP（`game.zip`，compressed） | 274 | 131,527,807 | `5ace85a01d4df9f07ac0532a3d6b5128ad00a3894809981dc6401948749b6d4d` |

ZIP 解壓後為 135,751,067 bytes。以下六處版本均為 `1.0.0-beta.45`：`package.json`、`package-lock.json` 頂層、lock 的 `packages[""]`、source `public/game.json`、dist `game.json`、ZIP 內 `game.json`。Source、dist、ZIP metadata 一致：作者 `TommyLamm`、ID `brightwood-first-oath`、裝置 `desktop`、存檔讀取格式 1–5／寫入格式 5。

## 有限文字掃描與限制

Audit 對 14 個文字 entries、1,768,730 bytes 執行 8 類 pattern 掃描，findings 為 0；涵蓋 PEM 私鑰標頭、AWS／Google／GitHub／Slack／Stripe 憑證、引號包住的 credential assignment、JWT-like 值。260 個 binary entries、133,982,337 bytes 未掃描；沒有超過 16 MiB 的文字 entries。這不是完整 binary 檢查。

沒有執行 tests、tsc 或瀏覽器驗收；真實 UI、讀屏、拖動／change 與音訊行為未驗證。舊版 beta44 及其成品保留。