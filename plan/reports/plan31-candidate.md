# Plan31 W02・beta.38 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；BROWSER_UNVERIFIED；未發布**。

## 來源、規格與候選

- 已讀 `AGENTS.md`、[Plan31工作包](../31-shop-equipment-comparison.md)、[W01 UI報告](plan31-shop-comparison-ui.md)、[Plan30候選報告](plan30-candidate.md)、`tools/playroom/pack.mjs` 與 `tools/playroom/validate.mjs`。`.codegraph/` 不存在，依指示直接讀取目標文件。
- 主代理在同一任務已完整讀取 Playroom 範本及其列出的七份線上規格，補讀截斷尾段無失敗；W02沿用該閱讀結果。
- root 已確認 `artifacts/plan31-1.0.0-beta.38/` 與同名 tag 未使用。建置前本批亦確認候選 artifact、tmp 及本報告均不存在。候選為 `brightwood-first-oath`／`1.0.0-beta.38`。
- 只更新 `package.json`、`package-lock.json` 頂層與根套件版本、`public/game.json` 版本；新增本候選、批次暫存與本報告。其他共享 dirty、舊候選、profiles 與真資料保持未動。

## Source、dist 與 ZIP 識別

- Source清單包括 `.playroom/game-tools.lock.json`、根目錄 README／index／package metadata／tsconfig／Vite設定，以及 `public/`、`src/`、`tests/`、`tools/`：423 files、135,740,726 bytes。清單逐檔列相對路徑與SHA-256；清單內容SHA-256為 `ce165974b85510fed1c1159a97ffd58d7350ae636f2edfdfc7b72022eeff0c70`：[source-files.sha256](../../artifacts/plan31-1.0.0-beta.38/source-files.sha256)。
- Dist清單為274 files、135,747,064 bytes；逐檔SHA-256列於清單，清單內容SHA-256為 `fff6bea7a803e200f41778c3bbe1deea9bb7b30efc3b5d82aa4c0a6792f376ab`：[dist-files.sha256](../../artifacts/plan31-1.0.0-beta.38/dist-files.sha256)。
- [game.zip](../../artifacts/plan31-1.0.0-beta.38/game.zip)：131,526,669 bytes；SHA-256 `259a21047a879e513f8a270734d210a36ccabad3f410dbfa4cfe090c94c3ffe0`；274 entries；解壓135,747,064 bytes、壓縮資料131,478,845 bytes。ZIP根項目：`assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/`。
- 六個版本位置（package、lock頂層、lock根套件、source `game.json`、dist `game.json`、ZIP `game.json`）皆為 `1.0.0-beta.38`。Source／dist／ZIP的author `TommyLamm`、id `brightwood-first-oath`、devices `desktop`、cloudSave讀取格式1–5／寫入格式5一致。`public/game.json` schema為2；bundled SDK標示1.1.0／protocol v1；`.playroom/game-tools.lock.json` 的tools為1.2.0，pack／validate亦回報tools 1.2.0。摘要：[zip-audit.json](../../.playroom/tmp/plan31-candidate-beta38/zip-audit.json)。
- 有限文字掃描涵蓋8類pattern及14個文字entries、1,764,727 bytes，0命中；260個binary entries／133,982,337 bytes未掃描；超過16 MiB的文字entry為0。此為有限文字pattern scan，沒有掃描binary內容。

## Build、封包與驗證

使用Node `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`（v24.22.1；bin目錄置於PATH前方）；Vite 8.3.4。Build、pack、validate各執行一次，均exit 0：

1. `node node_modules/vite/bin/vite.js build --outDir artifacts/plan31-1.0.0-beta.38/dist`：76 modules transformed。[build.log](../../.playroom/tmp/plan31-candidate-beta38/build.log)
2. `node tools/playroom/pack.mjs artifacts/plan31-1.0.0-beta.38/dist artifacts/plan31-1.0.0-beta.38/game.zip`：packed `brightwood-first-oath v1.0.0-beta.38 (tools 1.2.0)`。[pack.log](../../.playroom/tmp/plan31-candidate-beta38/pack.log)
3. `node tools/playroom/validate.mjs artifacts/plan31-1.0.0-beta.38/game.zip`：`Valid: brightwood-first-oath v1.0.0-beta.38 (tools 1.2.0)`。[validate.log](../../.playroom/tmp/plan31-candidate-beta38/validate.log)
4. 複製前批audit腳本，僅替換本批artifact／tmp路徑與版本後執行。第一次因artifact路徑字串仍帶`plan30-`前綴，指向不存在目錄而exit 1；錯誤記錄於[audit-path-error.log](../../.playroom/tmp/plan31-candidate-beta38/audit-path-error.log)。修正本批tmp副本的該路徑後執行，exit 0；版本與manifest metadata一致，有限文字pattern scan 0命中。[audit_candidate.py](../../.playroom/tmp/plan31-candidate-beta38/audit_candidate.py)、[audit.log](../../.playroom/tmp/plan31-candidate-beta38/audit.log)

## 未驗項目

未重跑W01 TypeScript檢查（結果見[W01報告](plan31-shop-comparison-ui.md)），未執行tests、browser、server或截圖；螢幕閱讀器、click、鍵盤操作、focus與layout效果未驗。未執行git write、commit／push／tag、Release、平台發布或新增排程。
