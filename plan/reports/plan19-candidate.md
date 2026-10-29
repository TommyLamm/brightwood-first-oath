# Plan19 W05・beta.25 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；未做瀏覽器驗收或發布**。

## 讀取與適用要求

已讀取 repo `AGENTS.md`、Plan19 §W05 與 [W04 UI 定案報告](plan19-ui-integration.md)、[Playroom 封包與發布邊界](../05-playroom-and-acceptance.md)、[Plan19 交接](plan19-handoff.md)、`package.json`／`package-lock.json`／`public/game.json`、`tools/playroom/pack.mjs`／`validate.mjs`／`tool-runner.mjs` 及 `.playroom/game-tools.lock.json`。主代理在本輪已完整讀取線上 Playroom template 與其中七份 main 規格；本包沿用該讀取結果。

遵循 W05：候選版只升版本 metadata，保留遊戲 ID、desktop devices 與 cloud save 格式；輸出使用獨立目錄與 pinned tools 1.2.0，一次 build、pack、完整 ZIP validate；不發布。source 在 W04 定案及 focused／typecheck 通過後凍結，本包未更改 `src/`、`tests/` 或工具來源。

## 候選與來源指紋

- ID／版本：`brightwood-first-oath`／`1.0.0-beta.25`；schema 2、`devices: ["desktop"]`、讀取 formats 1–5／寫入 format 5 保持不變。`package.json`、lock root fields 與 `public/game.json` 版本相符。
- 候選 dist：[artifacts/plan19-1.0.0-beta.25/dist](../../artifacts/plan19-1.0.0-beta.25/dist/)。ZIP：[game.zip](../../artifacts/plan19-1.0.0-beta.25/game.zip)。
- Source 指紋在版本 metadata 更新後、build 前計算：411 files／135,679,768 bytes；manifest SHA-256 `7f142d8c1bd4610f2d149a23a537e241c92ab850a9ffc7b29eff28e9a3d82e01`。範圍含 `src/`、`public/`、`tests/`、`tools/`、root build／package metadata 與 pinned tools lock；逐檔清單：[source-files.sha256](../../artifacts/plan19-1.0.0-beta.25/source-files.sha256)。
- Dist 指紋：274 files／135,739,133 bytes；manifest SHA-256 `b6fc9a5e15e30f83276c406b396342a4559514dc4d83d0fb2b1ba842b77b5fa5`；逐檔清單：[dist-files.sha256](../../artifacts/plan19-1.0.0-beta.25/dist-files.sha256)。

## 實際封包檢查

- Node：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`，`v24.22.1`；執行前將該 Node `bin` 目錄加到 `PATH` 前方。
- 一次 build：`node_modules/vite/bin/vite.js build --outDir artifacts/plan19-1.0.0-beta.25/dist`；Vite 8.3.4，exit 0。完整輸出：[build.log](../../.playroom/tmp/plan19-candidate-beta25/build.log)。
- 固定 Playroom tools `1.2.0`；lock archive SHA-256 `24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022`。一次執行 `tools/playroom/pack.mjs artifacts/plan19-1.0.0-beta.25/dist artifacts/plan19-1.0.0-beta.25/game.zip`，exit 0；一次執行 `tools/playroom/validate.mjs artifacts/plan19-1.0.0-beta.25/game.zip`，完整 validate exit 0，回報 `Valid: brightwood-first-oath v1.0.0-beta.25 (tools 1.2.0)`。輸出：[pack.log](../../.playroom/tmp/plan19-candidate-beta25/pack.log)、[validate.log](../../.playroom/tmp/plan19-candidate-beta25/validate.log)。
- ZIP SHA-256：`6d163dd87986f99336123f7c579c93084b433fc8288983f65e6857c0d3fc8731`；131,524,372 bytes；274 entries，解壓 135,739,133 bytes；壓縮資料 131,476,548 bytes。根項目：`assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/`。
- 有限文字 secret-pattern scan：掃描 14 個 `.html`／`.js`／`.mjs`／`.cjs`／`.css`／`.json`／`.svg`／`.xml`／`.txt`／`.webmanifest` entries，合計 1,756,796 bytes；8 類 marker/token/JWT-like/長 credential assignment pattern，0 命中。沒有超過 16 MiB 而跳過的文字 entry。260 個 binary entries／133,982,337 bytes 未掃描；此結果只代表上述有限文字掃描，不代表通用 binary 或語義式 secret audit。摘要：[zip-audit.json](../../.playroom/tmp/plan19-candidate-beta25/zip-audit.json)。

## 未驗項目

本包沒有重跑 tests、typecheck、content check 或 browser；沿用本輪既有 helper focused 結果與 W04 最終 typecheck exit 0。W06 局部瀏覽器操作尚未執行，因此鍵位重綁、商店單擊與背包 focus 的實際遊戲互動仍未驗。沒有 commit、push、tag、Release、平台 preview 或上架。
