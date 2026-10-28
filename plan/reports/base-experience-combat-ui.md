# B03 戰鬥 UI 狀態交接

## 範圍與契約

新增 `src/app/combat-ui-state.ts`，匯出契約指定的 `CombatUiState` 與 `deriveCombatUiState(gameplay, catalog, nowMs)`。helper 只讀 runtime 狀態，依 catalog 技能的 windup、active、recovery 時長，回傳玩家仍有效 attack 的最大結束時間。敵方攻擊、已結束攻擊、找不到技能及非 attack 技能不造成鎖定。只在玩家存活且 `expiresAtMs >= nowMs` 時回傳排隊技能；helper 不建立、續期、消費 buffer，也不改 combat 或其他輸入資料。

## 提供 B04 的範例

以 `startedAtMs = 1000`、`nowMs = 1400` 為例，現有 catalog 結果如下：

| Skill | Action lock deadline |
| --- | ---: |
| `basic` | 1550 ms |
| `heavy-strike` | 1650 ms |
| `sweep` | 1850 ms |

到達攻擊結束時間時即不再視為動作中。buffer 到期時間為 1100 ms 時，在 1100 ms 仍回傳技能，至 1101 ms 隱藏；玩家死亡時不回傳排隊技能。這些只是狀態摘要，不代表必定命中或必定接續出招。

## 驗證與後續

`tests/combat-ui-state.test.ts` 覆蓋 basic/heavy/sweep 玩家攻擊時限、敵方／過期／非 attack 排除、buffer 到期與死亡邊界、null gameplay，以及輸入不變。

已從專案根目錄執行指定 focused 命令：

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/combat-ui-state.test.ts --exclude '**/.worktrees/**'
```

結果：1 個測試檔、5 個測試通過。B03 未執行 UI 整合、browser、build、package 或全域 typecheck。B04 可將 `deriveCombatUiState` 當純 runtime 摘要使用；UI 顯示順序及冷卻呈現屬 B04 範圍。
