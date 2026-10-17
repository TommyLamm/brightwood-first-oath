# T01：規則、物品、技能與敵人靜態資料

目的：把08數值轉為單一可消費資料，不實作玩法迴圈。所有權：src/content/rules/**、tests/rules.test.ts、自己的report。依賴G0；不改contracts、world內容、經濟或combat。

輸入：[07](../07-shared-contracts.md)、[08](../08-content-spec.md)。公開`rulesCatalog:RulesCatalog`與`validateRules(catalog:RulesCatalog):Result<RulesCatalog>`，從rules/index.ts匯出；不建立與world搶寫的總content/index。

## 步驟

- [x] T01-01 建items.ts，逐行建立24物品固定ID與中文名，補0數值及null visual，不將buy0解讀免費。
- [x] T01-02 填stackLimit、裝備槽／需求、價格、效果、iconKey、visualKey；三套衣服映射與10一致。
- [x] T01-03 建skills.ts，含basic、五可學技能與三敵人招式；分開playerLearnableIds，敵招不出現在技能UI。
- [x] T01-04 對attack填前搖／有效／後搖／冷卻／射程／目標；對passive/buff填具體效果，無效欄位為0，不猜另一套倍率。
- [x] T01-05 建monsters.ts，六普通加guardian；填碰撞體、AI參數、經驗金錢、條件掉落。任務掉落不放無條件drops，另明確questDropByQuest映射供app使用。
- [x] T01-06 建progression.ts，計算L1..29需求，0/30固定0，maxLevel30；movement首輪參數speed140、climb90、gravity1600、jumpVelocity−520、terminalVelocity900、width24,height44。
- [x] T01-07 建RulesCatalog及驗證：ID唯一、有限非負數、chance0..1、min≤max、技能時間合理、物品引用存在、裝備stack1、exact數量。
- [x] T01-08 補核心資料檢查測試：物品24、敵人7、basic+五玩家技能+三敵技、exp及技能門檻、drops不存在ID會報錯。只跑rules.test.ts。
- [x] T01-09 report給T03/T04/T06/T09具體匯入範例及資料缺項；不自行做全局build。

## 邊界與完成

掉落機率在app死亡處用注入rng執行，T01只給表。HP與能力公式在T04，傷害在T03，不把函式重複寫到資料層。無需抓取／拆原作客戶端。08是近似設計，精確來源不足不能假稱原版公式。

完成是完整可讀rules、真正驗證及局部測試；交空陣列、全部同一圖示、用後續資料覆蓋缺項不算完成。
