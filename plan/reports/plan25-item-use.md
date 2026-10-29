# Plan25 W01・共用藥水使用判定

狀態：完成（2026-10-28）。

## 已讀規格與適用要求

- 本次讀取 `AGENTS.md` 與 `plan/25-inventory-item-use-feedback.md`。
- 依主代理本批次交接，沿用其完整閱讀 Playroom 範本與「開始前讀取線上規格」指定七份 main 文件的要求；主代理確認完整讀取，沒有讀取失敗。
- 本工作只實作 W01：抽出原 app useItem 判定，保留冷卻、有限小藥轉大藥、補貨訊息及 domain 呼叫次序；app 仍只在成功後設定 `nowMs + 1000` 並採用 domain player。

## 交付

- 新增 `resolveItemUse({ player, rules, requestedItemId, nowMs, potionReadyAtMs }): Result<{ player, itemId }>`：冷卻時回原 `COOLDOWN`／訊息；只有指定小紅或小藍缺貨時才改用對應大藥；resolved consumable 缺貨回原 `NOT_FOUND`／補貨訊息；其餘錯誤沿用 domain code/message，成功回 domain player 及 resolved ID。helper 不修改輸入，也不負責設定 cooldown。
- `gameplay.ts` useItem 分支改用 helper；失敗沿用原 toast，成功仍沿用原位置更新 cooldown 與 player。保留該檔既有共享修改。
- 新增六組 focused cases，涵蓋冷卻優先及期限邊界、小藥優先、紅／藍大藥替代、直接大藥不反向替代與補貨訊息、滿 HP／MP／死亡 domain 拒絕、未知及非消耗品 domain 結果；成功與失敗均檢查 player/rules 輸入不變。

## 已執行檢查

1. `& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\vitest\vitest.mjs run tests/item-use.test.ts`：1 個檔案、6/6 tests 通過，exit 0。
2. `& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\node_modules\vitest\vitest.mjs run tests/integration/app-gameplay.test.ts -t 'requires merchant interaction to sell and falls back to large potions when small potions run out'`：選取案例 1/1 通過，另 25 例略過，exit 0。

未執行 tsc、完整測試套件、build、browser／UI 驗證；這些不屬 W01 驗收範圍，後續包按 Plan25 指示接續。
