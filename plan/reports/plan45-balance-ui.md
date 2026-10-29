# Plan45 W01・交易後金幣預覽 UI

2026-10-29（Asia/Hong_Kong）。依 Plan45 僅修改 `src/ui/index.ts` 的四個指定呈現區，對照基線 `.playroom/tmp/plan45-integration-review/ui-before.ts` 的差異只有這四區。

## 實作

- `buildInventoryPanel`：保留原出售 note；只有 `salePreview.disabled` 為 false 時，附上 `player.coins → player.coins + salePreview.total` 的格式化預覽，設定背包出售 note ID 並由出售按鈕引用。
- `buildShopPanel` 購買卡：只在成功 preview 時於原購買按鈕前加入購買後金幣 note，餘額為 `player.coins - preview.total`；按鈕引用新 note。
- 批次素材出售：在原容量預覽句後補上金幣預覽，採用 `player.coins + materialSalePreview.expectedProceeds`，原 note ID 與按鈕描述保留。
- 單組出售列：將原價格 span 抽為 local，保留原文字、標籤、class 及 row 的 append 順序，不增加 row child；成功 preview 才附上 `player.coins + preview.total`，並讓出售按鈕引用此 span。

所有餘額數字使用 `formatNumber`。背包單售、商店購買及單組出售僅在各自 preview 成功時新增餘額、note ID 與 `aria-describedby`；失敗時保留原失敗原因。批次素材 note 仍依原 `expectedSoldStacks > 0` 條件顯示，原 note ID 與描述不變。沒有新增 helper、preview 呼叫、domain action、樣式或狀態變更。

## 驗收

- 已執行一次指定 TypeScript 檢查，exit code 0，無 TypeScript 診斷。完整命令、輸出與 exit code 記於 `.playroom/tmp/plan45-integration-review/tsc.log`。
- 未執行 tests、DOM、browser 或 build。真實數量輸入、click、focus、reader 與版面仍未驗。
