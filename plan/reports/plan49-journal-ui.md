# Plan49 W01・手帳 NPC 地圖按鈕

2026-10-29（Asia/Hong_Kong）

## 實作

- `src/ui/illustrated-panels.ts` 匯入既有 `resolveNpcMapTarget`，在 `buildVisualQuests` 原地圖按鈕位置，依 `ready` 使用回報 NPC、依 `available` 使用接取 NPC。
- 查找成功時仍建立單一原位置按鈕，使用 `review-npc-map` 與 `{ npcId }`，label、title、aria-label 說明任務、角色、實際 NPC／地圖名稱及「只查看地圖，不會移動角色」。按鈕仍由原 `button` helper 產生。
- 其他狀態或查無 NPC／地圖時保留原世界地圖按鈕。未更動任務選取、任務狀態、接取或領獎邏輯、地圖模型、handler、focus helper 或 append 順序。

## 檢查與限制

- 使用指定 Node 執行 `node_modules/typescript/bin/tsc --noEmit`，exit code 0。完整命令與輸出：[tsc.log](../../.playroom/tmp/plan49-integration-review/tsc.log)。
- 未執行 tests、browser、server 或 build；未驗證真實點擊、跨區選圖、focus／reader 行為與版面。請 root 依 `.playroom/tmp/plan49-integration-review/illustrated-before.ts` 審核本次單一按鈕區塊。
- Playroom 範本已讀；其餘列出的線上規格由 root 本批完整讀取（refs188–191）。
