# Plan44 W01・背包分類純選取

日期：2026-10-29（Asia/Hong_Kong）

## 實作

- 新增 `src/ui/inventory-entries.ts`，匯出 readonly 五分類 `INVENTORY_FILTERS`、`InventoryFilter`、`InventoryEntry` 與 `selectInventoryEntries`。
- helper 先依原背包順序建立 entry，再按分類篩選；保留原 `bagIndex`、stack/item 參照及同 item 的獨立背包組。`all` 包含缺失 catalog 定義的項目，其他分類依 kind 精確過濾，equipment 僅含 weapon/body/hat。
- 此 helper 只讀 bag 與 catalog，不排序、合併、數量篩除或修改輸入；無 UI、domain、player 或 selection 操作。

## Focused cases

`tests/inventory-entries.test.ts` 覆蓋五組：分類 id/標籤及 all 的順序、索引、重複 item 與缺資料；三種 gear；consumable/material/quest 精確分類；空 bag 與缺 catalog；所有 filter 的新陣列、原引用及輸入不變。

## 驗證

- Playroom 規格已按 repo `AGENTS.md` 完整讀取：template、game-development、command-contracts、Manifest Schema、release workflow、starter SDK、sdk-versioning、save-compatibility。此 W01 不改接入、存檔或發布行為。
- focused Vitest：指定命令執行一次，1 個 test file、5 tests passed，exit code 0；完整命令輸出與 exit code 保存在 `tmp/plan44-inventory-entries-vitest.log`。
- 未執行：tsc、其他 tests、UI/browser/build/server 驗收。
- 下一步：交 root 審核本 W01 局部 diff 後再進入 W02。
