# Plan26 W02・beta.33 本機候選封包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**CANDIDATE_BUILT_AND_ZIP_VALIDATED；BROWSER_UNVERIFIED；未發布**。

## 範圍與候選

本次讀取 `AGENTS.md`、[Plan26 context](../26-item-action-context.md)、[W01 UI 報告](plan26-item-action-ui.md)、[Plan25 candidate 報告](plan25-candidate.md)，以及 `tools/playroom/pack.mjs`、`tools/playroom/validate.mjs`。依主代理交接沿用本批已完整讀取的 Playroom 範本及七份 main 線上規格，沒有讀取失敗。

- 候選：`brightwood-first-oath`／`1.0.0-beta.33`。
- 新建 [候選目錄](../../artifacts/plan26-1.0.0-beta.33/)；建置前候選目錄、tmp 目錄與本報告均不存在，沒有覆寫舊候選。`v1.0.0-beta.33` 無既有 tag。
- 只更新 `package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 的版本；新增本批候選檔、[tmp logs/audit](../../.playroom/tmp/plan26-candidate-beta33/) 及本報告。保留共享工作樹其他 dirty 檔案。
- 六個版本位置一致：package、lock 頂層、lock root、source `game.json`、dist `game.json`、ZIP `game.json` 均為 `1.0.0-beta.33`。Source／dist／ZIP 的 author `TommyLamm`、id `brightwood-first-oath`、devices `desktop`、cloudSave readable formats 1–5／write format 5 一致。Schema 2、SDK 1.1.0、protocol 1、Playroom tools 1.2.0 保留。

## Source、dist 與 ZIP 識別

- Source manifest 涵蓋 `.playroom/game-tools.lock.json`、根 README／index／package metadata／tsconfig／vite config，以及 `public/`、`src/`、`tests/`、`tools/`；依相對路徑排序，共 421 files／135,730,526 bytes。SHA-256：`8b94969d39b33e432db534cdec37f87184ef95d3ed6fbfcab5ce1e99b4759044`：[source-files.sha256](../../artifacts/plan26-1.0.0-beta.33/source-files.sha256)。
- Dist manifest：274 files／135,745,213 bytes。SHA-256：`8399ff32b6648bd130c9fc2815ae7236364cb69bec4316813d01c4c28057c544`：[dist-files.sha256](../../artifacts/plan26-1.0.0-beta.33/dist-files.sha256)。兩份 SHA-256 均為清單檔本身的雜湊；清單內逐檔列相對路徑與 SHA-256。
- [game.zip](../../artifacts/plan26-1.0.0-beta.33/game.zip)：131,525,976 bytes；SHA-256 `f86b41a35764a2845e0aea6130e71085f4378a11888ff9608ee15ec2beccdc67`；274 entries；解壓 135,745,213 bytes、壓縮資料 131,478,152 bytes。
- ZIP 有限文字掃描：8 類 pattern，涵蓋 PEM private-key header、AWS／Google／GitHub／Slack／Stripe token、引號包住的 credential assignment、JWT-like encoded-JSON-header value；掃描 14 entries／1,762,876 bytes，0 命中。260 個 binary entries／133,982,337 bytes 未掃描；超過 16 MiB 的文字 entry 為 0。這是有限文字 pattern scan，不是 binary audit。摘要：[zip-audit.json](../../.playroom/tmp/plan26-candidate-beta33/zip-audit.json)。

## Build、封包與驗證

Node `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`（`v24.22.1`）置於 `PATH` 前方；Vite `8.3.4`。各命令各執行一次：

1. `node node_modules/vite/bin/vite.js build --outDir artifacts/plan26-1.0.0-beta.33/dist`：exit 0；75 modules transformed。[build.log](../../.playroom/tmp/plan26-candidate-beta33/build.log)
2. `node tools/playroom/pack.mjs artifacts/plan26-1.0.0-beta.33/dist artifacts/plan26-1.0.0-beta.33/game.zip`：exit 0；`Packed brightwood-first-oath v1.0.0-beta.33 (tools 1.2.0)`。[pack.log](../../.playroom/tmp/plan26-candidate-beta33/pack.log)
3. `node tools/playroom/validate.mjs artifacts/plan26-1.0.0-beta.33/game.zip`：exit 0；`Valid: brightwood-first-oath v1.0.0-beta.33 (tools 1.2.0)`。[validate.log](../../.playroom/tmp/plan26-candidate-beta33/validate.log)
4. 複製並只調整路徑／版本後，執行 audit 腳本一次：`python .playroom/tmp/plan26-candidate-beta33/audit_candidate.py`：exit 0；metadata 一致、有限文字掃描 0 命中。[audit_candidate.py](../../.playroom/tmp/plan26-candidate-beta33/audit_candidate.py)、[audit.log](../../.playroom/tmp/plan26-candidate-beta33/audit.log)

## 未驗項目

W02 未重跑 tests 或 typecheck，未啟 browser，未做讀屏、實際 click／keyboard 或 layout 驗證；ZIP 驗證不代表這些互動通過。未執行 commit／push／tag、Release、平台發布或排程。
