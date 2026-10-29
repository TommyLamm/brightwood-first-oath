# Plan48 W01・NPC 地圖目標查找

日期：2026-10-29（Asia/Hong_Kong）

## 來源與適用要求

- 已讀取 `AGENTS.md`、`plan/48-merchant-map-shortcut.md`、`plan/reports/plan48-handoff.md`，以及 `src/contracts/definitions.ts`、`src/content/world/index.ts`、`src/content/world/maps.ts`、`src/content/world/npcs.ts`。
- Playroom 範本及其中七份線上規格已由主代理在本批開始前完整讀取（含文件尾段）。沿用 `brightwood-first-oath`／`TommyLamm`／`desktop`、相對資源、存檔讀取 1–5／寫入 5、SDK 1.1.0／protocol 1／schema 2／tools 1.2.0 基線；此包只新增純查找函式，沒有改動遊戲存檔、執行時狀態或發布設定。
- 驗收範圍：真實 catalog 的商人地圖與名稱、複製資料的 placement/name 動態查找及輸入不可變、未知 NPC／無 placement／缺 NPC 定義皆回傳 `null`，回傳值只有三個 primitive 欄位。

## 實作

- 新增 `src/ui/npc-map-target.ts`：先查 `world.npcs[npcId]`，再依 `Object.values(world.maps)` 原序尋找第一個包含該 placement 的地圖，回傳 catalog 內的 map ID/name 與 NPC name；沒有定義或 placement 時回傳 `null`。
- 新增 `tests/npc-map-target.test.ts`：使用真實 `worldCatalog` 驗證商人位於木葉鎮；在深複製資料中移動 placement 到晨光營地並改名，驗證查找結果跟隨新資料且原輸入未變；涵蓋三種缺失情況。

## 驗證

使用 Node 24.22.1 直接執行指定 Vitest 檔。第一次執行有 2 項通過、1 項失敗（exit 1）：失敗是測試把完整 `worldCatalog` 與僅含 `maps`、`npcs` 的快照比較。已修正比較範圍，保留初次完整紀錄於 `.playroom/tmp/plan48-integration-review/npc-map-target-vitest.log`。修正後依主代理指示再執行一次，3 項通過（exit 0），完整命令、輸出及 exit 紀錄於 `.playroom/tmp/plan48-integration-review/npc-map-target-vitest-fixed.log`。

沒有執行 TypeScript typecheck、其他測試、build、browser 或 server 檢查。

## 交接

W01 指定實作與 focused 驗證已完成，交由主代理審閱新 helper、測試與本報告；未處理 W02 或後續工作。
