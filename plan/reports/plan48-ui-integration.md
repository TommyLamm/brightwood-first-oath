# Plan48 W02・商人所在地圖 UI 整合

日期：2026-10-29（Asia/Hong_Kong）

## 來源與適用要求

- 已讀取 `AGENTS.md`、`plan/48-merchant-map-shortcut.md`、`src/ui/npc-map-target.ts` 及 W01 報告 `plan/reports/plan48-npc-map-target.md`；根目錄沒有 `.codegraph/`。
- 已用網路完整讀取 Playroom `game-agent-template.md`。主代理在本批開始前完整讀取範本列出的七份線上規格；W01 報告記錄其完整閱讀（含文件尾段）。沿用 `brightwood-first-oath`／`TommyLamm`／`desktop`、相對資源、跨來源 iframe 契約及讀取格式 1–5／寫入格式 5、SDK 1.1.0／protocol 1／schema 2／tools 1.2.0 基線。
- 本階段只新增唯讀地圖入口與面板導覽；不改角色位置、移動或 gameplay command，也不改交易、草稿、地圖資料、全域開關面板或焦點機制。

## 實作

- 在 `src/ui/index.ts` 以命名匯入 W01 的 `resolveNpcMapTarget`，並在 `UiAction` 加入 `review-npc-map`。
- 新 handler 讀取按鈕的 `data-npc-id`，由最新 `currentView.catalog.world` 查找；缺 ID 或沒有地圖目標就結束。找到目標後只設定 `selectedMapId`：地圖已在最上層時重繪既有面板，否則沿用 `setPanel` 開啟地圖。沒有呼叫 `focusGameCanvas` 或改動遊戲位置。
- 商店面板在商人提示後、背包狀態訊息前，僅在不處於商人互動且 catalog 找到商人地圖時顯示次要按鈕「查看商人所在地圖」。按鈕帶 `npcId: merchant` 及 `focus: shop-merchant-map`；title 與 aria-label 使用 catalog 的實際 NPC／地圖名稱並說明「只查看地圖，不會移動角色」。

## 驗證

- 依指示只執行一次 TypeScript 型別檢查：
  `C:/Users/Tommy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe node_modules/typescript/bin/tsc --noEmit`
- 結果：exit 0。完整輸出、命令與 exit code 記錄於 `.playroom/tmp/plan48-integration-review/tsc.log`。
- 執行 `git diff --check -- src/ui/index.ts`；沒有空白錯誤診斷。
- 沒有執行測試、build、DOM/browser/server 檢查。

## 尚未驗證

未實際點擊入口；鍵盤焦點是否維持／恢復、從其他地區開啟後選中正確地圖、螢幕閱讀器宣讀、畫面配置與 iframe 內版面均未作人工驗收。

## 交接

W02 指定 UI 整合及單次 `tsc` 已完成，交由主代理審閱 `src/ui/index.ts` 局部改動、此報告及日誌。沒有處理 W03 候選或發布。
