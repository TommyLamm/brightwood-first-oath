# Plan23 W01・背包分類與格位說明

2026-10-28（Asia/Hong_Kong）。W01 已完成，依 Plan23 只更新背包呈現文字與無障礙屬性。

## 實作

- 在 `buildInventoryPanel` 為原分類列加上 `group` 角色與「背包分類」名稱；五個原按鈕保留 label、action、kind、class 與 focus key，並依目前篩選狀態輸出 `aria-pressed`。
- 使用既有 `filtered.length` 顯示目前分類與物品組數；非「全部」時補充其他分類仍計入已用容量。grid 名稱含目前篩選與顯示組數。
- 物品格位 aria-label 改用原 `bagIndex + 1`；分類篩選下的空格稱為「分類顯示空位」，全部模式仍稱「空背包格」。保留原32格、空位數字、篩選 predicate、`data-bag-index`、focus key 與命令資料。
- 未選取物品時分別說明背包全空、目前分類無物品及有物品待選取；分類無物品時指向現有「全部」按鈕。已選取的詳細內容未改。

## 驗證

- 唯一執行的檢查：`& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules/typescript/bin/tsc' --noEmit`；退出碼 0，TypeScript 無診斷。PowerShell 啟動時另顯示 FileSystem provider 初始化警告。
- 未執行測試、build、browser、DOM、screen reader、click 或 layout 驗證；相關互動與實際可讀性仍未實測。
