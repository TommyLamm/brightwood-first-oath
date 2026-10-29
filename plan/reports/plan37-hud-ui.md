# Plan 37 W01・HUD 背包容量提醒

日期：2026-10-29（Asia/Hong_Kong）

## 已讀規格與範圍

- 工作區：`AGENTS.md`、`plan/37-hud-bag-capacity.md`。
- 線上規格（由主代理本批完整閱讀）：`game-agent-template.md`、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility。
- 本次只在 `src/ui/index.ts` 的 `panelButtons` render 迴圈新增 inventory 分支；沿用現有 view 的玩家背包資料，不改 AP/SP 段或其他遊戲行為。

## 完成項目

- 有玩家時讀取 `player.bag.length`，更新背包鈕的 `aria-label` 與 `title`；已用量達 28 格時加上整理空位提示並以 `data-badge` 顯示數字，低於 28 格時移除徽章。
- 無玩家時還原原本的 aria-label 與 title，並移除徽章。分支以 `continue` 跳過原 AP/SP 徽章段。
- 與唯讀基線 `.playroom/tmp/plan37-integration-review/ui-before.ts` 比對，差異只有此 inventory 分支。

## 驗證與未驗項目

- 執行一次：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit`，exit code `0`。TypeScript 無診斷；PowerShell 啟動時另輸出 `InitializeDefaultDrives` provider 警告。
- 未執行 tests、DOM 或 browser 檢查。
- 真實 UI 的 badge 版面、容量跨越 28 格後的即時刷新及螢幕閱讀器表現未驗證。
