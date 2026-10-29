# Plan22 W03・beta.29 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；BROWSER_UNVERIFIED；未發布**。

## 規格與範圍

已讀根 `AGENTS.md`、[Plan22](../22-quest-claim-feedback.md)、[W01 計算與 app 報告](plan22-quest-claim.md)、[W02 UI 報告](plan22-ui-integration.md)、[Plan22 handoff](plan22-handoff.md)、[Plan21 候選報告](plan21-candidate.md)，以及 `tools/playroom/pack.mjs`、`tools/playroom/validate.mjs`。Playroom 線上模板與七份 main 規格（含尾段）由本批主代理完整讀取，本候選沿用其規範與驗收範圍。

建立前確認 `artifacts/plan22-1.0.0-beta.29/`、本報告與 `.playroom/tmp/plan22-candidate-beta29/` 均不存在，`git tag --list '*beta.29*'` 無既有匹配。W03 僅將 `package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 版本更新為 `1.0.0-beta.29`，並新增本候選、報告與稽核暫存。作者 `TommyLamm`、ID `brightwood-first-oath`、devices `desktop`、cloudSave readable formats 1–5／write format 5、Playroom tools `1.2.0` 均維持不變。

## 候選與 metadata

- 候選：`brightwood-first-oath`／`1.0.0-beta.29`。
- [Dist](../../artifacts/plan22-1.0.0-beta.29/dist/)；[ZIP](../../artifacts/plan22-1.0.0-beta.29/game.zip)。
- package、lock 頂層、lock root、source `game.json`、dist `game.json`、ZIP `game.json` 六個版本值均為 `1.0.0-beta.29`。Source、dist、ZIP 的 author、id、devices、cloudSave 一致。
- Node `v24.22.1`；Vite `8.3.4`；Playroom tools `1.2.0`。

## Source、dist 與 ZIP 識別

- Source 清單涵蓋 `.playroom/game-tools.lock.json`、根 README／index／package metadata／tsconfig／vite config，以及 `public/`、`src/`、`tests/`、`tools/`：419 files／135,719,524 bytes；清單 SHA-256 `2e4e52be6a00ed396444f6452e9d7ef99906599fa45fa8aaf9f3f282e7547e5f`：[source-files.sha256](../../artifacts/plan22-1.0.0-beta.29/source-files.sha256)。
- Dist 清單：274 files／135,742,815 bytes；清單 SHA-256 `8ec99a5fa33478d46506f428a83a28f43f30b8c74b4e0344be12208d18b5c977`：[dist-files.sha256](../../artifacts/plan22-1.0.0-beta.29/dist-files.sha256)。清單按相對路徑排序，每行列出單檔 SHA-256；以上 SHA-256 為清單檔本身雜湊。
- ZIP SHA-256 `7280d3190fb71d01c960a31f35dc998e3b5df511587e82633979afa19bbcc217`；131,525,359 bytes；274 entries；解壓 135,742,815 bytes、壓縮資料 131,477,535 bytes。根項目：`assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/`。
- 有限文字掃描在 ZIP 內掃描 `.html`／`.js`／`.mjs`／`.cjs`／`.css`／`.json`／`.svg`／`.xml`／`.txt`／`.webmanifest`，14 entries／1,760,478 bytes。8 類規則為 PEM private-key header、AWS access-key ID、Google API key、GitHub token、Slack token、Stripe secret/restricted key、引號包住的 credential assignment，以及 `eyJ` JSON-header 起始的三段 JWT-like 值；0 命中。260 個其他副檔名 entries／133,982,337 bytes 未掃描；超過 16 MiB 而略過的文字 entry 為 0。這是有限文字 pattern scan，非 binary audit。摘要及沿用後改路徑的一次性腳本：[zip-audit.json](../../.playroom/tmp/plan22-candidate-beta29/zip-audit.json)、[audit_candidate.py](../../.playroom/tmp/plan22-candidate-beta29/audit_candidate.py)。

## Build、封包與驗證

使用 `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`，並將其 `bin` 置於 `PATH` 前方；每項命令各執行一次：

1. `node.exe node_modules/vite/bin/vite.js build --outDir artifacts/plan22-1.0.0-beta.29/dist`：exit 0；74 modules transformed。[build.log](../../.playroom/tmp/plan22-candidate-beta29/build.log)
2. `node.exe tools/playroom/pack.mjs artifacts/plan22-1.0.0-beta.29/dist artifacts/plan22-1.0.0-beta.29/game.zip`：exit 0；輸出 `Packed brightwood-first-oath v1.0.0-beta.29 (tools 1.2.0)`。[pack.log](../../.playroom/tmp/plan22-candidate-beta29/pack.log)
3. `node.exe tools/playroom/validate.mjs artifacts/plan22-1.0.0-beta.29/game.zip`：exit 0；輸出 `Valid: brightwood-first-oath v1.0.0-beta.29 (tools 1.2.0)`。[validate.log](../../.playroom/tmp/plan22-candidate-beta29/validate.log)
4. 沿用 [Plan21 稽核腳本](../../.playroom/tmp/plan21-candidate-beta28/audit_candidate.py) 的複本，僅更新新候選／暫存路徑與版本後執行一次；原腳本未修改。[audit.log](../../.playroom/tmp/plan22-candidate-beta29/audit.log)

## 沿用結果與未驗項目

- W01 七個不同新 focused 案例及精選三個 app 案例、W02 一次 `tsc --noEmit` 均依 [W01](plan22-quest-claim.md)／[W02](plan22-ui-integration.md) 報告通過；本候選包依指定未重跑 tests 或 typecheck。
- 未啟動 browser；NPC領獎實際點擊、runtime 距離 gate、queue 狀態及視覺未驗。未執行 commit／push／tag、Release 或平台發布。
