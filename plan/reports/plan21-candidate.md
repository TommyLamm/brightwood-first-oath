# Plan21 W03・beta.28 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；BROWSER_UNVERIFIED；未發布**。

## 規格與範圍

已讀根 `AGENTS.md`、[Plan21](../21-material-sale-feedback.md)、[W01模型報告](plan21-material-sale-preview.md)、[W02 UI報告](plan21-ui-integration.md)、[Plan21 handoff](plan21-handoff.md)、[Plan20 beta.27候選報告](plan20-candidate.md)，以及 `tools/playroom/pack.mjs`、`tools/playroom/validate.mjs`。沿用主代理本輪已完整網讀的 Playroom `game-agent-template.md` 與其中七份 main 規格（含 game-development 尾段）。適用要求為固定遊戲ID與desktop manifest、存檔相容格式不變、使用鎖定 Playroom tools、升版後建立新候選並完整ZIP驗證；不發布、不 commit／push／tag。

在本任務開始時既有的 beta.27 工作樹上，本包僅將 `package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 的版本改為 `1.0.0-beta.28`，並新增本候選與本報告。候選目錄、報告路徑及暫存路徑在建立前均不存在；核對時 `1.0.0-beta.28` tag 未使用。作者 `TommyLamm`、ID `brightwood-first-oath`、devices `desktop`、cloudSave readable formats 1–5／write format 5、Playroom tools `1.2.0` 維持不變。

## 候選與 metadata

- 候選：`brightwood-first-oath`／`1.0.0-beta.28`。
- [Dist](../../artifacts/plan21-1.0.0-beta.28/dist/)；[ZIP](../../artifacts/plan21-1.0.0-beta.28/game.zip)。
- package／lock頂層／lock root／source `game.json`／dist `game.json`／ZIP `game.json` 六個版本值皆為 `1.0.0-beta.28`。Source、dist、ZIP的作者、ID、devices、cloudSave一致。
- Node `v24.22.1`；Vite `8.3.4`；Playroom tools `1.2.0`。

## Source、dist 與 ZIP 識別

- Source清單涵蓋 `.playroom/game-tools.lock.json`、根 README／index／package metadata／tsconfig／vite config，以及 `public/`、`src/`、`tests/`、`tools/`：417 files／135,709,710 bytes；清單 SHA-256 `7c26a734c1159f4bc6f36ee089bb5019d8b47adbf1e9698bfe74b1afb463abe0`：[source-files.sha256](../../artifacts/plan21-1.0.0-beta.28/source-files.sha256)。
- Dist清單：274 files／135,742,418 bytes；清單 SHA-256 `8c83f1406d5f82225e5828fa4f8eb1182c92c05615ee195b866761c561098ac4`：[dist-files.sha256](../../artifacts/plan21-1.0.0-beta.28/dist-files.sha256)。清單按相對路徑排序，每行列單檔 SHA-256；上述清單雜湊為清單檔本身 SHA-256。
- ZIP SHA-256 `37d9749d6b5c60b7fbb7f9435869c8f347e9a5b8e6d90f8cdb8e4640cc545540`；131,525,250 bytes；274 entries；解壓 135,742,418 bytes、壓縮資料 131,477,426 bytes。根項目：`assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/`。
- 有限文字掃描在 ZIP 內掃描 `.html`／`.js`／`.mjs`／`.cjs`／`.css`／`.json`／`.svg`／`.xml`／`.txt`／`.webmanifest`，共14 entries／1,760,081 bytes。8類規則為 PEM private-key header、AWS access-key ID、Google API key、GitHub token、Slack token、Stripe secret/restricted key、引號包住的 credential assignment，以及 `eyJ` JSON-header 起始的三段 JWT-like 值；0 命中。260個其他副檔名 entries／133,982,337 bytes 未掃描；超過16 MiB而略過的文字 entry為0。這是有限文字 pattern scan，非binary audit。摘要及一次性腳本：[zip-audit.json](../../.playroom/tmp/plan21-candidate-beta28/zip-audit.json)、[audit_candidate.py](../../.playroom/tmp/plan21-candidate-beta28/audit_candidate.py)。

## Build、封包與驗證

使用 `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`，並將其 `bin` 置於 `PATH` 前方後，每項命令各執行一次：

1. `node.exe node_modules/vite/bin/vite.js build --outDir artifacts/plan21-1.0.0-beta.28/dist`：exit 0；73 modules transformed。[build.log](../../.playroom/tmp/plan21-candidate-beta28/build.log)
2. `node.exe tools/playroom/pack.mjs artifacts/plan21-1.0.0-beta.28/dist artifacts/plan21-1.0.0-beta.28/game.zip`：exit 0；輸出 `Packed brightwood-first-oath v1.0.0-beta.28 (tools 1.2.0)`。[pack.log](../../.playroom/tmp/plan21-candidate-beta28/pack.log)
3. `node.exe tools/playroom/validate.mjs artifacts/plan21-1.0.0-beta.28/game.zip`：exit 0；輸出 `Valid: brightwood-first-oath v1.0.0-beta.28 (tools 1.2.0)`。[validate.log](../../.playroom/tmp/plan21-candidate-beta28/validate.log)

## 沿用結果與未驗項目

- W01六個 focused tests 依[報告](plan21-material-sale-preview.md)一次通過；W02 `tsc --noEmit` 依[報告](plan21-ui-integration.md)一次 exit 0。本候選包沿用上述結果，沒有重跑 tests 或 typecheck。
- 未啟動 browser；商店實際點擊、runtime 距離 gate、queue 狀態及視覺仍未驗。未執行發布、commit／push／tag 或建立正式平台版本。
