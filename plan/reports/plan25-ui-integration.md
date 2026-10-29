# Plan25 W02・背包使用回饋接線

狀態：完成（2026-10-28）。

## 交付範圍

- `src/ui/index.ts` 匯入共用 `resolveItemUse`。selected consumable 預覽只採用 `ok` 與失敗時的 `message`；不採用成功結果中的 player 或 resolved item ID。
- 背包「使用一個」按鈕依預覽結果 disabled；拒絕原因同時放在按鈕 `title` 與既有 `ms-disabled-reason` 可見文字。按鈕新增 `data-inventory-use="true"`，原 `itemId` 保留。
- `use-item` click 僅對該 marker 以事件處理時的最新 `currentView` 再呼叫 helper；預覽拒絕時不 dispatch。成功時仍 dispatch 按鈕原始 requested `itemId`。沒有 marker 的快捷列／其他來源沿用原 dispatch 與 focus 路徑。
- `renderPanel` signature 僅新增 `potionCooling: panel === 'inventory' && view.nowMs < view.potionReadyAtMs`。未加入時間戳、deadline 或剩餘時間；未加 timer，也未改 focus/reconciliation、快捷列、輸入或其他面板。

## 已讀規格與適用要求

- 本次讀取 `AGENTS.md`、`plan/25-inventory-item-use-feedback.md`、`src/app/item-use.ts` 與 `plan/reports/plan25-item-use.md`。
- 沿用主代理本批次已完整閱讀 Playroom 範本與其「開始前讀取線上規格」指定七份 main 文件的交接；無讀取失敗。
- 遵循 W02 唯一修改 `src/ui/index.ts` 與新增本報告的範圍；保留 W01 判定順序及 app 命令處理。

## 檢查與限制

- 一次執行：`& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/typescript/bin/tsc --noEmit`：exit 0。
- 未重跑 W01 focused tests，未加 DOM 測試，未啟動 browser、build 或完整測試套件，符合 W02 驗收範圍。
- 真實冷卻到期時的 DOM 刷新、版面與 focus 行為未做 browser 驗證；不宣稱已驗證。
