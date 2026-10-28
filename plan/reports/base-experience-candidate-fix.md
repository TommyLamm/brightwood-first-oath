# Plan17 beta22 焦點恢復修正版候選

日期：2026-10-28（香港時間）  
Playroom 規格讀取：2026-10-28 HKT，完整讀取 `game-agent-template.md`；按 B05 範圍讀取 `game-development.md` 建置／交付、`game.schema.json`、`game-release.yml`、`sdk-versioning.md` 工具／Node 段。  
狀態：**SOURCE_DELIVERED／ZIP_VALIDATED；未發布。**

## 版本與來源

- 起始候選為 beta21。封裝前即時檢查 `package.json`、`package-lock.json`、`public/game.json` 均為 `1.0.0-beta.21`；本機 `v1.0.0-beta.22` tag 不存在，`artifacts/base-experience-1.0.0-beta.22/` 尚不存在，因此建立獨立 beta22 候選。
- 只同步 `package.json`、`package-lock.json` 根與 `packages[""]` 版本，以及 `public/game.json` 版本為 `1.0.0-beta.22`。ID `brightwood-first-oath`、schema 2、desktop、雲端存檔可讀 1–5／寫 5 不變。
- 本版唯一遊戲邏輯修正為 `src/app/state.ts` 的 `appCommand` `togglePause` 存檔 blocker guard；唯一新增測試為 `tests/integration/app-focus-resume.test.ts` 的重綁鍵 focused case。修復驗收見 [焦點守門報告](base-experience-resume-guard.md)。

## 成品與指紋

- Build：[dist](../../artifacts/base-experience-1.0.0-beta.22/dist/)，獨立目錄，共 274 files／135,734,534 bytes；tree SHA-256 `165501b7de464befe30a4ae20081d10924336e011e656c99ae2ca11a87d7f674`。
- ZIP：[game.zip](../../artifacts/base-experience-1.0.0-beta.22/game.zip)，位於 dist 外，共 274 entries／131,522,814 bytes；SHA-256 `7e35b289fddb96b2f3d6d42e1e2665a53735ea4575430025f31ab4cb638462ef`。
- ZIP entry tree SHA-256 `165501b7de464befe30a4ae20081d10924336e011e656c99ae2ca11a87d7f674`，與 dist 清單完全相符。
- Source scope 共 351 files／135,074,773 bytes，tree SHA-256 `fbf85da28e59e889777f3db707abd0c250698c6d034d7d301e47433ef65a7c0d`。清單含 beta21 原 source scope，另含本次 focused regression test。逐檔清單為 [source-files.sha256](../../artifacts/base-experience-1.0.0-beta.22/source-files.sha256)。
- Dist 逐檔清單為 [dist-files.sha256](../../artifacts/base-experience-1.0.0-beta.22/dist-files.sha256)，ZIP entry 清單為 [zip-entries.sha256](../../artifacts/base-experience-1.0.0-beta.22/zip-entries.sha256)；摘要與 manifest 在 [fingerprints.json](../../artifacts/base-experience-1.0.0-beta.22/fingerprints.json)。清單由同目錄 [fingerprint.ps1](../../artifacts/base-experience-1.0.0-beta.22/fingerprint.ps1) 生成。

## Build 與固定工具驗證

- Bundled Node：`v24.22.1`；Vite `8.3.4` build 執行一次，68 modules transformed，成功。輸出使用相對資源路徑。
- 固定 Playroom tools `1.2.0` archive SHA-256 `24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022`。`tools/playroom/pack.mjs` wrapper 執行一次成功；`tools/playroom/validate.mjs` 完整驗證執行一次成功：`Valid: brightwood-first-oath v1.0.0-beta.22 (tools 1.2.0)`。
- ZIP 文字項目有限掃描 14 entries，範圍為 `.js`、`.mjs`、`.html`、`.css`、`.json`、`.txt`、`.xml`、`.svg`、`.map`；檢查 AWS access key ID、GitHub token、Google API key、Stripe live secret key、PEM private-key header，potential matches 為 0。二進位檔未掃描，此項不是完整機密稽核。
- 沿用 source repair report 的 6 個 focused cases 與 TypeScript 檢查結果；沒有改內容表，略過 content check。沒有重跑其他 tests。

## 舊候選與驗收邊界

- beta21 `game.zip` 保持原件，重新讀取 SHA-256 為 `6b2fcc4437f82e7218682d407965449d2aa65f7b3a9d8ac0f4ee0f56dc79e8f2`、131,522,796 bytes。沒有改動其 dist、ZIP 或 Terra 的 output／profile／service。
- Terra 的 browser route 仍指向 beta21。既有未變 UI 證據不代表 beta22 guard 已完整 route 驗收；本次只驗新 guard 的 focused integration case 及 TypeScript。
- 正式平台／雲端帳號、音訊實聽、原生／沉浸全螢幕仍未驗證。沒有建立 tag、GitHub Release、push 或平台上架。
