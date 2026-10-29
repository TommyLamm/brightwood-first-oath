# Plan 39 W01：全部 AP 敏捷入口

狀態：完成 UI 實作。

## 範圍

在 `src/ui/illustrated-panels.ts` 的既有 `player.ap > 5` 區塊中，以唯讀 tuple 依序產生「全部 AP → 力量」及「全部 AP → 敏捷」按鈕。兩者沿用 `allocate-ap`、當前 AP 數量、secondary class 與 `describeAllocation` 的 disabled、title、aria-label。力量按鈕維持既有文字與資料欄位順序；原 AP 門檻、卡片加點、help 及其他規則不變。

## 規格與驗收

已讀 `AGENTS.md`、`plan/39-all-ap-dexterity.md` 及程式中相關 UI 區域；主代理已完整讀取 Playroom 範本及其列出的七份規格，共八份文件。依本批要求只修改原 AP 區與本報告，不改 handler、domain、CSS、存檔或 state。

## 驗證

- 一次執行 `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit`：exit 0。
- 未執行測試、DOM/browser 驗證。真實 click、focus、版面與讀屏行為未驗。
