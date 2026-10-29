# Plan46・HUD待回報任務數 UI

2026-10-29（Asia/Hong_Kong）。W01 已完成。

## 變更

- 在 `src/ui/index.ts` 的 `panelButtons` render 迴圈中，加入 `quests` 專用分支。
- 有 `saveData` 時只計算 `view.questViews` 中 `status === 'ready'` 的任務；沒有角色資料時數量為 0。
- 數量大於 0 時以數字設定既有 `data-badge`，並更新 aria-label 與 title，提示查看手帳中的回報 NPC 與獎勵。
- 零項時清除 badge，還原按鈕 aria-label 與 title；此分支以 `continue` 跳過 AP/SP 徽章邏輯。
- 此數量只表達待回報狀態，不呼叫 claim resolver，也不保證獎勵可領取。inventory、AP/SP 分支及其他面板互動未改。

## 規格與驗證

- 已完整讀取 Playroom `game-agent-template.md`；本批其餘七份線上規格已由 Plan46 handoff 記錄為完整讀取（refs 168–171）。
- 按 Plan46 W01 執行一次指定檢查：
  `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit`
- 型別檢查 exit code：`0`。完整命令輸出與 exit code：`.playroom/tmp/plan46-integration-review/tsc.log`。
- 未新增或執行 tests、DOM、browser、build 或 server。未驗證真實徽章顯示、click/focus、reader 可讀性與 layout。
