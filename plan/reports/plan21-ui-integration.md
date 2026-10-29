# Plan21 W02・商店批次素材出售接線

2026-10-28（Asia/Hong_Kong）。商店批次素材區與 `sell-materials` 點擊分支已接上 W01 的 `previewMaterialSale`。

## 接線

- 商店面板依當前 player、rules 與商人互動狀態計算預覽。只有存在候選 action 時才顯示批次按鈕。
- 全部可售時維持「出售全部素材」語意並標示預期收入；部分可售時標示依序出售、預計收入、成交 `X／Y` 組及第一個拒絕原因，按鈕依預覽保持可用；零成交或非商人時停用按鈕並可見原因。
- 收入使用 `expectedProceeds`，沒有使用 `nominalProceeds` 作為收入顯示。
- 點擊以最新 view 重算預覽。若停用便不刪除草稿也不派命令；若可用，逐一遍歷完整 `preview.actions`，維持原 `sellQuantities.delete(bagIndex)` 與逐筆 sell dispatch，包含預覽拒絕的候選，並保留 collector 順序。
- 未改 CSS、單筆交易、裝卸、輸入事件、focus／rebind 或其他 panel 流程。

## 檢查

- 執行 `& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/typescript/bin/tsc --noEmit`：通過（exit code 0）。
- W01 focused 測試結果沿用 [W01 報告](plan21-material-sale-preview.md)，本工作包未重跑。
- 未啟動 browser、未執行 build／pack／完整測試套件；runtime 距離 gate 與實際商店互動仍未以 browser 驗證。
