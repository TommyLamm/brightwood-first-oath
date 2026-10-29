# Plan24 W02・beta.31 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；BROWSER_UNVERIFIED；未發布**。

## 規格與範圍

依根 `AGENTS.md`、[Plan24 context](../24-keybinding-control-context.md)、[W01 重綁名稱與群組報告](plan24-keybinding-ui.md)、[Plan23 候選報告](plan23-candidate.md)，以及 `tools/playroom/pack.mjs`、`tools/playroom/validate.mjs` 執行本地候選封包。主代理本批已完整讀取 Playroom 遊戲範本及其「開始前讀取線上規格」列出的七份 main 文件（含尾段）；本批沿用其中固定專案識別與資源規格。

候選使用 `1.0.0-beta.31`；主代理開始前已確認 beta.31 目錄/tag 未使用，本批執行前亦確認 artifact、報告與暫存目標目錄均不存在。只將 `package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 版本更新至 beta.31。作者 `TommyLamm`、ID `brightwood-first-oath`、devices `desktop`、cloudSave readable formats 1–5／write format 5、Playroom tools `1.2.0` 均保留。未修改商店或背包範圍。

## 候選與 metadata

- 候選：`brightwood-first-oath`／`1.0.0-beta.31`。
- [Dist](../../artifacts/plan24-1.0.0-beta.31/dist/)；[ZIP](../../artifacts/plan24-1.0.0-beta.31/game.zip)。
- package、lock 頂層、lock root、source `game.json`、dist `game.json`、ZIP `game.json` 六個版本值皆為 `1.0.0-beta.31`。Source、dist、ZIP 的 author、id、devices、cloudSave 一致。
- Node `v24.22.1`；Vite `8.3.4`；Playroom tools `1.2.0`。

## Source、dist 與 ZIP 識別

- Source 清單含 `.playroom/game-tools.lock.json`、根 README／index／package metadata／tsconfig／vite config，以及 `public/`、`src/`、`tests/`、`tools/`：419 files／135,721,315 bytes；清單 SHA-256 `1b43678f2533cbf9f9b7c13bd739b2495ef9af691ef631820eb3e6c122d4cd35`：[source-files.sha256](../../artifacts/plan24-1.0.0-beta.31/source-files.sha256)。
- Dist 清單：274 files／135,743,890 bytes；清單 SHA-256 `2062867ab603f00a7713c532ab98fe6da6d98b82b4542b8754a4d58b4fdfe915`：[dist-files.sha256](../../artifacts/plan24-1.0.0-beta.31/dist-files.sha256)。清單依相對路徑排序，每行列出單檔 SHA-256；報告的 SHA-256 是清單檔本身雜湊。
- ZIP SHA-256 `c9553ab088a5d7915651944c326621d92b7bf7fe8d43860aa1b04531089d891d`；131,525,666 bytes；274 entries；解壓 135,743,890 bytes、壓縮資料 131,477,842 bytes。
- 有限文字掃描在 ZIP 內掃描 `.html`／`.js`／`.mjs`／`.cjs`／`.css`／`.json`／`.svg`／`.xml`／`.txt`／`.webmanifest`，14 entries／1,761,553 bytes。8 類規則為 PEM private-key header、AWS access-key ID、Google API key、GitHub token、Slack token、Stripe secret/restricted key、引號包住的 credential assignment，以及以編碼 JSON header 開始的 JWT-like 三段值；0 命中。其餘 260 個非掃描文字類型項目／133,982,337 bytes 未掃描；超過 16 MiB 而略過的文字 entry 為 0。這是有限文字 pattern scan，非 binary audit。摘要及本批路徑版的一次性腳本：[zip-audit.json](../../.playroom/tmp/plan24-candidate-beta31/zip-audit.json)、[audit_candidate.py](../../.playroom/tmp/plan24-candidate-beta31/audit_candidate.py)。

## Build、封包與驗證

以 `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`（`v24.22.1`）執行，並將其 `bin` 放在 `PATH` 前方；build、固定 pack、完整 ZIP validate 各一次：

1. `node.exe node_modules/vite/bin/vite.js build --outDir artifacts/plan24-1.0.0-beta.31/dist`：exit 0；74 modules transformed。[build.log](../../.playroom/tmp/plan24-candidate-beta31/build.log)
2. `node.exe tools/playroom/pack.mjs artifacts/plan24-1.0.0-beta.31/dist artifacts/plan24-1.0.0-beta.31/game.zip`：exit 0；輸出 `Packed brightwood-first-oath v1.0.0-beta.31 (tools 1.2.0)`。[pack.log](../../.playroom/tmp/plan24-candidate-beta31/pack.log)
3. `node.exe tools/playroom/validate.mjs artifacts/plan24-1.0.0-beta.31/game.zip`：exit 0；輸出 `Valid: brightwood-first-oath v1.0.0-beta.31 (tools 1.2.0)`。[validate.log](../../.playroom/tmp/plan24-candidate-beta31/validate.log)
4. 複製 Plan23 一次性 audit 腳本，僅替換本批候選／暫存路徑及版本後執行一次；原腳本未修改，exit 0。[audit.log](../../.playroom/tmp/plan24-candidate-beta31/audit.log)

## 沿用結果與未驗項目

- W01 的 `tsc --noEmit` exit 0 見 [W01 報告](plan24-keybinding-ui.md)；此候選依指定未重跑 typecheck，也未跑 tests。
- 未啟動 browser。Plan24 重綁控件的 click、keyboard、screen-reader 與 layout 均未實測；候選封包驗證不代表上述互動、輔助科技朗讀或版面通過。
- 未執行 commit／push／tag、Release 或平台發布。