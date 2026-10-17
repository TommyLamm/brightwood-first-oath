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
- [x] T14-15 傳點按08gate檢查，loadMap先完成再交換state，清舊怪／攻擊／drops／buff? buff切圖保留剩餘game time，玩家死亡才清；成功套spawn、visited、reach與checkpoint。
- [x] T14-16 returnTown無費、野外 playing 可由 snapshot 啟用；arena boss 未結束時 snapshot 禁用並顯示原因、app lifecycle 保留 domain 鎖；死亡時立即清玩家自有攻擊／cooldown，敵方攻擊保留至成功respawn；成功地圖轉換重置combat與drops，respawn回安全地點滿HP/MP、無懲罰並清buff。retryBoss回arena/entry並重建boss，舊telegraph全部清。死亡清理與其 focused integration test 已隨 `0532f9f` 提交；該次改動後沒有實際執行功能驗證，不能視為已測通過。
- [x] T14-17 boss死亡顯戰鬥結算／再挑戰／回城，q08交keeper後顯章節結算；可繼續探索，不誤把bossDefeated當全任務完成。
- [x] T14-18 休息恢復按08：三秒未攻擊未受傷才每兩秒regen，pause不前進；復活／切圖重置待恢復計時，無rank不恢復。

## T14-c 儲存、正式畫面與主線

- [x] T14-19 T09 initialize與必要資產載入並行；有現存角色可continue，newGame先確認；cloud載入失敗只能retry或臨時遊玩，不能傳初始資料覆寫。
- [x] T14-20 levelup/equip/buy/quest/map/checkpoint事件排存檔，settings也保存；runtimebuff／敵人／掉落不存，arena續玩改mine-gate/right。
- [x] T14-21 useCloudVersion先invalidate後initialize並用回來data取代目前world，重建安全場景；playTemporary獨立memory不覆蓋local或cloud。舊async透過token丟棄。
- [ ] T14-22 裝正式T10/T11/T12素材與T13音訊；首次手勢unlock，事件id音畫只播一次；沒有素材不能把灰盒標候選完成。**部分完成／仍阻塞候選：** T10 尚無完整 `public/assets/actors/manifest.json`；T11 目前18/20，缺 `env:tile-platform`、`env:tile-slope`；T12有46張圖片／4個VFX動畫，但缺 `vfx:heavy-strike`。app wiring 現已使用T13既有 `AudioFactory`／`AudioController` 與16項manifest（3 music、13 SFX），由UI及可信任鍵盤／畫布手勢解鎖，地圖 `musicKey` 選曲，設定音量、暫停／失焦／settings、SFX事件ID去重及dispose均已接線；新增focused app audio integration test。尚未以瀏覽器驗證真實音訊解碼／播放；缺少的T10/T11/T12素材仍阻止完整啟動與候選驗收，因此此項不勾選。
- [x] T14-23 完成UI每個命令的真實處理與錯誤toast，stats／quests／inventory／saveStatus由snapshot更新，無按鈕只跳console。
- [ ] T14-24 做一條跨模組focused檢查：MP失敗不吃冷卻、滿袋claim不扣任務物、死亡只發一次、loadError不checkpoint。可寫小型integration test，不鏡像全部單元測試。此前focused runs曾通過，但 `0532f9f` 的死亡清理及新增測試未在提交後執行；現有 `app-gameplay` 記錄為10 passed／1 failed，`rest-recovery` 預期72 HP、實得70 HP，原因未查明，不稱為既有問題。需針對目前程式補做確認。
- [ ] T14-25 一次完整路線試玩／節奏記錄，若有阻塞先修；時長偏離僅集中調08/T01經驗／目標量，通知相關包。不為補滿45分加入無聊等待。**未執行；依賴T14-22完整素材／音訊接線，尚無可接受候選。**
- [x] T14-26 report列實際入口、完整／未完成系統、接線例與真實檢查，交T15封面／成品，交T16最終驗收。

截至2026-10-18：開始／繼續／覆蓋確認、存檔重試與雲端衝突重載、暫時遊玩、UI命令及地圖checkpoint的程式改動已提交；這不等於最新改動均已測試。T14-22受不完整素材包與未接線音訊阻塞；T14-24的死亡清理改動提交後未做功能驗證；T14-25完整路線試玩未執行。T15的實際遊戲截圖與封面不存在，pack曾因缺少cover.png失敗，沒有ZIP，validate未執行。沒有通過的可玩候選，詳見 `plan/reports/T14.md`。

2026-10-18 follow-up：T14-20 的新角色音量預設已對齊 10 規格（master/music/sfx = 0.8/0.35/0.65），恢復既有角色仍保留存檔中的 settings。地圖視覺載入失敗後會記錄 map ID 並抑制每幀自動重試；顯式 world revision 重載可重試該地圖，資源更新需重建 scene/page 才會重新載入。此補正不解除 T14-22 資產缺包或 T14-25 未試玩的狀態。

2026-10-18 status sync：最新T11狀態為18/20（只缺platform、slope；較舊T14摘要所寫17張／缺三項已過時）；T12為46張image、4個VFX animation，缺heavy-strike；T10最新提交 `8524017` 仍記錄沒有完整actors manifest。T13的16個音訊檔及controller可供review，沒有T14 app接線或瀏覽器播放證據。死亡清理程式／測試提交 `0532f9f`；`f38c63c`記錄其後無功能驗證。既有 rest-recovery 的72對70差異原因未確認，不推定為舊問題或本次改動造成。

2026-10-18 audio wiring follow-up：`src/app/app.ts`／`src/app/keyboard.ts`／`src/main.ts` 已接現有T13 controller；`tests/integration/app-audio.test.ts` 以合成有效manifest驗證 app lifecycle，不代表缺少的正式素材包已補齊，也不代表瀏覽器實際播放已通過。focused audio test 1/1 passed，限定入口 strict tsc passed；保留上述72 HP預期／70 HP實得的未解失敗，未重跑它。
