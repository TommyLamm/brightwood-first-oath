# Plan31 W01・購買前裝備比較 UI

2026-10-28（Asia/Hong_Kong）。W01 UI renderer 與商店接線已完成，待主代理審閱完整 diff。來源基線為 `.playroom/tmp/plan31-integration-review/ui-before.ts`。主代理在同一任務已完整讀取 Playroom 範本與 Plan31 列出的七份線上規格；本子工作依該次閱讀結果執行。

## 實際變更

- 在 `src/ui/index.ts` 新增局部 `makeEquipmentComparison(document, view, player, item): HTMLElement | null`，使用 `UiSnapshot` 衍生的 player/item 型別。沒有 slot 時回傳 `null`；否則沿用背包原有的目前裝備查表、欄位名稱、攻擊／防禦／最大 HP 順序、忽略零差、正負 class 與箭頭、絕對值、分隔符和「能力相同」文字。
- 背包原比較區改為呼叫 renderer，並在結果非 null 時 append 到原位置；裝備預覽、按鈕與理由保持原樣。
- 商店商品卡只在 `item.slot` 存在時呼叫 renderer 一次，結果 append 在圖示／badge／名稱／details／單價之後、數量列之前。消耗品、素材與其他無 slot 商品不會新增比較行。價格、預覽、數量、購買按鈕及理由沒有改動。
- 本工作包只修改 `src/ui/index.ts` 並新增本報告；沒有修改交易／庫存邏輯、CSS、tests、app、domain 或 metadata。

## 驗證與限制

- 唯一執行的檢查：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit`。結果：exit 0。
- 未新增或執行 tests，未啟動 DOM、browser、截圖、build、pack 或 server，符合 W01 範圍。
- 真實商店版面、click、focus 與讀屏行為未驗；主代理需審閱完整 diff。通過 W01 審閱後才進行 W02 候選工作。
