# Plan20 W01：裝卸純預覽

## 交付

- 新增 `src/ui/equipment-preview.ts`：匯出 `EquipmentPreviewAction` 窄 union（`equip { bagIndex }`／`unequip { slot }`）、`EquipmentPreviewInput`、`EquipmentActionPreview`，以及 `previewEquipmentAction(input)`。
- 預覽直接呼叫 `applyProgressAction`；失敗回傳 domain 的 `reason`／`code` 並停用，成功回傳可用狀態。成功結果中的 `value` 不外露，也不會修改輸入 player 或派送命令。
- W03 呼叫契約：`previewEquipmentAction({ player, rules, action: { type: 'equip', bagIndex } })` 或以 `{ type: 'unequip', slot }` 作為 action。點擊時應使用當前 view 再預覽，成功才派原命令，不能把預覽結果的 player 套回。

## focused 覆蓋

`tests/equipment-preview.test.ts` 使用小型合法 player/rules fixture，並以 `applyProgressAction` 的真實結果逐例對照：有空位卸下、滿包卸下、滿包背包裝備交換、等級不足、空裝備欄與過時 bag index。每例均深比較預覽前後的 player，且確認回傳不含 `value`。

## 驗證與未驗

- 依 W01 執行 `node.exe node_modules/vitest/vitest.mjs run tests/equipment-preview.test.ts --maxWorkers=2`：1 個 test file、6 個 tests 通過。
- 未改 domain、UI、存檔、既有測試或交易流程；未執行 progression 全檔、完整測試、typecheck、build 或 browser QA。
- W03 UI 接線、按鈕互動及視覺尚未驗證。
