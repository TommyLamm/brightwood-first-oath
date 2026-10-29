# Plan43 W01・UI 預覽說明關聯

2026-10-29（Asia/Hong_Kong）。**完成，待 root 審閱。**

## 讀取內容與適用要求

- 已讀 `AGENTS.md`、`plan/43-action-preview-descriptions.md`、`plan/reports/plan43-handoff.md`，並參照 `.playroom/tmp/plan43-integration-review/ui-before.ts`。
- root 已按 Plan43 完整讀取 Playroom 範本與 game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility 規格（refs147–150）。
- 本批只在五個既有成功預覽說明設定唯一 `id`，並由相應按鈕以 `aria-describedby` 引用；保留既有 tag、class、文字、成功條件和 append 順序。

## 完成項目

| 預覽說明 | 條件 | 說明 id | 對應按鈕引用 |
| --- | --- | --- | --- |
| 使用道具 | `usePreview.ok` | `brightwood-first-oath-use-preview-` + `bagIndex` | `useButton` |
| 裝備物品 | `equipmentPreview.ok` | `brightwood-first-oath-equip-preview-` + `bagIndex` | `equipButton` |
| 卸下裝備 | `preview.ok` | `brightwood-first-oath-unequip-preview-` + `slot` | `unequipButton` |
| 學習／提升技能 | `learningPreview.ok` | `brightwood-first-oath-skill-preview-` + `skill.id` | `actionButton` |
| 出售素材 | `materialSalePreview.expectedSoldStacks > 0` | `brightwood-first-oath-material-sale-preview` | 原素材出售按鈕 |

素材出售按鈕僅由原 `makeButton(...)` 抽至 `materialSaleButton`，仍在原位置 append。只有原成功說明存在時才設定該按鈕的 `aria-describedby`。各失敗分支不引用不存在的說明。

變更只涉及 `src/ui/index.ts`；未改按鈕名稱或其他屬性、preview 呼叫、handler、state、CSS、timer、domain 或存檔邏輯，也未新增 helper。

## 檢查與限制

- 依指定 Node 路徑執行一次 `node_modules/typescript/bin/tsc --noEmit`，exit code `0`；完整命令、輸出與 exit code 見 `.playroom/tmp/plan43-description-ui-tsc.log`。
- 靜態檢視確認五個 id prefix 各有對應的按鈕引用，且引用設定位於其既有成功條件內。
- 未執行 tests、DOM／browser、server 或 build。真實讀屏、click、focus 與 layout 尚未驗證。

## 下一步

root 審閱五處局部 diff 及 id／引用條件後，再依 Plan43 執行 W02 候選工作；本批未建立候選、發布或執行 git 寫入。
