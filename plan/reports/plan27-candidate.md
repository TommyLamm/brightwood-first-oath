# Plan27 W03・beta.34 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；BROWSER_UNVERIFIED；未發布**。

## 範圍與候選

依 [Plan27](../27-ap-allocation-preview.md)、[W01 報告](plan27-ap-preview.md)、[W02 報告](plan27-ui-integration.md)、[Plan26 候選報告](plan26-candidate.md) 及 `tools/playroom/pack.mjs`、`tools/playroom/validate.mjs` 建立候選。本任務由主代理沿用已完整讀取的 Playroom 範本及七份線上規格，沒有讀取失敗。

- 候選：`brightwood-first-oath`／`1.0.0-beta.34`。建置前候選目錄、批次 tmp 目錄與本報告均不存在；`v1.0.0-beta.34` 沒有既有 tag。
- 只更新 `package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 的版本；新增本候選檔、[批次 tmp／audit](../../.playroom/tmp/plan27-candidate-beta34/) 及本報告。保留共享工作樹其餘 dirty 檔案。
- 六個版本位置一致：package、lock 頂層、lock root、source `game.json`、dist `game.json`、ZIP `game.json` 均為 `1.0.0-beta.34`。Source／dist／ZIP 的 author `TommyLamm`、id `brightwood-first-oath`、devices `desktop`、cloudSave readable formats 1–5／write format 5 一致。Schema 2、SDK 1.1.0、protocol 1、Playroom tools 1.2.0 保留。

## Source、dist 與 ZIP 識別

- Source 清單涵蓋 `.playroom/game-tools.lock.json`、根 README／index／package metadata／tsconfig／vite config，以及 `public/`、`src/`、`tests/`、`tools/`；共 423 files／135,738,055 bytes。清單檔 SHA-256：`48ebd3a5b36b61f8e80101ad09f5321cbc67212602f2567aacc4128c3563c9be`：[source-files.sha256](../../artifacts/plan27-1.0.0-beta.34/source-files.sha256)。
- Dist 清單共 274 files／135,746,091 bytes。清單檔 SHA-256：`cbee3df83dbda73af5855d3adf4c8dc8218f49b2983e5142b7e781f31b03f21b`：[dist-files.sha256](../../artifacts/plan27-1.0.0-beta.34/dist-files.sha256)。以上 SHA-256 是清單檔本身的雜湊；清單內逐檔列相對路徑與 SHA-256。
- [game.zip](../../artifacts/plan27-1.0.0-beta.34/game.zip)：131,526,311 bytes；SHA-256 `10f40ed2daa364fae68321a2e41c5dd294a3ccf7a91024e3c1a0231b2d2af12f`；274 entries；解壓 135,746,091 bytes、壓縮資料 131,478,487 bytes。ZIP 根項目：`assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/`。
- ZIP 有限文字掃描：8 類 pattern（PEM private-key header、AWS／Google／GitHub／Slack／Stripe token、引號包住的 credential assignment、JWT-like encoded-JSON-header value），掃描 14 entries／1,763,754 bytes，0 命中。[260 個 binary entries／133,982,337 bytes](../../.playroom/tmp/plan27-candidate-beta34/zip-audit.json) 未掃描；超過 16 MiB 的文字 entry 為 0。這是有限文字 pattern scan，不是 binary audit。摘要：[zip-audit.json](../../.playroom/tmp/plan27-candidate-beta34/zip-audit.json)。

## Build、封包與驗證

Node `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`（`v24.22.1`）置於 `PATH` 前方；Vite `8.3.4`。各命令各執行一次：

1. `node node_modules/vite/bin/vite.js build --outDir artifacts/plan27-1.0.0-beta.34/dist`：exit 0；76 modules transformed。[build.log](../../.playroom/tmp/plan27-candidate-beta34/build.log)
2. `node tools/playroom/pack.mjs artifacts/plan27-1.0.0-beta.34/dist artifacts/plan27-1.0.0-beta.34/game.zip`：exit 0；`Packed brightwood-first-oath v1.0.0-beta.34 (tools 1.2.0)`。[pack.log](../../.playroom/tmp/plan27-candidate-beta34/pack.log)
3. `node tools/playroom/validate.mjs artifacts/plan27-1.0.0-beta.34/game.zip`：exit 0；`Valid: brightwood-first-oath v1.0.0-beta.34 (tools 1.2.0)`。[validate.log](../../.playroom/tmp/plan27-candidate-beta34/validate.log)
4. 複製前批 audit，只替換路徑與版本後執行一次：`python .playroom/tmp/plan27-candidate-beta34/audit_candidate.py`：exit 0；六個版本位置一致、metadata 一致、有限文字掃描 0 命中。[audit_candidate.py](../../.playroom/tmp/plan27-candidate-beta34/audit_candidate.py)、[audit.log](../../.playroom/tmp/plan27-candidate-beta34/audit.log)

## 未驗項目

本批未重跑 W01 focused tests 或 W02 typecheck，亦未啟 browser；真 hover tooltip、讀屏、click、keyboard、focus 行為仍未驗。未執行 commit／push／tag、Release、平台發布或排程。
