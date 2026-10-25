# 遺跡 A 包：存檔相容交接

日期：2026-10-25。狀態：**完成，可交主代理整合**。

## 已讀來源與適用規則

已完整讀取 `AGENTS.md`、`plan/12-next-chapter-ancient-ruins.md`、Playroom `game-agent-template.md` 及其列出的七份 `main` 規格：`game-development.md`、`command-contracts.md`、`game.schema.json`、`game-release.yml`、`examples/starter/playroom-sdk.js`、`sdk-versioning.md`、`save-compatibility.md`（2026-10-25 讀取）。`.codegraph/` 不存在。

本批依規格先驗證封套與資料；讀取錯誤或不相容不能當新存檔；format 變更前保留舊資料；`SAVE_FORMAT_INCOMPATIBLE` 停止帳號寫入。正式格式 2 寫入仍須符合目前上架版相容能力。

## 完成項目

- `src/persistence/validate.ts` 將寫入格式定為 2。
- `src/persistence/index.ts` 接受本機及雲端 format 1／2，兩者仍經目前 catalog 的 `prepareSave` 驗證；只輸出 format 2。遺跡 quest ID 可在 format 2 保存，缺少 q15/q16 的舊資料仍可讀。
- format 1 本機原件首次轉寫 format 2 前，以原始封套字串保存至同遊戲存檔 key 的 `:format1-backup`，回讀確認成功才覆寫。備份失敗、既有備份內容不同、原件格式未知或資料不合法時停止寫入並保留主存檔。
- 雲端讀取拒絕及保存時的 `SAVE_FORMAT_INCOMPATIBLE` 都停止進度寫入；不以本機或預設空資料替代雲端存檔。
- `src/contracts/ports.ts` 的雲端寫入型別及 `src/contracts/types.ts` 的 `SaveEnvelope` 改為格式 2。平台 port 測試的舊讀取 format 1 fixture 保留，寫入 fixture 改為 format 2。
- 更新 `tests/persistence.test.ts` 舊格式與未知格式斷言；新增 `tests/ruins-save.test.ts`，涵蓋缺 q15/q16 的舊檔、遺跡 ID format 2 roundtrip、讀雲端 format 1 後寫 2、未知本機格式保留、format 1 備份、備份失敗保護，以及雲端不相容停止寫入。

## 驗證與限制

- `npx vitest run tests/ruins-save.test.ts`：8/8 通過。
- `npm run typecheck`：通過。
- 曾執行 `npm test -- tests/persistence.test.ts src/platform/playroom-port.test.ts`，實際回報 18 files／150 tests 全部通過。主代理後續確認 Vitest 的 substring 篩選會選入 `.worktrees/` 內的同名測試，因此這不是全套回歸或嚴格兩檔範圍；後續命令排除舊工作樹，不重跑已通過且未變動的檢查。
- 未執行瀏覽器、build、Playroom 帳號存檔或發布；未嘗試正式寫入格式 2。

主代理整合 manifest 時需使用 `schemaVersion: 2` 與 `cloudSave: { readableFormats: [1, 2], writeFormat: 2 }`。在目前正式上架版本尚未部署能讀 format 1／2 的橋接版前，平台會阻止會產生上架版無法讀取存檔的正式格式 2 寫入；預覽只提供模擬保存，不能作正式相容證明。發布仍需獨立授權。

後續包 B 的 inspect 任務計數驗證仍未納入本批；該包實作碑文互動時，須同步擴充 counter 驗證及 format 2 的聚焦覆蓋。
