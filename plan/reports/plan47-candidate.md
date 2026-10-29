# Plan 47 候選成品：1.0.0-beta.54

- 候選：`brightwood-first-oath`；作者 `TommyLamm`；裝置 `desktop`；Playroom tools `1.2.0`。
- 狀態：SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED；未發布。
- 成品：[artifacts/plan47-1.0.0-beta.54](../../artifacts/plan47-1.0.0-beta.54/)；執行記錄：[.playroom/tmp/plan47-candidate-beta54](../../.playroom/tmp/plan47-candidate-beta54/)。

## 規格與範圍

2026-10-29 完整讀取 Playroom `game-agent-template.md` 及其要求的 `game-development.md`、`command-contracts.md`、`game.schema.json`、`game-release.yml`、starter `playroom-sdk.js`、`sdk-versioning.md`、`save-compatibility.md`。依規格保留遊戲 ID、相對資源、Manifest 與固定工具驗證要求；本候選未發布。

只將 `package.json`、`package-lock.json` 頂層及 `packages[""]`、`public/game.json` 的版本由 `1.0.0-beta.53` 精確替換為 `1.0.0-beta.54`，保留其餘位元組與格式。prepare 回報替換數為 1／2／1。使用唯讀 Plan 38 prepare 範本的六組整體路徑／版本替換，從唯讀 Plan 46 audit 產生新 audit 副本；AST／Path 元件解析確認 `artifact`、`dist`、`zip_path`、`tmp` 都指向 Plan 47 beta.54 的預期位置。

## 執行步驟

| 步驟 | 結果 | 命令、輸出與 exit code |
|---|---:|---|
| 建立新 artifact/tmp，準備腳本副本 | exit 0 | `.playroom/tmp/plan47-candidate-beta54/prepare-setup.log` |
| metadata prepare 與 audit 副本路徑檢查 | exit 0 | `.playroom/tmp/plan47-candidate-beta54/prepare.log` |
| 指定 Node runtime 執行 Vite build（81 modules） | exit 0 | `.playroom/tmp/plan47-candidate-beta54/build.log` |
| Playroom pack | exit 0 | `.playroom/tmp/plan47-candidate-beta54/pack.log` |
| 固定工具完整 ZIP validate | exit 0 | `.playroom/tmp/plan47-candidate-beta54/validate.log` |
| 指定 Python 3.11 audit | exit 0 | `.playroom/tmp/plan47-candidate-beta54/audit.log`；摘要 `.playroom/tmp/plan47-candidate-beta54/zip-audit.json` |

Build、pack、validate、audit 各執行一次；成功步驟沒有重跑。完整命令、輸出及 exit code 均保存在表列日誌。

## 成品與 metadata

Source、dist、ZIP 六處版本一致為 `1.0.0-beta.54`：`package.json`、`package-lock.json` 頂層、`package-lock.json` 的 `packages[""].version`、source `public/game.json`、dist `game.json`、ZIP 內 `game.json`。Audit 確認 source／dist／ZIP 的作者 `TommyLamm`、ID `brightwood-first-oath`、裝置 `desktop`、存檔讀取格式 1–5／寫入格式 5 一致；`manifestConsistent` 為 `true`。

| 項目 | 檔案數／ZIP entries | 檔案總 bytes／ZIP bytes | SHA-256 |
|---|---:|---:|---|
| Source manifest（`source-files.sha256`） | 433 source files | 135,786,200 source bytes | `f82b5f93b4c802fa630d835de25124f937d09d42e8eae3ebf7e0054061856a65` |
| Dist manifest（`dist-files.sha256`） | 274 dist files | 135,753,748 dist bytes | `267e20a0fbfb807b2a82f6e5db93d3246d33d98fa7b81e44e4276cf17c0bcccb` |
| ZIP（`game.zip`） | 274 entries | 131,528,389 ZIP bytes | `e38d5cbef173a691a7f1512383652add714f616e25e138520f65929b17d25494` |

ZIP 解壓 entries 共 135,753,748 bytes，壓縮 entries 合計 131,480,565 bytes。根目錄 entries 為 `assets`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor`。

## 有限文字掃描與限制

Audit 對 14 個文字 entries、1,771,411 bytes 執行 8 類 pattern 掃描，findings 為 0；超過 16 MiB 的文字 entries 為 0。260 個 binary entries、133,982,337 bytes 未掃描，這不是完整 binary 檢查。

本次未執行 tests、tsc、browser 或 server。Plan 47 W01 的單次 tsc 與局部 diff 已由 root 審閱接受，依指示未重跑；遊戲內 click、focus、reader 與 layout 未經 browser 驗證。候選尚未發布。