# T14：主 Agent 唯一組裝者與完整玩法

目的：把子代理成果接成真正遊戲，不以各模組能編譯代替可玩。所有權src/app/**、src/main.ts正式接線、tests/integration/**；主Agent執行，不同時派另一代理改相同路徑。輸入07/08/11及各report。

依賴分段：a在G0後即可，b逐模組交付接入，c需T01–T13及T15-a正式CloudPort可用。T15-b封面／打包在本包完成後，無循環依賴。「可開始」不代表全部功能完成。新SaveData預設quests={}、visitedMaps=['camp']、location=camp/start、兩flag=false，Settings按10音量與01鍵位；player由T04建立。

## T14-a 接線架

- [x] T14-01 main建立單一Phaser.Game與root UI，Boot/World Scene生命週期集中，不由renderer再new Game。
- [x] T14-02 組rulesCatalog/worldCatalog與四包asset manifests；明確缺包時顯開發未完成，候選不能以空manifest吞掉錯誤。
- [x] T14-03 建app唯一state、seq命令佇列、GameTime、EntityId及RNG；dt1/60、最多補五步，pause/blur清輸入及累積。
- [x] T14-04 鍵盤按01映射，KeyboardEvent.code可重綁；文字／UI焦點不攻擊。Ctrl/Alt只在遊戲聚焦防預設，離焦釋放所有held。
- [x] T14-05 管理panel stack與screen，Esc先關頂層再pause，settings／pause凍結世界；背包任務不凍結。setPanel/closePanel命令由app處理，UI不另寫主時間。

## T14-b 核心接合

- [x] T14-06 用T02玩家／T06怪物更新，T07每frame畫snapshot，鏡頭不反向改world位置。
- [x] T14-07 按07唯一tick順序接T03命中，CombatActor從當下玩家／怪物資料建立，含碰撞尺寸、rank與免擊退flag；來源死亡清未完成攻擊。
- [x] T14-08 玩家施放原子預檢job/rank/MP、tryAttack與spendMp，兩者成功才commit；guard套30秒runtime buff，不存檔。攻擊狀態到期前鎖面向／25%水平速，跳躍物理繼續。
- [x] T14-09 所有玩家受傷共享800ms無敵，接觸及技能共用，不讓雙重結算繞過；擊退保留180ms，交T02物理，首領不擊退。
- [x] T14-10 T06唯一deaths事件給exp一次、spawn coins及drops一次、recordQuestEvent一次；任務物只對active對應任務掉，guardian-sword首領必掉，不額外再直發coins。
- [x] T14-11 pickup選90px內最近、距離同分按id，150ms節流；T04成功才刪drop，滿格不吞；120秒到期清除，離圖掉落不存。
- [x] T14-12 所有AP／SP／消耗／買賣／裝備命令走T04，商店命令需當下merchant互動有效；物品索引來自最新state重新驗證。
- [x] T14-13 NPC近64px按Space互動，mentor/guide/keeper開任務對話，merchant開shop，healer直接免費restore滿並顯對話；portal與NPC同時近時優先NPC，否則portal。
- [x] T14-14 接T05 accept／planClaim，clone上移除consume、給reward、補級及轉職，成功才commit nextQuests；q02先補10再轉職，只有一次SP，q08提交chapterComplete。
- [ ] T14-15 傳點按08gate檢查，loadMap先完成再交換state，清舊怪／攻擊／drops／buff? buff切圖保留剩餘game time，玩家死亡才清；成功套spawn、visited、reach與checkpoint。
- [x] T14-16 returnTown無費、arena交戰鎖；死亡screen提供respawn，回安全地點滿HP/MP、無懲罰，清攻擊／buff。retryBoss回arena/entry並重建boss，舊telegraph全部清。
- [x] T14-17 boss死亡顯戰鬥結算／再挑戰／回城，q08交keeper後顯章節結算；可繼續探索，不誤把bossDefeated當全任務完成。
- [x] T14-18 休息恢復按08：三秒未攻擊未受傷才每兩秒regen，pause不前進；復活／切圖重置待恢復計時，無rank不恢復。

## T14-c 儲存、正式畫面與主線

- [ ] T14-19 T09 initialize與必要資產載入並行；有現存角色可continue，newGame先確認；cloud載入失敗只能retry或臨時遊玩，不能傳初始資料覆寫。
- [ ] T14-20 levelup/equip/buy/quest/map/checkpoint事件排存檔，settings也保存；runtimebuff／敵人／掉落不存，arena續玩改mine-gate/right。
- [ ] T14-21 useCloudVersion先invalidate後initialize並用回來data取代目前world，重建安全場景；playTemporary獨立memory不覆蓋local或cloud。舊async透過token丟棄。
- [ ] T14-22 裝正式T10/T11/T12素材與T13音訊；首次手勢unlock，事件id音畫只播一次；沒有素材不能把灰盒標候選完成。
- [ ] T14-23 完成UI每個命令的真實處理與錯誤toast，stats／quests／inventory／saveStatus由snapshot更新，無按鈕只跳console。
- [x] T14-24 做一條跨模組focused檢查：MP失敗不吃冷卻、滿袋claim不扣任務物、死亡只發一次、loadError不checkpoint。可寫小型integration test，不鏡像全部單元測試。
- [ ] T14-25 一次完整路線試玩／節奏記錄，若有阻塞先修；時長偏離僅集中調08/T01經驗／目標量，通知相關包。不為補滿45分加入無聊等待。
- [ ] T14-26 report列實際入口、完整／未完成系統、接線例與真實檢查，交T15封面／成品，交T16最終驗收。

完成：45–60分目標的完整劍士主線、開始結束／繼續重試、死亡恢復、正式視聽與存檔接合。只有程式啟動或一張打怪圖不算完成；外部平台未驗證須獨立列出。
