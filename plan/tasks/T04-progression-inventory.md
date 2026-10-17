# T04：成長、能力、背包與原子經濟

目的：所有玩家數值及物品修改走同一純邏輯入口。所有權src/domain/progression/**、tests/progression.test.ts。依賴G0；正式數據T01。公開createPlayer、deriveStats、countItem、applyProgressAction，嚴格使用07型別與08公式。

狀態：REVIEW（domain 與局部測試完成；待主 Agent 整合確認）

## 步驟

- [x] T04-01 createPlayer按08建L1角色、已裝備初始劍／布衣、藥水及金錢；以validatePlayerName回報名稱錯誤，避免HTML字串。
- [x] T04-02 實作deriveStats，基礎能力＋等級＋技能＋裝備每次重算；不讀buff真實時鐘，app把有效guard加到當下combat/view stats。
- [x] T04-03 gainReward處理多級升級、經驗扣除、AP/SP與L30上限；升級回滿，修正裝備／被動只clamp不回血。
- [x] T04-04 setLevelFloor依08補級、發應有點數並清exp；changeJob只能beginner且L≥10，給一次SP。q02由app先補級再轉職，不能補初心者階段SP。
- [x] T04-05 AP僅STR/DEX，amount正整數且≤ap；learnSkill驗job／等級／SP／maxRank，成功才扣點。
- [x] T04-06 實作countItem與加／減多個物品，優先堆疊再加格，32格，數量／ID嚴格檢查；remove不足不能部分扣除。
- [x] T04-07 buy驗可售種類／價格／quantity／coins／最終格數，成功才扣款加物；sell驗索引／數量／可賣種類，任務物禁止。
- [x] T04-08 equip以bagIndex取裝備並驗level，clone後移出新裝再把舊裝放回；full bag交換可成功，原子提交。unequip無空格回BAG_FULL不失裝。
- [x] T04-09 useItem回hp/mp clamp、有效才扣一個；滿值無效拒絕。共享1000ms藥水冷卻由app管，本包不另建真時鐘。
- [x] T04-10 spendMp／damage／restore嚴格有限非負值，MP不足拒絕，傷害不讓HP負數；死亡不自動改地圖。
- [x] T04-11 gainReward同時驗coins／items／exp，任何失敗整筆原輸入不變；不允許領獎先升級但物品沒入袋。
- [x] T04-12 核心測試：多級／30上限、q02不重給SP、裝備穿脫不累加、滿袋交易原子、任務物禁售、無效藥不消耗；只跑progression.test.ts，7項測試通過。
- [x] T04-13 report提供reward交易與equip的實際呼叫，列出無法放入背包時的Result，交UI顯示。

完成條件：所有ProgressAction都有真實分支，無未實作成功回傳；失敗深度不改輸入。沒有商店DOM、存檔、掉落生成或戰鬥時鐘，這些由其他包接入。
