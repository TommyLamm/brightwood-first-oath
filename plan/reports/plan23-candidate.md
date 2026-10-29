# Plan23 W02・beta.30 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；BROWSER_UNVERIFIED；未發布**。

## 規格與範圍

依根 `AGENTS.md`、[Plan23](../23-inventory-category-clarity.md)、[W01 背包呈現報告](plan23-inventory-ui.md)、[Plan22 候選報告](plan22-candidate.md)，以及 `tools/playroom/pack.mjs`、`tools/playroom/validate.mjs` 執行本地候選封包。Playroom 線上範本與七份 main 規格（含尾段）由本批主代理完整讀取，沿用其規範。

建立前確認 `artifacts/plan23-1.0.0-beta.30/`、本報告、`.playroom/tmp/plan23-candidate-beta30/` 均不存在，且 `git tag --list '*beta.30*'` 沒有匹配。僅將 `package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 版本更新至 `1.0.0-beta.30`；author `TommyLamm`、ID `brightwood-first-oath`、devices `desktop`、cloudSave readable formats 1–5／write format 5、Playroom tools `1.2.0` 維持不變。未改商店或領獎相關範圍。

## 候選與 metadata

- 候選：`brightwood-first-oath`／`1.0.0-beta.30`。
- [Dist](../../artifacts/plan23-1.0.0-beta.30/dist/)；[ZIP](../../artifacts/plan23-1.0.0-beta.30/game.zip)。
- package、lock 頂層、lock root、source `game.json`、dist `game.json`、ZIP `game.json` 六個版本值皆為 `1.0.0-beta.30`。Source、dist、ZIP 的 author、id、devices、cloudSave 一致。
- Node `v24.22.1`；Vite `8.3.4`；Playroom tools `1.2.0`。

## Source、dist 與 ZIP 識別

- Source 清單含 `.playroom/game-tools.lock.json`、根 README／index／package metadata／tsconfig／vite config，以及 `public/`、`src/`、`tests/`、`tools/`：419 files／135,720,831 bytes；清單 SHA-256 `622bc351a35049bf38566e9fcb44218f7452ceeb68055f02752076d53b04ee79`：[source-files.sha256](../../artifacts/plan23-1.0.0-beta.30/source-files.sha256)。
- Dist 清單：274 files／135,743,656 bytes；清單 SHA-256 `57783dec903a68c6562a05f098f74d3982ec8ba0f6160c6dd98be7a2faf83520`：[dist-files.sha256](../../artifacts/plan23-1.0.0-beta.30/dist-files.sha256)。清單依相對路徑排序，每行列出單檔 SHA-256；上述 SHA-256 是清單檔本身雜湊。
- ZIP SHA-256 `d4d31635a3f0575e4f766fa6956f8b8d2cc631d51ac76553d09e7227f11eb5fc`；131,525,605 bytes；274 entries；解壓 135,743,656 bytes、壓縮資料 131,477,781 bytes。根項目：`assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/`。
- 有限文字掃描在 ZIP 內掃描 `.html`／`.js`／`.mjs`／`.cjs`／`.css`／`.json`／`.svg`／`.xml`／`.txt`／`.webmanifest`，14 entries／1,761,319 bytes。8 類規則為 PEM private-key header、AWS access-key ID、Google API key、GitHub token、Slack token、Stripe secret/restricted key、引號包住的 credential assignment，以及以編碼 JSON header 開始的 JWT-like 三段值；0 命中。其餘 260 個非掃描文字類型項目／133,982,337 bytes 未掃描；超過 16 MiB 而略過的文字 entry 為 0。這是有限文字 pattern scan，非 binary audit。摘要及本批路徑版的一次性腳本：[zip-audit.json](../../.playroom/tmp/plan23-candidate-beta30/zip-audit.json)、[audit_candidate.py](../../.playroom/tmp/plan23-candidate-beta30/audit_candidate.py)。

## Build、封包與驗證

使用 `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`，版本 `v24.22.1`，並將其 `bin` 置於 `PATH` 前方；build、固定 pack、完整 ZIP validate 各執行一次：

1. `node.exe node_modules/vite/bin/vite.js build --outDir artifacts/plan23-1.0.0-beta.30/dist`：exit 0；74 modules transformed。[build.log](../../.playroom/tmp/plan23-candidate-beta30/build.log)
2. `node.exe tools/playroom/pack.mjs artifacts/plan23-1.0.0-beta.30/dist artifacts/plan23-1.0.0-beta.30/game.zip`：exit 0；輸出 `Packed brightwood-first-oath v1.0.0-beta.30 (tools 1.2.0)`。[pack.log](../../.playroom/tmp/plan23-candidate-beta30/pack.log)
3. `node.exe tools/playroom/validate.mjs artifacts/plan23-1.0.0-beta.30/game.zip`：exit 0；輸出 `Valid: brightwood-first-oath v1.0.0-beta.30 (tools 1.2.0)`。[validate.log](../../.playroom/tmp/plan23-candidate-beta30/validate.log)
4. 複製 Plan22 一次性 audit 腳本，只替換候選與暫存路徑、版本後執行一次；原腳本未修改。[audit.log](../../.playroom/tmp/plan23-candidate-beta30/audit.log)

## 沿用結果與未驗項目

- W01 `tsc --noEmit` exit 0 見 [W01 報告](plan23-inventory-ui.md)；本候選依指定未重跑 typecheck，也未跑 tests。
- 未啟動 browser；本批背包分類的 click、keyboard、screen reader 與 layout 均未實測。候選封包驗證不代表上述互動或可讀性通過。
- 未執行 commit／push／tag、Release 或平台發布。
