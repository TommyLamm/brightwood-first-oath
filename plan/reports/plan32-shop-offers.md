# Plan32 W01・商店貨品選取

2026-10-28（Asia/Hong_Kong）。W01 純選取 helper 與 focused tests 完成，供主代理審閱後交 W02 UI 接線。

## 已讀文件與適用要求

- 本地：`AGENTS.md`、`plan/32-shop-category-navigation.md`。
- 線上規格：主代理在同一任務已完整讀取 Playroom `game-agent-template.md`，以及其中列出的 game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning、save-compatibility 七份主規格；本 W01 沿用該次讀取結果。
- 本批只新增純貨品篩選／排序 helper 與最多五組 focused 測試；保持原可買資格與排序，分類只改選取範圍，不讀玩家狀態、不改貨品或交易行為。

## 變更

- 新增 `src/ui/shop-offers.ts`：匯出 `SHOP_FILTERS`、`ShopFilter` 與 `selectShopOffers`。all 保留所有 `buyPrice > 0` 且非 quest 貨品（包含正價 material）；consumable 僅選 consumable；equipment 僅選 weapon、body、hat。排序沿用 kind、minLevel、buyPrice 順序，最後以輸入次序明確保持同值穩定；回傳新陣列並保留原 ItemDef 參照。
- 新增 `tests/shop-offers.test.ts`：五組小 fixture，涵蓋資格、完整排序與同值穩定、消耗品、三種裝備，以及空結果／輸入不變／陣列獨立。

## 驗證

執行一次指定 focused 命令，exit code 0：

```text
& 'C:/Users/Tommy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' node_modules/vitest/vitest.mjs run tests/shop-offers.test.ts
```

結果：1 個 test file 通過，5/5 tests 通過。未執行 tsc、舊測試／完整 suite、DOM、browser、build 或 ZIP 驗證；本批未驗證 UI 整合與真實畫面，留待 W02／主代理處理。
