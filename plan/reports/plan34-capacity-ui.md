# Plan34 W01・商店背包容量提示交接

2026-10-29（Asia/Hong_Kong）。**W01 實作完成，交主代理整合**。

## 範圍與變更

- 唯一程式改動在 `src/ui/index.ts` 的 `buildShopPanel`：錢包提示後、商品列表前新增「背包：已用 N／32 格」提示，`N` 取自 `player.bag.length`。
- `strong` 沿用背包現有 `used >= 28 ? 'ms-bag-usage is-near-full' : 'ms-bag-usage'` class。容量說明指出可補入同類未滿堆疊，購買能力依各貨品提示；內容以文字節點組成，沒有設定新 role 或 aria-live。
- 沒有修改 preview、handler、disabled 條件、分類、數量 map、bag selection、焦點、signature 或 timer，也沒有增加滿 32 格禁買邏輯。

## 讀取來源與規格

- 本批讀取 `AGENTS.md`、`plan/34-shop-bag-capacity.md`、`src/ui/index.ts` 的 `buildInventoryPanel`／`buildShopPanel`，及唯讀基線 `.playroom/tmp/plan34-integration-review/ui-before.ts`。
- 按交接指示，Playroom 範本及其「開始前讀取線上規格」文件由主代理在本批開始前完整網讀：game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility。適用本批的是維持既有遊戲身分與資料相容、只顯示背包槽位使用數，以及不改變 domain 容量／交易規則。

## 驗證

- 版本唯讀確認：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --version` → `v24.22.1`。
- 唯一編譯命令：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit` → exit code `0`。
- 沒有執行 tests、browser、DOM、build 或 metadata 檢查。

## 尚未驗證與下一步

- 尚未視覺檢查版面，也未確認切換面板或交易後實際重新呈現；本批只完成容量提示的 UI 組裝與 TypeScript 編譯。
- 主代理檢閱本批局部 diff 後，依 `plan/34-shop-bag-capacity.md` 的 W02/W03 繼續獨立候選建置與總交接。
