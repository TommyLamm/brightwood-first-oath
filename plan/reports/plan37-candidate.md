# Plan 37 候選成品：1.0.0-beta.44

日期：2026-10-29（Asia/Hong_Kong）

## 成品

- 遊戲：`brightwood-first-oath`；作者：`TommyLamm`；裝置：`desktop`。
- 成品目錄：`artifacts/plan37-1.0.0-beta.44/`；Playroom tools：1.2.0。
- ZIP：`artifacts/plan37-1.0.0-beta.44/game.zip`；131,527,564 bytes；SHA-256 `5599063ac50fd6d3b819221510c6ae839e88f2881321f11c537482292bbb58d6`。
- ZIP 有 274 entries，解壓 135,750,316 bytes；根目錄直接含 `game.json`、入口頁、封面及資源。
- Source manifest：429 files、135,766,038 bytes；`source-files.sha256` SHA-256 `36a7bc4bddf3bc467c38a567d415d3f0a4971441499f5a06320298779bfadfd4`。
- Dist manifest：274 files、135,750,316 bytes；`dist-files.sha256` SHA-256 `0e7bd31cbea4a655db72271b4e0490a4e6042212d592126b3f4cbf2d40d554a5`。

## 版本與 metadata

以下六處版本一致為 `1.0.0-beta.44`：`package.json`、`package-lock.json` 頂層、lock 的 `packages[""]`、`public/game.json`、dist `game.json`、ZIP 內 `game.json`。Source、dist、ZIP 的 metadata 也一致：作者 `TommyLamm`、ID `brightwood-first-oath`、裝置 `desktop`、存檔讀取格式 1–5／寫入格式 5。

## 候選驗收

| 步驟 | 執行內容 | Exit |
| --- | --- | ---: |
| Build | Node 24.22.1；Vite build 至新 dist | 0 |
| Pack | Node 24.22.1；`tools/playroom/pack.mjs`，tools 1.2.0 | 0 |
| Validate | Node 24.22.1；`tools/playroom/validate.mjs` 完整 ZIP 驗證 | 0 |
| Audit | Python 3.11.9；本候選 audit 副本 | 0 |

完整命令、原輸出及 exit code 分別記在 `.playroom/tmp/plan37-candidate-beta44/{build,pack,validate,audit}.log`。Audit 比對 8 類文字 pattern，掃描 14 個文字 entries、1,767,979 bytes，finding 為 0；260 個 binary entries、133,982,337 bytes 未掃描，沒有超過 16 MiB 上限的文字 entries。此為有限文字掃描，不代表 binary 檢查。

準備時第一次 audit 路徑 guard 因要求原始碼含連續路徑字串而誤判；該次在 build 前 exit 1，metadata 位元組替換及新目錄已完成，尚未寫 audit 副本。之後按 Path 元件核對目標、記錄所有替換數（`plan36`: 3、`beta43`: 1、`beta.43`: 4），確認副本不含舊標記後一次寫入，再依序完成四個候選步驟。先後與 recovery 輸出保存在 `.playroom/tmp/plan37-candidate-beta44/prepare.log`。

瀏覽器、跨來源 iframe、HUD badge 版面與實際遊戲操作未驗證。未建立 tag、未發布。
