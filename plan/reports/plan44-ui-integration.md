# Plan44 W02・背包分類 UI 整合

日期：2026-10-29（Asia/Hong_Kong）

## 實作

- 在 `src/ui/index.ts` 匯入 `INVENTORY_FILTERS`、`selectInventoryEntries` 與 `InventoryFilter`；分類狀態及 `PanelBuildState.inventoryFilter` 均使用 `InventoryFilter`，原有 state pass-through 保持不變。
- 分類按鈕沿 helper 的五項分類及原順序建立；各按鈕文字顯示「分類（組數）」，計數按背包 entry 組數計算，並設定要求的 `aria-label`。保留原按鈕 class、kind、focus key、pressed 狀態；零組分類仍可選。
- 背包目前分類改由 `selectInventoryEntries` 取得，移除 UI 內重複的分類判斷。note、32 格 grid、空位、選取與詳情流程維持原狀。
- `inventory-filter` handler 使用 `INVENTORY_FILTERS` 白名單。未知或相同分類直接返回，不清除選取、不重繪、不 dispatch；只有不同的有效分類會更新 filter、清除 `selectedBagIndex` 並按原方式重繪。未改動 `sellQuantities` 或 `bagStateMessage`。

## 驗證

- 執行一次指定的 TypeScript 檢查：
  `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit`
- 結果：exit code 0。完整命令輸出與 exit code 保存在 `.playroom/tmp/plan44-integration-review/tsc.log`。
- 沒有重跑 W01 的 focused Vitest；沒有執行其他 tests、DOM 或 browser 驗收。
- 尚未以真實互動驗證 click、focus、螢幕閱讀器朗讀或實際版面；這些項目未驗證。

## 交接

實作與指定 TypeScript 檢查完成，供主代理審閱本批局部 diff。Plan44 W03 候選建置工作尚未執行。
