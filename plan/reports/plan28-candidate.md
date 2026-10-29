# Plan28 W02・beta.35 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；BROWSER_UNVERIFIED；未發布**。

## 範圍與候選

依 [Plan28](../28-character-name-feedback.md)、[W01 名稱 UI 報告](plan28-name-ui.md)、[Plan27 候選報告](plan27-candidate.md)，並閱讀 `AGENTS.md`、`tools/playroom/pack.mjs`、`tools/playroom/validate.mjs` 建立候選。主代理已完整讀取 Playroom 範本與其列出的七份線上規格，本批沿用該結果。

- 候選：`brightwood-first-oath`／`1.0.0-beta.35`。建置前 `artifacts/plan28-1.0.0-beta.35/`、`.playroom/tmp/plan28-candidate-beta35/` 與本報告均不存在；依主代理 preflight，beta.35 未使用。
- 只更新 `package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 的版本；新增本候選、批次 tmp/logs/audit 與本報告。舊候選與共享工作樹其餘 dirty 檔案保留。
- 六個版本位置一致：package、lock 頂層、lock root、source `game.json`、dist `game.json`、ZIP `game.json` 均為 `1.0.0-beta.35`。Source／dist／ZIP 的 author `TommyLamm`、id `brightwood-first-oath`、devices `desktop`、cloudSave readable formats 1–5／write format 5 一致。Schema 2、SDK 1.1.0、protocol 1、Playroom tools 1.2.0 保留。

## Source、dist 與 ZIP 識別

- Source 清單涵蓋 `.playroom/game-tools.lock.json`、根 README／index／package metadata／tsconfig／vite config，以及 `public/`、`src/`、`tests/`、`tools/`；共 423 files／135,739,597 bytes。清單檔 SHA-256：`22f5a8789a938e131d9f20b7bda3a3669ea9c02e2d0c9cbe90644458fd8de276`：[source-files.sha256](../../artifacts/plan28-1.0.0-beta.35/source-files.sha256)。
- Dist 清單共 274 files／135,746,589 bytes。清單檔 SHA-256：`df5074c649571ba1c4aa3111d31facce92bd99807de0bdaf6037acb293837da7`：[dist-files.sha256](../../artifacts/plan28-1.0.0-beta.35/dist-files.sha256)。以上 SHA-256 是清單檔本身的雜湊；清單內逐檔列相對路徑與 SHA-256。
- [game.zip](../../artifacts/plan28-1.0.0-beta.35/game.zip)：131,526,522 bytes；SHA-256 `9e8c18c6d4cc74c6372d849f959a97fe09dbf802bcf0a43fb9191409a433fc5e`；274 entries；解壓 135,746,589 bytes、壓縮資料 131,478,698 bytes。ZIP 根項目：`assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/`。
- ZIP 有限文字掃描：8 類 pattern（PEM private-key header、AWS／Google／GitHub／Slack／Stripe token、引號包住的 credential assignment、JWT-like encoded-JSON-header value），掃描 14 entries／1,764,252 bytes，0 命中。[260 個 binary entries／133,982,337 bytes](../../.playroom/tmp/plan28-candidate-beta35/zip-audit.json) 未掃描；超過 16 MiB 的文字 entry 為 0。這是有限文字 pattern scan，不是 binary audit。摘要：[zip-audit.json](../../.playroom/tmp/plan28-candidate-beta35/zip-audit.json)。

## Build、封包與驗證

Node `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`（`v24.22.1`）置於 `PATH` 前方；Vite `8.3.4`。各命令各執行一次：

1. `node node_modules/vite/bin/vite.js build --outDir artifacts/plan28-1.0.0-beta.35/dist`：exit 0；76 modules transformed。[build.log](../../.playroom/tmp/plan28-candidate-beta35/build.log)
2. `node tools/playroom/pack.mjs artifacts/plan28-1.0.0-beta.35/dist artifacts/plan28-1.0.0-beta.35/game.zip`：exit 0；`Packed brightwood-first-oath v1.0.0-beta.35 (tools 1.2.0)`。[pack.log](../../.playroom/tmp/plan28-candidate-beta35/pack.log)
3. `node tools/playroom/validate.mjs artifacts/plan28-1.0.0-beta.35/game.zip`：exit 0；`Valid: brightwood-first-oath v1.0.0-beta.35 (tools 1.2.0)`。[validate.log](../../.playroom/tmp/plan28-candidate-beta35/validate.log)
4. 複製前批 audit，僅替換本批 artifact/tmp 路徑與版本後執行一次：`python .playroom/tmp/plan28-candidate-beta35/audit_candidate.py`：exit 0；六個版本位置與 metadata 一致、有限文字掃描 0 命中。[audit script](../../.playroom/tmp/plan28-candidate-beta35/audit_candidate.py)、[audit.log](../../.playroom/tmp/plan28-candidate-beta35/audit.log)

## 未驗項目

本批未重跑 W01 focused test 或 TypeScript 檢查（結果見 [W01 報告](plan28-name-ui.md)），未啟 browser。真實輸入法 composition、caret／selection、tooltip、click、讀屏與 layout 仍未驗。未執行 commit／push／tag、Release、平台發布或排程。
