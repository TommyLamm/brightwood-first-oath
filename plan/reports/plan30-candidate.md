# Plan 30 W02・beta.37 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；BROWSER_UNVERIFIED；未發布**。

## 來源、規格與候選

- 已讀 `AGENTS.md`、[Plan30工作上下文](../30-overlay-control-context.md)、[W01 UI報告](plan30-overlay-ui.md)、[Plan29候選報告](plan29-candidate.md)、`tools/playroom/pack.mjs` 與 `tools/playroom/validate.mjs`。`.codegraph/` 不存在，依指定直接讀取目標文件。
- 主代理在本任務已完整讀取 Playroom 範本及其列出的 game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning、save-compatibility 七份線上規格，補讀截斷尾段無失敗；W02沿用該閱讀結果。
- 建置前確認 `artifacts/plan30-1.0.0-beta.37/`、`.playroom/tmp/plan30-candidate-beta37/` 與本報告皆不存在。候選為 `brightwood-first-oath`／`1.0.0-beta.37`。
- 只更新 `package.json`、`package-lock.json` 頂層與根套件版本、`public/game.json` 版本；新增本候選、批次暫存與本報告。其他共享工作樹 dirty、舊候選與資料保留。

## Source、dist 與 ZIP 識別

- Source清單包括 `.playroom/game-tools.lock.json`、根目錄 README／index／package metadata／tsconfig／Vite設定，以及 `public/`、`src/`、`tests/`、`tools/`：423 files、135,740,266 bytes。清單逐檔列相對路徑與SHA-256；清單內容SHA-256為 `5c537b916f519db24cd578a01805920cfa3c466734b82d115f0ac370aa0d82cf`：[source-files.sha256](../../artifacts/plan30-1.0.0-beta.37/source-files.sha256)。
- Dist清單為274 files、135,746,951 bytes；每檔SHA-256列於清單，清單內容SHA-256為 `a7c1df753d09f18d84e8f24534bb18dc811097336a7019ab91507a04082eb12a`：[dist-files.sha256](../../artifacts/plan30-1.0.0-beta.37/dist-files.sha256)。
- [game.zip](../../artifacts/plan30-1.0.0-beta.37/game.zip)：131,526,592 bytes；SHA-256 `e9a338a19d4c93868b3b1257284ab0a2b8c354d4496a2a17872439b03e67ee9b`；274 entries；解壓135,746,951 bytes、壓縮資料131,478,768 bytes。ZIP根項目：`assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/`。
- 六個版本位置（package、lock頂層、lock根套件、source `game.json`、dist `game.json`、ZIP `game.json`）皆為 `1.0.0-beta.37`。Source／dist／ZIP的author `TommyLamm`、id `brightwood-first-oath`、devices `desktop`、cloudSave讀取格式1–5／寫入格式5一致。Schema 2、SDK 1.1.0、protocol 1及 `.playroom/game-tools.lock.json` 的 tools 1.2.0 延續既有設定；manifest schema與tools版本已讀取，pack／validate亦回報tools 1.2.0。
- 有限文字掃描使用8類pattern，掃描14 entries／1,764,614 bytes，0命中；260個binary entries／133,982,337 bytes未掃描；大於16 MiB的文字entry為0。這是有限文字pattern scan，不是binary audit。摘要：[zip-audit.json](../../.playroom/tmp/plan30-candidate-beta37/zip-audit.json)。

## Build、封包與驗證

Node `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`（`v24.22.1`）置於PATH前方；Vite `8.3.4`。各命令均只執行一次：

1. `node node_modules/vite/bin/vite.js build --outDir artifacts/plan30-1.0.0-beta.37/dist`：exit 0；76 modules transformed。[build.log](../../.playroom/tmp/plan30-candidate-beta37/build.log)
2. `node tools/playroom/pack.mjs artifacts/plan30-1.0.0-beta.37/dist artifacts/plan30-1.0.0-beta.37/game.zip`：exit 0；`Packed brightwood-first-oath v1.0.0-beta.37 (tools 1.2.0)`。[pack.log](../../.playroom/tmp/plan30-candidate-beta37/pack.log)
3. `node tools/playroom/validate.mjs artifacts/plan30-1.0.0-beta.37/game.zip`：exit 0；`Valid: brightwood-first-oath v1.0.0-beta.37 (tools 1.2.0)`。[validate.log](../../.playroom/tmp/plan30-candidate-beta37/validate.log)
4. 複製前批audit腳本，僅替換本批artifact／tmp路徑與版本後執行一次：`python .playroom/tmp/plan30-candidate-beta37/audit_candidate.py`：exit 0；版本及manifest metadata一致，有限文字pattern scan 0命中。[audit script](../../.playroom/tmp/plan30-candidate-beta37/audit_candidate.py)、[audit.log](../../.playroom/tmp/plan30-candidate-beta37/audit.log)

## 未驗項目

未重跑W01 TypeScript檢查（結果見[W01報告](plan30-overlay-ui.md)），未執行tests、browser、server或截圖；螢幕閱讀器、click、鍵盤操作、focus與layout效果未驗。未執行git write、commit／push／tag、Release、平台發布或排程。