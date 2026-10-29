# Plan 29 W02 — beta.36 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；BROWSER_UNVERIFIED；未發布**。

## 範圍與候選

依 [Plan29](../29-progression-action-context.md)、[W01 UI 報告](plan29-action-ui.md)、[Plan28 候選報告](plan28-candidate.md)，並閱讀 `AGENTS.md`、`tools/playroom/pack.mjs`、`tools/playroom/validate.mjs` 建立候選。主代理已在同一任務完整網讀 Playroom 範本與其列出的七份主規格，尾段補讀無失敗，本批沿用該結果。

- 候選：`brightwood-first-oath`／`1.0.0-beta.36`。建置前 `artifacts/plan29-1.0.0-beta.36/`、`.playroom/tmp/plan29-candidate-beta36/` 與本報告均不存在；沿用主代理 preflight 指定版本。
- 僅更新 `package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 版本；新增本候選、批次 tmp/logs/audit 與本報告。保留舊候選及共享工作樹其他既有 dirty。
- 六個版本位置（package、lock 頂層、lock root、source `game.json`、dist `game.json`、ZIP `game.json`）一致，均為 `1.0.0-beta.36`。Source／dist／ZIP 的 author `TommyLamm`、id `brightwood-first-oath`、devices `desktop`、cloudSave readable formats 1–5／write format 5 一致。Schema 2、SDK 1.1.0、protocol 1、Playroom tools 1.2.0 保留。

## Source、dist 與 ZIP 識別

- Source 清單涵蓋 `.playroom/game-tools.lock.json`、根 README／index／package metadata／tsconfig／vite config，以及 `public/`、`src/`、`tests/`、`tools/`；共 423 files／135,740,054 bytes。清單內容 SHA-256：`b8dafafba1bae092f362c16990e0d9b5f5c8e9552e85d6385bd7fd4a8597039b`：[source-files.sha256](../../artifacts/plan29-1.0.0-beta.36/source-files.sha256)。
- Dist 清單共 274 files／135,746,809 bytes。清單內容 SHA-256：`c83c5990670b257a03e975f4ecdc1ac9c0f46c23281c1e292d7d820618b60b05`：[dist-files.sha256](../../artifacts/plan29-1.0.0-beta.36/dist-files.sha256)。以上 SHA-256 為清單內容的雜湊；清單逐檔列相對路徑與檔案 SHA-256。
- [game.zip](../../artifacts/plan29-1.0.0-beta.36/game.zip)：131,526,568 bytes；SHA-256 `faf00b355dae465240f446f988ef64620c0b82cdf6f00d3ad535f40662051e38`；274 entries；解壓 135,746,809 bytes、壓縮資料 131,478,744 bytes。ZIP 根項目：`assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/`。
- ZIP 有限文字掃描採用 8 類 pattern（PEM private-key header、AWS／Google／GitHub／Slack／Stripe token、引號包住的 credential assignment、JWT-like encoded-JSON-header value），掃描 14 entries／1,764,472 bytes，0 命中。260 個 binary entries／133,982,337 bytes 未掃描；超過 16 MiB 的文字 entry 為 0。這是有限文字 pattern scan，不是 binary audit。摘要：[zip-audit.json](../../.playroom/tmp/plan29-candidate-beta36/zip-audit.json)。

## Build、封包與驗證

Node `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`（`v24.22.1`）置於 `PATH` 前方；Vite `8.3.4`。各命令各執行一次：

1. `node node_modules/vite/bin/vite.js build --outDir artifacts/plan29-1.0.0-beta.36/dist`：exit 0；76 modules transformed。[build.log](../../.playroom/tmp/plan29-candidate-beta36/build.log)
2. `node tools/playroom/pack.mjs artifacts/plan29-1.0.0-beta.36/dist artifacts/plan29-1.0.0-beta.36/game.zip`：exit 0；`Packed brightwood-first-oath v1.0.0-beta.36 (tools 1.2.0)`。[pack.log](../../.playroom/tmp/plan29-candidate-beta36/pack.log)
3. `node tools/playroom/validate.mjs artifacts/plan29-1.0.0-beta.36/game.zip`：exit 0；`Valid: brightwood-first-oath v1.0.0-beta.36 (tools 1.2.0)`。[validate.log](../../.playroom/tmp/plan29-candidate-beta36/validate.log)
4. 複製前批 audit，僅替換本批 artifact/tmp 路徑與版本後執行一次：`python .playroom/tmp/plan29-candidate-beta36/audit_candidate.py`：exit 0；六個版本位置與 metadata 一致，有限文字掃描 0 命中。[audit script](../../.playroom/tmp/plan29-candidate-beta36/audit_candidate.py)、[audit.log](../../.playroom/tmp/plan29-candidate-beta36/audit.log)

## 未驗項目

本批未重跑 W01 TypeScript 檢查（結果見 [W01 報告](plan29-action-ui.md)），未執行 tests 或啟 browser。螢幕閱讀器實際朗讀、click、鍵盤操作與版面效果均未驗。未執行 commit／push／tag、Release、平台發布或排程。
