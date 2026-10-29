# Plan 19 W03：背包暫存狀態 reconciliation

狀態：**helper 與 focused tests 完成；尚未整合 UI。**

## 範圍與來源

- 實作依據：`plan/19-base-experience-next-batch.md` §3.3、W03，以及 repo `AGENTS.md`。
- 本輪 Playroom 遊戲模板與其中七份線上規格已由主代理讀取；本包沿用該同一開發任務的規格前置。
- 本包只新增 `src/ui/bag-view-state.ts`、`tests/bag-view-state.test.ts`、本報告。沒有改 UI、gameplay、progression、存檔或玩家資料。

## Helper 契約

匯出 `reconcileBagViewState` 與 `BagViewReconciliation`：

```ts
reconcileBagViewState(
  prevBag: readonly BagStack[],
  nextBag: readonly BagStack[],
  selectedBagIndex: number | null,
  sellQuantities: ReadonlyMap<number, number>,
): BagViewReconciliation
```

回傳欄位為 `selectedBagIndex`、新建的 `sellQuantities`、`structureChanged` 與 `hadAffectedState`。結構只按 bag 長度和相同槽位的有序 `itemId` 比較；clone 或數量變化不算結構改變，也不嘗試從重複 `itemId` 推測唯一身份。

- 結構改變時選取設為 `null`、數量 map 清空。`hadAffectedState` 表示呼叫前曾有非 null 選取或非空數量 map；UI 僅在 `structureChanged && hadAffectedState` 時顯示「請重新選取物品」。
- 結構相同時，保留有效整數選取索引；不合法或超出範圍的選取設為 `null`。出售 map 會複製，只保留有效索引，並將數量向下取整後夾在 `1..stack.quantity`；非有限數量按 1 處理。
- helper 不修改 bag、stack 或輸入 map。UI 應在 panel signature 前呼叫；若 `structureChanged`，不要還原舊的 bag-index focus key 或數量 value。若原焦點在受影響的 bag 控制項，退回穩定的面板標題／選取區。Helper 不接收焦點資料，焦點判斷仍由 UI 依原 focus key 局部處理。
- 新角色、回標題、切換已載入進度及 dispose 時清 transient state 是 UI lifecycle 責任；本 helper 不提供 lifecycle 或存檔操作。

## 驗收

新增測試涵蓋 clone 同內容、同 itemId 數量夾限與無效索引清理、移除前方／選取／末槽、加槽、原槽換 itemId、重複 itemId、清空背包，以及 bag/map 輸入不變。

只執行指定 focused 測試：

```text
`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` node_modules/vitest/vitest.mjs run tests/bag-view-state.test.ts --maxWorkers=2
Test Files  1 passed (1)
Tests       11 passed (11)
```

未執行全套 tests、typecheck、browser 或 build；W03 範圍不要求這些檢查。下一步由 W04 依上述契約接入 UI，並自行處理 focus key 與 transient lifecycle。
