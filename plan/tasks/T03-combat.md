# T03：攻擊有效窗、技能與傷害

目的：單一近戰判定核心，玩家與敵人共用。所有權：src/domain/combat/**、tests/combat.test.ts。依賴G0，rules由參數傳入。不能改玩家MP／怪物HP／背包／Phaser畫面。

公開tryAttack、stepCombat按07；傷害公式、距離及時序按08。CombatState保存attack實例及cooldown；無buff／passive的持久效果。

## 步驟

- [x] T03-01 建空CombatState helper，tryAttack查來源存在、hp>0、技能attack、冷卻、目前未在前後搖；失敗回Result不改state。
- [x] T03-02 成功建立固定origin／facing／startedAt的AttackInstance、空hitIds，設定該技能下次可用時間；ID從app nextId取得。
- [x] T03-03 按玩家／敵人faction選目標，facing決定x範圍、腳底決定y範圍，判碰撞體重疊；targets按距離再id穩定排序。
- [x] T03-04 stepCombat處理(now−dt,now]與有效窗相交，不能因一步跨窗而漏命中；每段每target只一次，hitIds在state更新。
- [x] T03-05 套08傷害公式，注入rng固定測試；首領knockback0，其他以來源方向；只產Hit，app套用。
- [x] T03-06 回傳started／rejected／hits供app產音畫，已結束攻擊回收；來源死亡／離圖由app清狀態，不保留幽靈攻擊。`tests/combat.test.ts` 覆蓋開始事件、死／缺失來源的 rejected 與攻擊移除、到期回收；T14-24 filtered integration 通過致死即清玩家攻擊及復活重置戰鬥。成功離圖清理由 `completeMapTransition` 以新 `CombatState` 重置，已核對程式；T14-24 沒有單獨驗收一般成功離圖。
- [x] T03-07 排除自己、同陣營及dead目標；普攻只一個、sweep最多三個；多次呼叫不重複扣血。
- [x] T03-08 將「預備攻擊」回傳狀態與原state分開，app可在MP失敗時放棄，不消耗冷卻。不要直接扣MP或檢查另一套PlayerProgress。
- [x] T03-09 核心測試：窗前／內／後、跨窗、固定面向、重複tick去重、群攻上限、冷卻拒絕輸入未變、固定rng結果。只跑combat.test.ts。
- [x] T03-10 report提供普攻／敵招呼叫與HP套用範例，說明沒有哪一部分由此包處理，讓主Agent只接一次。

## 完成條件

沒有空命中特效冒充傷害、沒有每frame扣血、沒有與UI／renderer重複戰鬥。buff施放／MP／接觸傷害800ms保護在app接線，T03只提供攻擊實例命中核心。
