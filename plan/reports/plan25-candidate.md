# Plan25 W03・beta.32 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；BROWSER_UNVERIFIED；未發布**。

## 規格與範圍

本次讀取根 `AGENTS.md`、[Plan25 context](../25-inventory-item-use-feedback.md)、[W01 item-use 報告](plan25-item-use.md)、[W02 UI 報告](plan25-ui-integration.md)、[Plan25 handoff](plan25-handoff.md)、[Plan24 candidate 報告](plan24-candidate.md)，以及 `tools/playroom/pack.mjs`、`tools/playroom/validate.mjs` 和本批一次性 [audit script](../../.playroom/tmp/plan25-candidate-beta32/audit_candidate.py)。依交接沿用主代理本 Plan25 已完整讀取的 Playroom 範本與七份 main 規格，沒有讀取失敗。

W03 只更新候選版本並封裝。`package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 均為 `1.0.0-beta.32`。作者 `TommyLamm`、ID `brightwood-first-oath`、devices `desktop`、cloudSave readable formats 1–5／write format 5 保留；SDK `1.1.0`、protocol `1`、schema `2`、Playroom tools `1.2.0` 保留。候選目錄初始已存在但為空，未覆寫既有檔案。

## 候選與 metadata

- 候選：`brightwood-first-oath`／`1.0.0-beta.32`。
- [Dist](../../artifacts/plan25-1.0.0-beta.32/dist/)；[ZIP](../../artifacts/plan25-1.0.0-beta.32/game.zip)。
- package、lock 頂層、lock root、source `game.json`、dist `game.json`、ZIP `game.json` 六處版本皆為 `1.0.0-beta.32`；source、dist、ZIP 的 author、id、devices、cloudSave 一致。
- Node `v24.22.1`；Vite `8.3.4`；Playroom tools `1.2.0`。

## Source、dist 與 ZIP 識別

- Source 清單依本批 audit 腳本指定範圍（`.playroom/game-tools.lock.json`、根 README／index／package metadata／tsconfig／vite config，以及 `public/`、`src/`、`tests/`、`tools/`）共 421 files／135,729,599 bytes；清單 SHA-256 `1c593513799cdd3e0b688d1ecce3c9152f59d8e578e0e9cca93ba94bb0be540b`：[source-files.sha256](../../artifacts/plan25-1.0.0-beta.32/source-files.sha256)。
- Dist 清單：274 files／135,744,678 bytes；清單 SHA-256 `8bee0ba7b3c70d35c790ba66fdc0b35c794f6faa64ff5c2ceb07a301dfa40dc8`：[dist-files.sha256](../../artifacts/plan25-1.0.0-beta.32/dist-files.sha256)。兩份清單依相對路徑排序並逐檔列 SHA-256；上述 hash 是清單檔本身的 SHA-256。
- ZIP SHA-256 `0e4686a2533a37cd8e50139f89d7a897accfe6deb674c2984419ba6e72b8a932`；131,525,888 bytes；274 entries；解壓 135,744,678 bytes、壓縮資料 131,478,064 bytes。
- ZIP 有限文字掃描涵蓋 `.html`／`.js`／`.mjs`／`.cjs`／`.css`／`.json`／`.svg`／`.xml`／`.txt`／`.webmanifest`，掃描 14 entries／1,762,341 bytes；8 類規則（PEM private-key header、AWS access-key ID、Google API key、GitHub token、Slack token、Stripe secret/restricted key、引號包住的 credential assignment、JWT-like encoded-JSON-header value），0 命中。260 個 binary entries／133,982,337 bytes 未掃描；超過 16 MiB 而略過的文字 entry 為 0。這是有限文字 pattern scan，不是 binary audit。摘要：[zip-audit.json](../../.playroom/tmp/plan25-candidate-beta32/zip-audit.json)。

## Build、封包與驗證

Node `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`（`v24.22.1`）放在 `PATH` 前方。build、固定 pack、完整 ZIP validate 各執行一次：

1. `node.exe node_modules/vite/bin/vite.js build --outDir artifacts/plan25-1.0.0-beta.32/dist`：exit 0；75 modules transformed。[build.log](../../.playroom/tmp/plan25-candidate-beta32/build.log)
2. `node.exe tools/playroom/pack.mjs artifacts/plan25-1.0.0-beta.32/dist artifacts/plan25-1.0.0-beta.32/game.zip`：exit 0；輸出 `Packed brightwood-first-oath v1.0.0-beta.32 (tools 1.2.0)`。[pack.log](../../.playroom/tmp/plan25-candidate-beta32/pack.log)
3. `node.exe tools/playroom/validate.mjs artifacts/plan25-1.0.0-beta.32/game.zip`：exit 0；輸出 `Valid: brightwood-first-oath v1.0.0-beta.32 (tools 1.2.0)`。[validate.log](../../.playroom/tmp/plan25-candidate-beta32/validate.log)
4. 執行本批一次性 audit script 一次：exit 0；metadata 一致、有限文字掃描 0 命中。[audit.log](../../.playroom/tmp/plan25-candidate-beta32/audit.log)

## 沿用結果與未驗項目

- 沿用 [W01](plan25-item-use.md) 新 6 組 focused tests 與既有 app 精選案例 1/1 通過，以及 [W02](plan25-ui-integration.md) 一次 `tsc --noEmit` exit 0；W03 沒有重跑 tests 或 typecheck。
- 未啟動 browser；真實冷卻到期時的 DOM 刷新、focus、click 與版面仍未驗證。ZIP 驗證不代表這些互動通過。
- 未執行 commit／push／tag、Release 或平台發布。
