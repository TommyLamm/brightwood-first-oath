# Plan 33 W01：最大可買量預覽

已新增 `src/ui/maximum-buy-preview.ts`：先沿用 `previewBuy` 驗證數量 1，堆疊且可買時由 99 遞減至 2，回傳第一個成功結果；失敗或沒有更大可買數量時保留數量 1 的原結果。最多呼叫 domain preview 99 次，不套用交易或回傳 player。

新增 `tests/maximum-buy-preview.test.ts`，以真實 domain 覆蓋 99 上限、金幣邊界、部分堆疊／空格／滿包、商人優先／未知／不可購買／零金幣及非堆疊物品。每個場景都比對 player 與 rules 未改變，並確認結果沒有 player 欄位。

已讀：根目錄 `AGENTS.md`、`plan/33-maximum-buy-quantity.md`、`src/ui/trade-preview.ts`、`tests/trade-preview.test.ts` 及 `src/domain/progression/index.ts` 買入分支。Playroom 範本與線上規格由主代理本批完整讀取；本工作僅實作唯讀 domain 預覽，無存檔、平台或發布變更。

驗收：僅執行新測試檔一次，使用專案指定 Node 24 runtime；未執行 typecheck、舊測試、build 或 browser 檢查。

實際命令：指定Node24的node.exe執行 `node_modules/vitest/vitest.mjs run tests/maximum-buy-preview.test.ts`，1 file／5 tests PASS，exit0。主代理已讀helper與全檔測試，確認1失敗優先、descending bounded search及input不變案例；未重跑。
