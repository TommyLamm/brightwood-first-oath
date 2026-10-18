# T05：七地圖、NPC、八任務與任務核心

目的：給出可達世界與可完成主線，不讓整合代理自己填內容。所有權src/content/world/**、src/domain/quests/**、tests/quests.test.ts。依賴G0，跨表檢查等T01；不依賴T04實作，領獎回計畫由app原子套用。

輸入07/08；公開worldCatalog、`validateWorld(world:WorldCatalog,rules:RulesCatalog):Result<WorldCatalog>`、getQuestView、acceptQuest、recordQuestEvent、planQuestClaim。所有ID、獎勵、生成及傳點按08，不自創另一個town名或任務路線。

## 步驟

- [x] T05-01 建maps各檔，七張width／height、ground／platform／ladder／spawn／portal逐項照表。壁只有邊界，不將裝飾變障礙。
- [x] T05-02 各怪出生點取穩定spawnId=`{mapId}:{monsterId}:{序號}`，y依地面600，roam不越地圖；camp至少配置足以完成q01的snail出生點。
- [x] T05-03 指定theme camp/town/forest/rock及music：camp/forest用theme-field、town用theme-town、arena用theme-boss、其餘field。UI地圖順序按08。
- [x] T05-04 建五NPC固定位置／角色／actorKey，撰對話；每段30–100繁中字、2–4句，逐任務accept/progress/complete文字明講目標及回報位置（q01 completeText 明列三隻苔殼蝸牛與晨光營地／森芽回報）。
- [x] T05-05 建q01..q08表，前置q(n−1)，q02 minL3，其餘minL1，consume／reward／minLevel／job依08；不要把NPC對話顯示當領獎。
- [x] T05-06 getQuestView計算locked/available/active/ready/claimed；kill讀active counters，collect讀現存物，equip讀當前槽，reach讀visitedMaps或active reach事件，所以先到town再接q02仍可完成。
- [x] T05-07 accept驗前置／等級／未接，建立active counters；claimed不能重新接，重複active回安全錯誤，不重置計數。
- [x] T05-08 recordQuestEvent只更新active任務，counter上限目標值，不讓同事件造成多次獎勵；擊殺是否去重由app唯一death事件保證，本包不依真時間去猜。
- [x] T05-09 planQuestClaim驗active ready，產nextQuests=claimed、removeItems及Reward；函式不直接給物品、coins或SP，不import T04，不提前改原data。
- [x] T05-10 validateWorld查7正式maps／5NPC／8quests、portal雙端及spawn存在、foot線x1<x2、梯上下、monster引用、quest item來源、前置無循環、對話及actorKey存在。
- [x] T05-11 局部測試：前置鎖、town先到後接、collect賣掉後不ready、equip條件、planClaim不改原資料、不重領、壞傳點報錯；只跑quests.test.ts。
- [x] T05-12 report給T07地圖載入、T08任務UI及T14原子領獎接線，列唯一文字／資料匯出。

完成：所有圖都有可達傳點與安全出生，八任務含完整文本及獎勵計畫。沒有只放空關卡、對話TODO或因滿袋吞獎勵。純資料驗證不等於主線實際驗收。
