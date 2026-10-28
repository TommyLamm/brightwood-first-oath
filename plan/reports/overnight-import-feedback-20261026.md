# 夜間本機匯入競爭提示改善

日期：2026-10-26（香港時間）。本批沿 beta.16 source 改成本機 beta.17 候選；不發布、不封包、不 commit/push/tag。保留工作樹中其他未提交修改。

## 進度紀錄

- 已讀 `overnight-priorities-20261026.md` 第2項、`ruins-d-browser-namespace-retry.md`、`overnight-dialogue-focus-20261026.md`，並依主代理已完整讀取的 Playroom main template 與7份規範執行。適用範圍：固定遊戲 ID/schema 2、SDK 1.1、protocol 1、讀取格式1–4/寫入格式4、desktop；驗證資料、壞檔不覆寫、隔離雲端、不發布。
- 介面已有 `legacyImportMessage` 可見接線，因此沒有改 `src/ui/index.ts`、`src/app/app.ts` 或 `src/app/state.ts`。
- `src/persistence/index.ts`：兩次 pre-copy recheck 遇到競爭變動時，重新讀取 canonical 優先結果；用玩家文案說明匯入取消，合法新舊版候選要求重新確認，來源消失時只說本次未改資料。保留 `loadError` / `incompatible` 與原錯誤細節；canonical 讀取例外也回傳玩家可見 diagnostic。取消文案不稱舊原件仍存在。沒有新增 storage 寫入。
- `tests/persistence-namespace.test.ts`：擴充 target/source 變更、source 移除、最後 pre-copy target 競爭、canonical 損毀/格式不相容、canonical 讀取錯誤用例。
- 已將 `package.json`、`package-lock.json`、`public/game.json` 版本升至 `1.0.0-beta.17`；保留 beta.16 instructions、engine 與 dependencies。
- focused namespace 首跑 25/26，發現 `localOutcome` canonical read exception 沒把錯誤放入 outcome；已修正並重跑。最後 `tests/persistence-namespace.test.ts --exclude '**/.worktrees/**'`：26/26 pass。`tsc --noEmit`：pass。
- beta.17 獨立 build 命令：`node node_modules/vite/bin/vite.js build --outDir artifacts/overnight-20261026/import-feedback/dist --emptyOutDir`；build pass。沒有覆蓋 beta.15/beta.16 成品。
- 自有 Playwright session `night-import-feedback` 現已明確以 `vite preview --outDir artifacts/overnight-20261026/import-feedback/dist` serve beta.17。game origin `game.json` 回 HTTP 200、ID `brightwood-first-oath`、version `1.0.0-beta.17`；載入 JS basename `index-C1-e-S4C.js`，與獨立 build 的 index 引用相符。初次錯誤 preview 的 browser 動作不作證據。
- 合成 fixture 由 beta.17 正常「建立角色」UI 建立，角色名「夜間測試」，canonical raw 585 bytes；複製 raw 到 legacy key、清空 canonical 後 reload，title 上可見舊版匯入說明與「匯入舊版進度」按鈕。fixture raw SHA-256 `cebd72765c3b514b1a0def66e7e24baccbe4ca75948886395d84985e562f51a2`。
- **Target race browser case pass：**注入另一份合法 canonical「同時建立的新進度」後，按 visible import button；title 載入 canonical 角色並清楚顯示「這台裝置已有目前進度，這次舊版匯入已取消；已載入目前進度。」canonical 與 legacy raw 的 SHA-256 均與按前相同。
- **Source change browser case pass：**保持 canonical 空白，將選取的 synthetic legacy raw 更新成合法「更新後的舊進度」再按 visible import button；title 顯示此次取消、已重新讀取目前可匯入進度、需再次確認，且匯入按鈕仍出現。legacy hash 未變、canonical 仍空白。
- **Error visibility browser case pass：**在重新確認提示下放入損毀 canonical 後按 visible import button；狀態維持「讀取失敗」，同時看到取消說明與原有損毀存檔 diagnostic；legacy hash 和 canonical 原始損毀字串都未變。

## 交接狀態

- 全部授權工作已完成；source/dist 已交由主代理接續 package gate。本批沒有 package、zip、commit、push、tag 或 release。

## 最終驗證與指紋

- focused namespace：`node node_modules/vitest/vitest.mjs run tests/persistence-namespace.test.ts --exclude '**/.worktrees/**'`，1 file / 26 tests pass。首次執行 25/26 時找到 canonical read exception 沒帶出 outcome diagnostic；修正後重跑通過。
- typecheck：`node node_modules/typescript/bin/tsc --noEmit`，pass。
- build：`node node_modules/vite/bin/vite.js build --outDir artifacts/overnight-20261026/import-feedback/dist --emptyOutDir`，Vite 8.3.4 pass。未重跑全套 test、內容檢查或舊 browser case。
- beta.17 browser gate：game origin `game.json` HTTP 200，ID `brightwood-first-oath`、version `1.0.0-beta.17`；載入 `/assets/index-C1-e-S4C.js`，和獨立 dist `index.html` 相符；entry JS SHA-256 `1e5aa92a999a7ff4752d3b069b63c23d85fde4fe69e8b7650b28f2a035405b4a`。
- Browser 三個小分支全通過，詳細可見文字、合成 fixture 與 raw hash 在 `artifacts/overnight-20261026/import-feedback/browser/browser-results.md`。只測了 target 競爭、source 重確認及壞 canonical diagnostic，不重跑 formats 1–4、backup、cloud/SDK 或其他 namespace browser case。
- 自有 Playwright session `night-import-feedback` 已關閉；自有 localhost preview/harness ports `65370`、`65371` 已停止，停止後讀取兩個 port 的 listen 查詢沒有結果。沒有操作其他 owner 的 session/context/artifacts。
- Application source inputs（`src/`, `public/`, `index.html`, `package*.json`, `tsconfig.json`, `vite.config.ts`）：341 files / 134,993,285 bytes；manifest SHA-256 `ce445b12cfdd654133c851565ed87355f17782697dd11e7f166c6f131c5129c6`。
- 本批 ownership files（persistence、focused test、package/lock/game metadata）：5 files / 115,163 bytes；manifest SHA-256 `97adffca12fc566c5a8686e5965abe41085187fd48f61e623a72d21e4c2daea2`。
- 獨立 beta.17 dist：274 files / 135,704,908 bytes；manifest SHA-256 `0256fc3faea34ab5c8c2bccf9f7434565797ecdb2dad69cd9cfd1a064bd95be4`。
- 每份 file manifest 與 hash 算法在 `artifacts/overnight-20261026/import-feedback/{source-fingerprint.json,owned-files-fingerprint.json,dist-fingerprint.json,fingerprint.mjs}`。遠端平台 preview、SDK 真雲端與 release 未驗。
