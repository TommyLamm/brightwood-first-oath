# Plan20 beta.27 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；未做瀏覽器驗收或發布**。

## 已讀規格與適用要求

本工作包讀取 repo `AGENTS.md`、[Plan20](../20-item-action-feedback.md) W04、[W01裝卸預覽](plan20-equipment-preview.md)、[W02出售預覽](plan20-sale-preview.md)、[W03 UI整合](plan20-ui-integration.md)、[Plan20 handoff](plan20-handoff.md)、[規劃證據](plan20-planning-evidence.md)、[beta.26封包報告](plan19-polish-candidate.md)，以及 `tools/playroom/pack.mjs`、`tools/playroom/validate.mjs`。沿用主代理本輪已完整讀取的線上 `game-agent-template.md` 與其中七份 main 規格（含 game-development 尾段）：固定遊戲 ID、desktop manifest、相容存檔、使用鎖定 Playroom tools、提高版本並完整 ZIP 驗證；不發布、不 commit／push／tag。

本包只更改 `package.json` 與 `package-lock.json` 的 root 版本、lock root package 版本，以及 `public/game.json` 版本。author `TommyLamm`、遊戲 ID、devices 與 cloud save 格式維持一致。

## 候選與 metadata

- 候選：`brightwood-first-oath`／`1.0.0-beta.27`。
- 候選目錄在本次建立前不存在；`git tag --list '*beta.27*'` 沒有已用標籤。
- [Dist](../../artifacts/plan20-1.0.0-beta.27/dist/)；[ZIP](../../artifacts/plan20-1.0.0-beta.27/game.zip)。
- `package.json`、`package-lock.json` top-level、lock `packages[""]`、source `public/game.json`、dist `game.json`、ZIP `game.json` 版本均為 `1.0.0-beta.27`。source／dist／ZIP manifest 的 author 均為 `TommyLamm`，ID 均為 `brightwood-first-oath`，devices 均為 `desktop`，cloudSave 均為 readable formats 1–5／write format 5。
- Node `v24.22.1`；Vite `8.3.4`；固定 Playroom tools `1.2.0`。

## Source、dist 與 ZIP 識別

- Source 清單：415 files／135,695,465 bytes；清單 SHA-256 `7956a9bfb6a25fb68f03deed573c09b74c5ad5860894ed88a70bf41dfcf613a9`：[source-files.sha256](../../artifacts/plan20-1.0.0-beta.27/source-files.sha256)。範圍沿用 beta.26：`.playroom/game-tools.lock.json`、根目錄 README／index／package metadata／tsconfig／vite config，以及 `public/`、`src/`、`tests/`、`tools/`。
- Dist 清單：274 files／135,740,753 bytes；清單 SHA-256 `c41ac4581751e748f85b73d4a6c1742d7097fee5c43cfaf21fccc0bc2585ecc0`：[dist-files.sha256](../../artifacts/plan20-1.0.0-beta.27/dist-files.sha256)。
- ZIP SHA-256 `b5e2fe4dd3f6438ee07d3041873b72f6fed3c82f6a9910bcf5fda98e326fc8ae`；131,524,728 bytes；274 entries；解壓 135,740,753 bytes、壓縮資料 131,476,904 bytes。根項目：`assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/`。
- 有限文字 secret-pattern 掃描使用 8 類規則，掃描 14 個 `.html`／`.js`／`.mjs`／`.cjs`／`.css`／`.json`／`.svg`／`.xml`／`.txt`／`.webmanifest` entries，共 1,758,416 bytes；最終 0 命中。初始通用 JWT-like 規則對遊戲點分隔識別字及 Phaser 屬性鏈產生 18 個誤報，核對後收窄為含編碼 JSON header 的三段 JWT-like 形式再掃描。260 個非上述文字副檔名 entries／133,982,337 bytes 未掃描；沒有超過 16 MiB 而跳過的文字 entry。這是有限文字 pattern scan，不是 binary audit。摘要：[zip-audit.json](../../.playroom/tmp/plan20-candidate-beta27/zip-audit.json)。

## Build、封包與驗證

使用 `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`，執行前將該 `bin` 加至 `PATH` 前方。每項命令各執行一次：

1. `node_modules/vite/bin/vite.js build --outDir artifacts/plan20-1.0.0-beta.27/dist`：exit 0；72 modules transformed。記錄：[build.log](../../.playroom/tmp/plan20-candidate-beta27/build.log)。
2. `tools/playroom/pack.mjs artifacts/plan20-1.0.0-beta.27/dist artifacts/plan20-1.0.0-beta.27/game.zip`：exit 0；輸出 `Packed brightwood-first-oath v1.0.0-beta.27 (tools 1.2.0)`。記錄：[pack.log](../../.playroom/tmp/plan20-candidate-beta27/pack.log)。
3. `tools/playroom/validate.mjs artifacts/plan20-1.0.0-beta.27/game.zip`：exit 0；輸出 `Valid: brightwood-first-oath v1.0.0-beta.27 (tools 1.2.0)`。記錄：[validate.log](../../.playroom/tmp/plan20-candidate-beta27/validate.log)。

## 沿用結果與未驗項目

- W01／W02 共 11 個 focused tests（6＋5）依各自報告通過；W03 一次 `tsc --noEmit` exit 0。W04 未重跑這些檢查，也未重跑舊的 35／327 項、content check 或 typecheck。
- W03 只新增裝卸與單筆出售預覽接線；數量 input、focus、購買及「出售全部素材」流程維持本批原定邊界。沒有 browser 實際點擊或視覺驗收。
- W05 條件不成立，沒有啟動 browser；保留已記錄的 `0x6D` 環境限制，不換 profile 重試。候選未發布、未 commit／push／tag，也未建立正式平台版本。
