# Plan22 規劃證據

2026-10-28（Asia/Hong_Kong）。[Plan21來源、beta28及交接已完成](plan21-handoff.md)，其八份文件65個本地連結／7錨點可解析後，依使用者持續規劃並實作指令建立 [Plan22](../22-quest-claim-feedback.md)。本批以領獎前拒絕原因為單一目標，不新增玩法內容。

主代理本新批次重新完整網讀Playroom範本與指定七份main規格，development／template／command尾段有補讀，無失敗。適用固定ID、作者TommyLamm、相對資源、desktop iframe、讀1–5寫5的存檔相容、固定SDK／工具及新版本候選；無發布授權。根無.codegraph，使用目標式讀檔；HEAD a20f4ac及既有dirty不改。

## 直接證據

| 檔案／符號 | 靜態觀察及範圍 |
| --- | --- |
| [UI](../../src/ui/index.ts) buildDialoguePanel，ready卡片（2850附近，依符號定位） | 任務ready便建立領獎鈕，沒有背包／金幣拒絕原因；保留questId與dialogue-claim focus標記。claim-quest點擊僅派原命令。 |
| 同檔renderPanel signature（1361附近） | 含完整saveData、questViews及interaction，已涵蓋本次預覽依據，不需要擴大signature重構。 |
| [app gameplay](../../src/app/gameplay.ts) claimQuest 651–696附近 | 先quest／nearNpc gate，再planQuestClaim、removeItems、minLevel、job、gainReward；全成功才合併player及nextQuests。q08旗標／chapter、levelup effect、toast與interaction在app。 |
| [quests](../../src/domain/quests/index.ts) planQuestClaim 148–173附近 | 驗任務active與ready、交付物總量，clone nextQuests後設claimed，回removeItems與clone reward；尚不驗獎勵是否可放入背包。 |
| [progression](../../src/domain/progression/index.ts) applyProgressAction、gainReward | 每次action先驗player並clone，reward再驗coins及addStacks；前一階段騰位能影響最終容量。UI單用bag.length無法判斷。 |
| [既有app測試](../../tests/integration/app-gameplay.test.ts) 三個領獎案例 | 已有滿包保留物品／quest、成功reward toast，以及q08可claim且chapterComplete的測試；改共用接線時精選這三例，不跑整個大檔。 |
| [QuestClaimPlan](../../src/contracts/definitions.ts) 231附近 | 有nextQuests、removeItems、reward，可重用既有型別，不增SaveData／Manifest欄位。 |

現有app在全計算成功前不提交player／quests，因此本批沒有已證實的扣物品／獎勵遺失bug；選擇改善前置回饋。把既有鏈提取到純helper，再由app及UI共用，能避免UI重寫minLevel／job／reward順序；NPC距離及其他app副作用不移入helper。預覽不含距離／死亡／queue時狀態，也不能代替保存成功。

## 派工與檢查

新 `src/domain/quests/claim.ts` 與 `tests/quest-claim.test.ts` 在規劃時不存在。W01獨占新helper／新focused與app claim分支，W02待API確認才獨占UI，W03最後建新候選；全新Luna Max依序處理，不模糊派工。browser僅條件成立的一名Terra Max，沒有新條件則保持未驗。

本文件為規劃證據，不代表本批測試通過。規劃時只讀取相關原始碼、既有三例名稱及路徑碰撞；沒有執行遊戲tests、tsc、build／pack、browser或升版。後續結果寫入本Plan實作交接，不改此歷史證據。
