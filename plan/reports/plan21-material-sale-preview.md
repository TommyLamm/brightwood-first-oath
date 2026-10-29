# Plan21 W01・素材出售預覽模型

2026-10-28（Asia/Hong_Kong）。實作 `collectMaterialSaleActions(player, rules)` 與 `previewMaterialSale({ player, rules, atMerchant })`，供後續商店接線沿用。

## 行為與回傳

- 收集器只選 `material` 且 `sellPrice > 0` 的背包 stack，按原 index 由高至低回傳整組數量；action 陣列與 action 物件均凍結。
- 預覽保留完整候選。商人前置未滿足時以 `NOT_AT_MERCHANT` 優先回報；商人狀態但無候選時回報 `NO_MATERIALS`。
- 商人狀態下逐 action 呼叫 `applyProgressAction`。成功採用 domain 的 player 繼續模擬；失敗保留狀態並繼續後續候選，保留第一個 domain code/message。預覽物件凍結且不回傳模擬 player。
- `nominalProceeds` 是所有候選的標價總和；`expectedProceeds` 是模擬結束與輸入 coins 的差。部分成功仍可用，全部候選被拒絕則停用。

## Focused 驗收

新增測試六組，覆蓋空候選／非素材／零售價、商人前置優先、同 item 多 stack 與完整候選順序、累計金幣上限、較高整組失敗後較低 stack 繼續，以及全數拒絕。各組檢查輸入 player／rules 不變；測試成功及失敗皆以原 domain action 比對結果，並檢查 action／preview 深層凍結。

執行命令：`& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/material-sale-preview.test.ts`。結果：1 個測試檔通過、6 個測試通過（Vitest 5.0.5，567 ms）。

## 邊界

本工作包僅新增 helper、測試與本報告；未改 app／UI、domain、交易政策或平台接入。商人互動旗標與預覽僅代表當前 view snapshot，不保證 runtime 距離、排隊狀態或真正交易結果。未執行 typecheck、browser、build／pack、全套測試或候選驗證。
