# Plan41 W01・技能學習純預覽

2026-10-29（Asia/Hong_Kong）。**完成**。本批只新增預覽函式、focused tests、此報告與 `.playroom/tmp/plan41-skill-preview/vitest.log`；沒有接 UI 或修改 domain、content、app、舊檔及發布資料。

## 契約

- `previewSkillLearning({ player, rules, skillId })` 只呼叫一次 `applyProgressAction`，動作為 `learnSkill`。
- 失敗回傳 domain 原有的 `code` 和 `message`；成功只提供學習前後的 `DerivedStats` 與結果 `sp`，不暴露 draft player 或目前 HP／MP。
- 預覽使用 domain 的學習資格和數值行為，沒有另寫資格檢查或數值公式。生命鍛鍊增加最大 HP，但不會回補目前 HP。

## focused cases

新測試以 `rulesCatalog` 和 `createPlayer` 建立有效角色，涵蓋：

1. 重斬初學與升級：domain rank 分別增加至 1 和 2，SP 分別剩 1 和 0。
2. 以最後 1 SP 學習，結果剩餘 SP 為 0。
3. 生命鍛鍊初學及升級：最大 HP 分別由 260 增至 272、由 272 增至 284；角色原本 HP 200 不變。
4. 未知技能回傳 `NOT_FOUND`；敵方技能回傳不可由玩家學習的 `REQUIREMENT`。
5. 衝突條件驗證 domain 優先序：職業先於等級、等級先於 SP；滿級技能在 0 SP 時先回報 SP 不足，SP 足夠時回報最高等級。

每個預覽呼叫都核對輸入 player 與 rules 未改變。成功輸出只含 `before`、`after`、`remainingSp`，且沒有 `player`、目前 `hp` 或 `mp`；失敗輸出不含 `value`。

## 驗證

只執行一次新測試檔，使用指定 Node runtime 並把其 `bin` 目錄加到 `PATH`：

```powershell
$env:PATH = 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/skill-learning-preview.test.ts
```

結果：1 個 test file 通過、5 個 tests 通過，exit code 0。完整命令與輸出保存在 `.playroom/tmp/plan41-skill-preview/vitest.log`。沒有執行 tsc、其他測試、build 或 browser 驗收。

## 規格與界線

本批已讀 `AGENTS.md`、`plan/41-skill-learning-preview.md`、`plan/reports/plan41-handoff.md` 及線上 `templates/game-agent-template.md` 完整內容；handoff 記錄 root 已完整閱讀其列出的七份 Playroom 規格及模板（refs135–138）。本次適用既有 repository 模式、保留遊戲 ID／作者與修改範圍限制，沒有發布。

W01 純預覽 API 與 domain fixture 行為已完成 focused 驗證。尚未驗證 TypeScript 全專案型別、UI 接線、瀏覽器互動或發布成品；依 Plan41，W02 UI 工作等待 root 審閱本批 diff 後再進行。
