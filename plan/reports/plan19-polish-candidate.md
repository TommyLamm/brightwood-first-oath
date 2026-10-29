# Plan19 輸入修整後 beta.26 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；未做瀏覽器驗收或發布**。

## 讀取與適用要求

已讀取 repo `AGENTS.md`、`plan/reports/plan19-input-polish.md`、`plan/reports/plan19-candidate.md`、`tools/playroom/pack.mjs`、`tools/playroom/validate.mjs`、`tools/playroom/tool-runner.mjs`、`.playroom/game-tools.lock.json` 及 package/manifest metadata。沿用主代理本輪已完整讀取的線上 `game-agent-template.md` 與其列出的七份主規格：game-development、command-contracts、game.schema、game-release workflow、playroom-sdk、sdk-versioning、save-compatibility。

遵循輸入修整報告的定案 source：交易數量 `onInput` 不再略過 invalid draft，pending binding 忽略 repeat；不在本封包輪修改 `src/`、`tests/` 或工具。只把 `package.json`、`package-lock.json` root 與 root package entry、`public/game.json` 的版本升到 `1.0.0-beta.26`；遊戲 ID、schema 2、`devices: ["desktop"]`、cloud save readable formats 1–5／write format 5 不變。beta.25 成品保留原樣。

## 候選與來源指紋

- 候選：`brightwood-first-oath`／`1.0.0-beta.26`。
- Dist：[artifacts/plan19-1.0.0-beta.26/dist](../../artifacts/plan19-1.0.0-beta.26/dist/)，ZIP：[game.zip](../../artifacts/plan19-1.0.0-beta.26/game.zip)。
- Source 指紋在版本 metadata 更新後、build 前計算：411 files／135,679,741 bytes；manifest SHA-256 `9678805ba35ddfefa94e7e5d4de12ef5c978f7c07c7424e845786a357292bbd4`。範圍含 `.playroom/game-tools.lock.json`、根目錄 README/index/package metadata/tsconfig/vite config，以及 `public/`、`src/`、`tests/`、`tools/` 全部檔案；逐檔清單：[source-files.sha256](../../artifacts/plan19-1.0.0-beta.26/source-files.sha256)。
- Dist 指紋：274 files／135,739,109 bytes；manifest SHA-256 `9e5e50d4bdb6042120d9c04bdcf894fd3278a487a4a2006c68b527dc54af4fb3`；逐檔清單：[dist-files.sha256](../../artifacts/plan19-1.0.0-beta.26/dist-files.sha256)。

## Build、封包與驗證

- Node：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`，v24.22.1；執行前將其 `bin` 目錄加到 `PATH` 前方。
- Playroom pinned tools 1.2.0；lock archive SHA-256 `24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022`。
- 一次 build：`node_modules/vite/bin/vite.js build --outDir artifacts/plan19-1.0.0-beta.26/dist`；Vite 8.3.4，exit 0。輸出：[build.log](../../.playroom/tmp/plan19-candidate-beta26/build.log)。
- 一次 pack：`tools/playroom/pack.mjs artifacts/plan19-1.0.0-beta.26/dist artifacts/plan19-1.0.0-beta.26/game.zip`，exit 0；一次 full validate：`tools/playroom/validate.mjs artifacts/plan19-1.0.0-beta.26/game.zip`，exit 0，回報 `Valid: brightwood-first-oath v1.0.0-beta.26 (tools 1.2.0)`。輸出：[pack.log](../../.playroom/tmp/plan19-candidate-beta26/pack.log)、[validate.log](../../.playroom/tmp/plan19-candidate-beta26/validate.log)。
- ZIP SHA-256：`ffbc45ef7143eed6ae1c5a2a93321f5e5c38cb7aed57659e7525d339c3330580`；131,524,359 bytes；274 entries，解壓 135,739,109 bytes、壓縮資料 131,476,535 bytes。根項目：`assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/`。
- 有限文字 secret-pattern scan：掃描 14 個 `.html`／`.js`／`.mjs`／`.cjs`／`.css`／`.json`／`.svg`／`.xml`／`.txt`／`.webmanifest` entries，合計 1,756,772 bytes；8 類 PEM／AWS／GitHub／Slack／Stripe live／Google API／JWT-like／credential assignment pattern，0 命中，沒有超過 16 MiB 而跳過的文字 entry。260 個 binary entries／133,982,337 bytes 未掃描；這不是通用 binary 或語義式 secret audit。摘要：[zip-audit.json](../../.playroom/tmp/plan19-candidate-beta26/zip-audit.json)。

## 未驗項目

本輪沒有重跑 tests、typecheck 或 content check；`plan19-input-polish.md` 記錄 source 定案後的一次 bundled Node `tsc --noEmit` exit 0。沒有做 browser／DOM 操作驗收，沒有 commit、push、tag、Release、平台 preview 或上架。