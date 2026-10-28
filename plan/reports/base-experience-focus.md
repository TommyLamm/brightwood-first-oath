# Plan17 B01：失焦明確恢復

日期：2026-10-28（Asia/Hong_Kong）  
負責：Luna-A  
狀態：實作完成；focused 檢查通過

## 變更與玩家行為

- `GameAppState` 新增 app-only `focusResumeRequired`，初始為 `false`；`worldIsFrozen` 將它與既有 pause／settings／window focus 條件合併。沒有加入 `SaveData`、localStorage 或雲端資料。
- window blur／document hidden 會釋放 held keys、清空 `pendingGameplayCommands`，並由 queue 移除 `attack`、`pickup`、`interact`、`inspect`、`useItem`、`togglePause`；只在有 gameplay 且 screen 為 `playing`、`paused` 或 `loading` 時設恢復閘門。app 中的 `bufferedAttack` 會從 gameplay shallow copy 移除；既有 `combat.attacks` 保留。
- blur 後 queue 保留的明確命令維持原 seq，閘門期間暫存非 transient gameplay 命令，待明確恢復後才交給 gameplay。若 update 開始時世界已凍結，該 tick 的五種 transient 命令不會因同一批 `togglePause`／解凍操作而補發。
- 只有 `windowFocused` 且 screen 為 `playing`／`paused` 的 `togglePause` 能清閘門；`playing` 保持 playing，`paused` 返回 playing。`loading`、`title`、`dead`、`result` 不會被此命令切成 playing。既有手動 pause/unpause 在沒有閘門時維持原行為；有 panel 時 Escape 仍走原 `closePanel` 命令，不會清閘門。
- focus、visible、canvas pointer 只回報通過 `visibilityState !== 'hidden' && document.hasFocus()` 的頁面焦點，不清閘門。同頁 canvas 移到 UI 的 focusout 只釋放鍵，不回報 window blur。
- 成功返回 title 及成功建立新角色會清閘門；暫時遊玩返回 title 只在 persistence 可開始重新載入並進入 loading 時清除，失敗的前置條件不會清旗標。map transition 完成不清閘門。音訊 `setPaused` 現在也包含閘門，focused fake port 已檢查 pause 狀態轉換，沒有聽音驗收。

## 來源與驗收依據

- 已讀 `AGENTS.md`、`plan/17-base-game-experience.md` §3.1、B01、§6，以及 `plan/reports/base-experience-current-handoff.md` 最新 04:05 段。依 §6 使用主代理提供的規格摘要：背景行為可預期、短 Esc 留在遊戲、iframe 模式切換不重載、保留既有玩法／存檔／訪客可玩；未改 SDK、iframe、manifest 或發布面。
- 實作來源：`src/app/app.ts` 的 `setWindowFocused`／`update`／`handleAppCommand`／`handleNewGame`／`synchronizeAudio`；`src/app/state.ts` 的 `GameAppState`、初始 state、`appCommand`、`worldIsFrozen`；`src/app/keyboard.ts` 的 focus／visibility／pointer 處理；`src/app/command-queue.ts` 的 `discard`。
- focused 案例覆蓋：blur 後 focus 仍凍結且明確恢復後才前進；buffer／pending／transient 清理與明確命令保留；map loading 完成仍鎖；loading／title／dead／result 及失焦狀態不能誤恢復；同頁 focusout 只放鍵、focus 事件須通過可見與 hasFocus；queue discard 保留 seq 與 nextSeq。

## 實際檢查

已確認指定 bundled Node 與 Vitest 入口存在：

```powershell
Test-Path 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
Test-Path 'node_modules/vitest/vitest.mjs'
```

focused 命令：

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/integration/app-focus-resume.test.ts --exclude '**/.worktrees/**'
```

第一次執行 4/5 通過；失敗是測試把「windowFocused=false 的輸入 state」與原本 `windowFocused=true` 的另一個物件用 `toBe` 比較。修正斷言後 5/5 通過；再將暫時遊玩 returnTitle 的旗標清除移到成功進入 persistence reload 的狀態更新中，並補上該路徑 assertion，最後一次執行為 **1 個測試檔、5/5 通過**，exit code 0。沒有執行全域 typecheck、舊 app-foundation 檔、全套 tests、browser、build、pack 或發布。

## 交給 B04

- B04 可從 app state 讀 `focusResumeRequired`；請在 `UiSnapshot` 增加選填 `focusResumeRequired?: boolean`，並由 `createUiSnapshot` 明確輸出。此包刻意沒有改 `createUiSnapshot` 或 ports。
- 恢復卡應在 `playing && focusResumeRequired` 或既有 `paused` 顯示；按鈕／適用 Escape 使用 `togglePause`。若存在 panel，Escape 會先關 panel且不清閘門；UI focus 回復需等 snapshot 的已 commit 轉換，再依 Plan17 §3.1 保留原 panel 的有效 `data-focus`，無 panel 才回 canvas。
- panel 命令、存檔操作與明確生命週期命令沒有加入 blur discard 集合。閘門期間非 transient gameplay 命令暫存至恢復後；B04 須封鎖拾取／互動／快捷遊戲動作；本包仍保留既有 lifecycle command 的 screen restriction／處理路徑。
- `focusResumeRequired` 只存在 app runtime state；不要將它加入 `SaveData` 或持久化 schema。無 browser／UI 視覺驗收，留 B04／B06 按分工處理。

沒有改動玩家真實存檔格式、玩法資料、素材、版本欄位或 beta19／beta20 候選；沒有 commit、push 或發布。
