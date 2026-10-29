# Plan22 W01・共用領獎計算及 app 接線

2026-10-28（Asia/Hong_Kong）。W01 已完成，交付共用純計算 helper 並讓 gameplay claimQuest 分支採用其成功結果。

## 實作

- 新增 `src/domain/quests/claim.ts`：匯出 `resolveQuestClaim(data, questId, catalog): Result<ResolvedQuestClaim>` 與結果型別。計算順序保留為 `planQuestClaim` → `removeItems` → 可選 `setLevelFloor` → 可選 `changeJob` → `gainReward`；錯誤直接回傳，只有全數成功才回傳玩家、已領任務狀態及原始獎勵。此流程使用 progression 現有容量與金幣驗證，不另行重寫公式。
- 更新 `src/app/gameplay.ts` 的 helper import 與 `claimQuest` 分支。仍由 app 執行任務／NPC距離 gate；成功後沿用原玩家升級特效、q08 chapter flag／畫面、獎勵 toast、interaction refresh 與存檔提交位置。
- 新增 `tests/quest-claim.test.ts` 七組：正常成功與輸入不變、滿包獎勵仍放不下、交付騰位後領取、滿包 stack 合併、金幣上限邊界、minLevel 後轉職，以及未知／未完成／已領拒絕。成功與失敗案例均檢查 SaveData 和 ContentCatalog 未變。

## 驗證

- 新 helper focused 測試：首次執行 6 passed、1 failed；唯一失敗是正常領獎案例把既有藥水誤當空背包，修正 assertion 為原 stack 數量加獎勵數量後，新檔重跑 7 passed。之後按需以 `-t` 單獨重跑該案例，1 passed、6 skipped。七個不同案例均有通過結果。
- gameplay 精選案例：`tests/integration/app-gameplay.test.ts` 以三個指定名稱的 `-t` pattern 執行，3 passed、23 skipped。選取案例為滿背包拒領保留狀態、領獎 toast、以及 guardian drops／q08／chapterComplete。
- 依 W01 範圍未執行 typecheck、browser、build 或全套 integration／tests；由 W02/W03 接續其各自規定的驗證。
