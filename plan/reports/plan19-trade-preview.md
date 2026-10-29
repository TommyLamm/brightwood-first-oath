# Plan19 W02・購買前置純 model

狀態：完成；新增檔案已限縮於 W02 指定的 helper、focused test 與本報告。

## 讀取與適用要求

- `AGENTS.md`、`plan/19-base-experience-next-batch.md` §3.2／W02。
- 本輪線上 Playroom template 與 `docs/game-development.md` 已讀；其餘六份 template 列出的線上規格由主代理本輪完整讀取。
- 依 W02：以純 UI model 取得購買可否與原錯誤，merchant 條件優先；堆疊品使用有效數量 1–99，非堆疊品固定 1；價格與容量結果沿用 progression domain。絕不將預覽回傳的 player 套回遊戲、不複製容量規則、不加交易副作用／快取，也不找最大可買量。

## API 給 W04

在 `src/ui/trade-preview.ts` 匯入 `previewBuy`、`TradePreviewInput`、`TradePreview` 與 `TradePreviewCode`。

```ts
previewBuy({ player, rules, itemId, quantity, atMerchant })
```

- `quantity` 是商品卡目前已驗證的數量草稿；堆疊品需為 1–99 的整數。helper 對非堆疊品固定回傳數量 1。W04 在提交邊界先依目前有效整數規則處理草稿，不能把 NaN、負數、非整數或大於 99 傳入 helper 或 buy command。
- 回傳 `{ quantity, total, disabled, reason, code }`。`total` 用當前商品單價乘有效數量供畫面顯示；helper 不判斷背包空位。
- 優先序：非 merchant 回傳 `NOT_AT_MERCHANT` 與「需在商人互動中購買」；merchant 狀態才呼叫 `applyProgressAction(player, { type: 'buy', itemId, quantity }, rules)`。失敗時沿用 domain `code`／`message`；成功時 `disabled: false`、`reason`／`code` 為 `null`。所有分支都丟棄 Result 的 `value`。
- 商品卡總價／原因／disabled 與 dispatch 的數量應共用此 preview；點擊時依最新 view 重算，僅在 `disabled === false` 時用 `preview.quantity` dispatch。此 model 不保存預覽結果。

## 驗收

Focused test 覆蓋非 merchant 優先、金幣不足、32 格滿且無 fit、滿格但既有同品堆疊可補、空一格的 exact fit 與多一件、非堆疊裝備需一格、堆疊品 99 件，以及每種 preview 呼叫後 player 深比較不變。測試使用本檔內小型 RulesCatalog 與合法 PlayerProgress，不啟動遊戲、不載入存檔。

執行：

```text
node C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/vitest/vitest.mjs run tests/trade-preview.test.ts --maxWorkers=2
```

結果：`1 passed`、`7 passed`（Vitest 5.0.5，384 ms）。未改 domain 或 UI；未執行整套測試、browser、typecheck、build 或遊戲驗收。
