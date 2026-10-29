# Plan40 W01・背包藥水恢復預覽

2026-10-29（Asia/Hong_Kong）。

## 變更

- 在 `src/ui/index.ts` 的 `buildInventoryPanel` 消耗品區沿用既有唯一一次 `resolveItemUse` 結果。
- 預覽成功時，以 `formatNumber` 顯示原 `player.hp/mp` 與 `usePreview.value.player.hp/mp`，格式為「HP before → after；MP before → after」。在原使用按鈕前新增「使用後預覽：summary」說明，並將成功 title 設為「使用一個：物品名；summary」。
- 保留按鈕可見文字、aria-label、data、disabled，以及失敗 title／原因；失敗時不顯示恢復預覽。未指派預覽 player，也未新增 resolver 呼叫。

## 驗收

- 只執行一次指定的 TypeScript 檢查：
  `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit`
- 結果：exit code `0`，沒有診斷輸出。完整命令、輸出與 exit code 保存於 `.playroom/tmp/plan40-w01-tsc-20261029.txt`。
- 未新增或執行 tests、未啟動 browser／server、未 build。真實 UI 的 click、focus、冷卻到期、版面與 reader 行為未驗證。
