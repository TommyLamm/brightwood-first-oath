# Plan26 W01・物品操作名稱與選取狀態

2026-10-28（Asia/Hong_Kong）。W01 完成，待主代理審閱。

## 讀取文件與範圍

- 已讀 `AGENTS.md` 與 `plan/26-item-action-context.md`。
- 依契約僅在 `buildInventoryPanel`、`buildShopPanel` 為七個既有控件增加屬性或提取必要的按鈕區域變數。遊戲範本及指定線上規格由主代理在本批次開始時完整讀取，並記錄於 Plan26 上下文。

## 實作

- 背包非空格新增依 `bagIndex === state.selectedBagIndex` 設定的 `aria-pressed`。
- 背包使用、裝備按鈕的 `aria-label` 加入物品名稱。
- 背包出售數量輸入的 `aria-label` 加入物品名稱。
- 背包出售按鈕名稱包含物品名、`salePreview.quantity` 與 `formatNumber(salePreview.total)`。
- 商店購買按鈕名稱包含物品名、`preview.quantity` 與 `formatNumber(preview.total)`。
- 商店單筆出售按鈕名稱包含物品名、`preview.quantity` 與 `formatNumber(preview.total)`。

交易名稱沿用原有 preview，不重新計算或呼叫 helper。按鈕仍在原位置 append。未改 handlers、helpers、CSS、tests、metadata、可見文字、title、disabled、拒絕原因或既有 action／data／focus 屬性。

## 檢查

- 執行一次：`C:/Users/Tommy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe node_modules/typescript/bin/tsc --noEmit`
- 結果：exit code 0。
- 未執行 tests、browser、build、DOM 檢查或截圖；未做讀屏、實際 click／keyboard 或 layout 驗證。因此本報告不代表可用性實測通過。

## 下一步

主代理審閱 `src/ui/index.ts` 的七處局部 diff，確認預覽值及原 append／dispatch／focus 行為後進入 W02。
