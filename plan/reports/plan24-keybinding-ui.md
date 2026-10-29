# Plan24 W01・重綁名稱與群組

2026-10-28（Asia/Hong_Kong）

## 完成內容

- 在 `src/ui/index.ts` 的 `buildSettingsPanel` `KEY_ACTIONS` 迴圈中，為既有 row 加上 `role="group"` 與包含動作名稱及既有有效鍵位文字的 `aria-label`。
- 為既有重綁鈕加上描述動作及目前鍵位的 `aria-label` 和 `title`。一般狀態以「更改按鍵」開頭；等待狀態保留「按鍵中」語意並包含「按 Esc 取消」。沿用該迴圈已計算的 `value` 與 `state.pendingBinding`。
- 保留可見文字、既有 class、`actionId`、focus key、元素及插入順序、`bindingMessage` 和 `role="status"`。

## 規格與範圍

已讀專案 `AGENTS.md` 與 `plan/24-keybinding-control-context.md`。主代理已完整讀取 Playroom 遊戲範本及其七份指定線上文件；本工作遵守固定專案識別與資源規格，不涉及候選或發布。

只修改指定 `KEY_ACTIONS` 迴圈並新增本報告；未修改 handlers、focus 邏輯、鍵位解析 helper、CSS、測試、app/domain 或其他候選資源。

## 驗證與界線

唯一執行的檢查：

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/typescript/bin/tsc --noEmit
```

結果：退出碼 `0`，無 TypeScript 診斷。未新增或執行測試，未使用 browser、DOM、screen reader、build 或截圖驗收；因此不代表實際輔助科技朗讀或版面效果已驗證。
