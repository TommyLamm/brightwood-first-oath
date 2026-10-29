# Plan32 W02・商店分類 UI 接線

2026-10-28（Asia/Hong_Kong）。W02 完成，交主代理審閱；未執行候選打包或發布。

## 已讀文件與適用要求

- 本地：`AGENTS.md`、`plan/32-shop-category-navigation.md`、`src/ui/shop-offers.ts`、`plan/reports/plan32-shop-offers.md`。
- 線上規格：沿用主代理在同一任務已完整讀取的 Playroom `game-agent-template.md` 與其中七份主規格：game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning、save-compatibility。
- 本批只在 `src/ui/index.ts` 接入 W01 helper，新增商店購買分類 UI；保持 UI 專屬分類狀態、原購買卡與出售區塊，並只執行一次指定 TypeScript 檢查。

## 變更

- `src/ui/index.ts` 匯入 `SHOP_FILTERS`、`selectShopOffers`、`ShopFilter`；新增 `shop-filter` action 與獨立 `shopFilter: ShopFilter = 'all'`。將分類值加入面板 render signature、`PanelBuildState` 及傳入 state；未加入 `clearTransientViewState`，未改 `inventoryFilter`、選取狀態或數量 maps。
- 新 handler 僅接受 `SHOP_FILTERS.find(({ id }) => id === button.dataset.kind)` 找到的類別；未知值直接返回。有效類別更新 `shopFilter` 並呼叫既有 `renderPanel(view, true)`，沒有 dispatch 或自訂 focus 邏輯。
- `buildShopPanel` 以 `selectShopOffers` 取得 offers，刪除原 UI `shopKindOrder`。在「商店貨品」標題後、購買 grid 前加入三個常數分類 chip、當前分類件數提示及空結果訊息；提示說明出售清單維持全部。原商品卡、Plan31 裝備比較、交易呼叫及出售內容未改。
- 以 `.playroom/tmp/plan32-integration-review/ui-before.ts` 比對，`index.ts` 相對本批基線僅有上述 W02 變更。工作樹中既有其他 dirty／untracked 檔案保留未動。

## 驗證與未驗項目

只執行一次 TypeScript 檢查，exit code 0：

```text
& 'C:/Users/Tommy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' node_modules/typescript/bin/tsc --noEmit
```

未執行 tests、DOM、browser、build、pack 或 server。尚未以真實 UI 驗證切換分類後的 focus、購買數量草稿保留、click／blur 行為及版面；出售清單與交易流程的執行期行為也未做互動驗證。
