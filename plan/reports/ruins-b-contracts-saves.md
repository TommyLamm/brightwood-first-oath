# 遺跡 B 包：契約、任務與存檔交接

日期：2026-10-25（香港時間）。狀態：**owner 工作完成，可供整合**。

## 已讀來源與適用規則

本次先完整讀取 repository `AGENTS.md`、`plan/13-ruins-echo-exploration.md`，再透過網路完整讀取 Playroom `game-agent-template.md` 及其列出的七份 main 規格：

- [遊戲模板](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)
- [開發與發布標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)
- [操作與錯誤契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)
- [Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)
- [Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)
- [Playroom SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)
- [SDK／協定版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)
- [存檔格式相容規格](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)

本批適用要求：驗證存檔資料後才套用；讀取失敗或不相容不可當空存檔；格式遷移先保全舊資料；備份失敗或內容衝突時不覆寫；本機與雲端只寫宣告的唯一格式。`.codegraph/` 不存在，沿用直接檢視程式的方式。

## 改動

- `src/contracts/definitions.ts`：objective union 加入 `inspect`。
- `src/contracts/commands.ts`：加入 `{ type: 'inspect'; payload: { targetId: Id } }`；seq 仍由 command queue 配發。
- `src/contracts/ports.ts`、`src/contracts/types.ts`：雲端寫入與 envelope 的唯一格式改為 3。
- `src/domain/quests/index.ts`：事件 union 加入 `{ type: 'inspected'; targetId: Id }`；接受任務時建立 inspect counter，進度顯示讀 counter，事件只更新 active 任務中匹配的 inspect objective 並 clamp 至 objective count。
- `src/persistence/validate.ts`：明確可讀格式 `[1, 2, 3]`、唯一寫入格式 3；counter 只允許對應的 kill／reach／inspect objective，且須為安全整數及未超過 objective 上限。claimed 任務會檢查所有 kill／inspect counter 和未由 visitedMaps 滿足的 reach counter。q20 claimed 不要求保留已交付物品。
- `src/persistence/index.ts`：本機及雲端讀取接受 1／2／3，雲端及本機寫入格式 3。首次把本機格式 1 或 2 寫成 3 前，原始 envelope 字串分別備份為 `:format1-backup` 或 `:format2-backup`，再回讀確認；完全相同的既存備份可續寫，不同內容、備份錯誤或未知／不合法存檔會保留原件並停止該次寫入。雲端 `SAVE_FORMAT_INCOMPATIBLE` 仍停止帳號寫入。
- `tests/ruins-b-fixtures.ts`、`tests/ruins-inspect.test.ts`、`tests/ruins-b-save.test.ts`：建立自足 B fixture，驗證 inspect active-only／counter clamp、任務間獨立、舊格式缺少 q17／q20、格式 3 roundtrip、讀 1／2 寫 3、原封套備份、備份失敗／衝突停止寫入、counter 範圍及 claimed 完整性。

既有 A 改動視為基線；未回滾或覆寫 A 成果。本批未改世界內容、規則、app、UI、renderer、Manifest 或遊戲版本。

## 下游凍結介面

- Objective：`{ type: 'inspect', targetId: steleNpcId, count: 1 }`
- Domain event：`{ type: 'inspected', targetId }`
- Command draft：`{ type: 'inspect', payload: { targetId } }`
- q17 counters：`ruins-stele-west`、`ruins-stele-east`；接取時均初始化為 0，已存完成值為 1。
- `READABLE_SAVE_FORMATS = [1, 2, 3]`；唯一 `SAVE_FORMAT_VERSION = 3`。`CloudSaveInput` 與 `SaveEnvelope` 寫入型別為 format 3。

World owner 尚需在 `content/world/validate.ts` 驗證 inspect target 可達性；app owner 需依 frozen command 做權威重驗與 dispatch；UI owner 需顯示「調律」及 NPC 碑名；整合 owner 需同步 `game.json` 的 `cloudSave: { readableFormats: [1, 2, 3], writeFormat: 3 }`，並檢查格式相容聲明符合實際舊版本能力。

## 驗證與待整合

- 通過：`npx vitest run tests/ruins-inspect.test.ts tests/ruins-b-save.test.ts --exclude '**/.worktrees/**'`（2 檔、15 tests）。
- 未執行 typecheck、build、完整測試、瀏覽器或正式雲端驗收；依本批範圍留給整合階段。
- 尚有 A／既有測試中的 format literal 待最終整合更新：`tests/persistence.test.ts` 與 `src/platform/playroom-port.test.ts` 有 format 2 寫入斷言／輸入；`tests/ruins-save.test.ts` 仍預期寫入 2、把 3 當不支援，且只覆蓋 format 1 備份。更新方向是唯一寫入預期 3、不支援樣本改用 7，並補 format 2 原件備份語義。未在本批跨 owner 修改這些測試。
- 未做 Playroom 發布、雲端正式寫入或版本更新。
