# Plan17・beta.21 候選封裝紀錄

日期：2026-10-28（香港時間）  
Playroom 最新規格：2026-10-28 HKT，透過 Web 讀取 `main` 分支的模板封裝／回報段、`game-development.md` 建置與交付段、`game.schema.json`、`game-release.yml` 及 `sdk-versioning.md` 工具／Node 段。  
狀態：**SOURCE_DELIVERED／ZIP_VALIDATED；browser／視覺待 Terra；未發布。**

## 版本與相容性

- 封裝前來源版本為 `1.0.0-beta.20`。本機 tags 最高 `v1.0.0-beta.10`；透過唯讀 GitHub connector 查公開 Releases 與 tags，兩者最高亦為 beta.10。新候選路徑原先不存在，因此選未使用且高於來源與公開版本的 `1.0.0-beta.21`。
- 只將 `package.json`、`package-lock.json`（根及 `packages[""]` 版本欄位）、`public/game.json` 的版本同步至 beta.21；依賴與 lockfile 其他內容未升級。
- Manifest 保持 ID `brightwood-first-oath`、schema 2、`desktop`、`cloudSave.readableFormats: [1,2,3,4,5]` 及 `writeFormat: 5`。

## 成品

- 獨立 build 目錄：`artifacts/base-experience-1.0.0-beta.21/dist/`
- 候選 ZIP：`artifacts/base-experience-1.0.0-beta.21/game.zip`，位於 dist 外。
- 指紋與清單：`fingerprints.json`、`source-files.sha256`、`dist-files.sha256`、`zip-entries.sha256`，均存於候選目錄。

## Build、固定工具與 ZIP

- Bundled Node：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`，版本 `v24.22.1`。
- Vite `8.3.4` build 執行一次，68 modules transformed，成功；Vite `base: './'`，build 的入口引用 `./assets/` 相對路徑。
- 固定 Playroom tools `1.2.0`：`.playroom/tools/playroom-game-tools-1.2.0.zip` SHA-256 `24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022`，與 lock 相符；ZIP 內 metadata 版本為 1.2.0，5 個 metadata 檔案 SHA-256 均符合。Pack wrapper 執行時亦檢查 pinned ZIP、lock 及 extracted metadata。
- Pack 執行一次成功；官方完整 ZIP validate 執行一次成功：`Valid: brightwood-first-oath v1.0.0-beta.21 (tools 1.2.0)`。

## 指紋

- Source：350 個檔案；tree SHA-256 `4fac074967f8ba12f5150a48de84ecf5026a4312378f8b16f1d03d6d85333f35`。清單涵蓋入口、package／lock、README、TypeScript／Vite 設定、固定工具 lock、`public/**`、`src/**` 及 `tools/playroom/**`。
- Dist：274 個檔案；tree SHA-256 `3dbc499ea0ba165479702a51fe83f5eb41d2edd2126ac9339b6900437695ce40`。
- ZIP：131,522,796 bytes、274 entries；SHA-256 `6b2fcc4437f82e7218682d407965449d2aa65f7b3a9d8ac0f4ee0f56dc79e8f2`。ZIP entry tree SHA-256 與 dist 相同，逐檔路徑／內容 hash 清單完全相符。

## 有限文字機密掃描及驗收邊界

- 在 ZIP 內掃描 14 個 `.js`、`.mjs`、`.html`、`.css`、`.json`、`.txt`、`.xml`、`.svg`、`.map` entries，檢查 AWS access key ID、GitHub token、Google API key、Stripe live secret key 及 PEM private-key header 樣式；0 potential matches。圖片、音訊等二進位檔未掃描；此項不是完整機密稽核。
- 主代理確認 A 批 focused 23 tests、B04 snapshot focused 3 tests 共 26 個案例通過；最後 UI／Escape 修改後使用 bundled Node 執行 `tsc --noEmit` exit 0。B05 未重跑這些檢查；內容表未改，略過 content check。
- 本紀錄只標記 source 交付及 ZIP 驗證。Terra 負責 browser／視覺短段；正式平台／雲端帳號、音訊實聽、原生／沉浸全螢幕尚未驗證。沒有建立 tag、GitHub Release、推送或平台上架。
