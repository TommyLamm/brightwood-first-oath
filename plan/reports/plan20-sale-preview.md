# Plan20 W02・單筆出售預覽

2026-10-28（Asia/Hong_Kong）。W02 已完成；僅新增本報告、純預覽 helper 與其 focused test。

## API 與行為

- `previewSale(input: SalePreviewInput): SalePreview` 接收 `player`、`rules`、`bagIndex`、呼叫端已驗證的整數 `quantity`、`atMerchant`。
- 回傳 `quantity`、`total`、`disabled`、`reason`、`code`；code 沿用 `ErrorCode`，另含 UI 前置碼 `NOT_AT_MERCHANT`。
- 先安全檢查索引以取得該商品目錄中的 `sellPrice × 同一 quantity`；無效索引不讀取 stack，total 為 0。商人前置拒絕優先；其餘結果由原 `applyProgressAction` 的 sell action 決定。沒有採用 domain 成功結果中的 player。
- 不加入 quantity clamp、購買的 99 件限制、縮量重試、金幣上限或距離判定；UI 仍須提供當前 stack 中有效數量，nearNpc 由 app 負責。

## 驗證

執行：

```text
C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/vitest/vitest.mjs run tests/sale-preview.test.ts --maxWorkers=2
```

結果：1 個 test file、5 項測試通過。覆蓋商人前置優先、合法出售與收入、恰達 9,999,999 金幣及多一件拒絕、過時索引、數量不足與不可售物；各路徑均深比較確認輸入 player 未變。未跑其他測試或 typecheck，未啟動遊戲／雲端。
