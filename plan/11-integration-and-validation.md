# 主 Agent 整合及最少必要驗收

## 1. 接線順序與唯一狀態

app持有SaveData、MovementState、CombatState、MonsterState[]、drops、buffs、potionCooldown、screen及session generation token。所有domain回傳新狀態，只有app提交。UI／renderer／audio接收snapshot或事件，不直接寫進度。

接線順序：T00骨架 → T01規則＋T05世界 → T02玩家移動＋T07灰盒畫面 → T03命中＋T06敵人 → T04交易／成長 → T05任務 → T08正式UI → T09存檔 → T10–T13正式視聽 → T15平台adapter及打包。這是T14接入次序，不強制子代理依序等待。

每個tick按07順序。玩家HP唯一存在SaveData.player，怪物HP唯一存在MonsterState；CombatActor只是一刻的view，不能產生第三份持久HP。DerivedStats包含當下有效guard補正，buff到期下一tick重算。

## 2. 必須完整接通的交易

1. 施放：檢查screen／job／rank／MP／狀態→tryAttack準備→T04 spendMp準備→都成功才一起提交；任何失敗均不扣MP／不吃冷卻。buff同理，僅不建攻擊實例。
2. 擊殺：第一次alive→dead→產一次經驗及金錢／掉落→recordQuestEvent一次；金錢以地上coins掉落撿取，經驗死亡即得，不能兩處重複給coins。
3. 拾取：距離／到期／最近順序→T04 addItem或coins reward成功→刪drop→音效；滿背包保留drop。coins不受格數限制。
4. 領獎：T05 planClaim→複本移除consume→套reward exp／coins／items→補minLevel→必要轉職→全部成功才提交quests與player。轉職先補到10再changeJob；其他任務minLevel在一般獎勵後補，不重給SP。
5. 更裝：同一交易處理移除背包新裝／舊裝回袋／更新槽，重新derive；不得先刪舊裝再因滿格失敗。
6. 切圖：舊狀態保留，load成功才交換世界；清舊攻擊／敵人／掉落／telegraph，套安全出生點、reach事件及檢查點。失敗可回舊圖，不鎖輸入。
7. 死亡：停止玩家命令及攻擊，顯示復活；復活回安全地點滿HP/MP，保留道具／經驗／任務。首領arena重試建立全新敵人狀態，bossDefeated歷史flag不阻止再挑戰。

## 3. 讀檔與畫面流程

啟動並行載入必要資產與Persistence.initialize；title可顯示，不必等SDK才能顯示遊戲。local／guest可直接讀本機；authenticated cloud先完成讀取才允許「繼續／建立帳號角色」。loadError提供重試及臨時遊玩；臨時資料不會覆寫雲端，也不覆寫原訪客本機檔。

preview以SDK診斷暫存，存檔結果顯示「預覽未正式保存」，不能顯示saved。cloud失效後遊戲仍可操作，停止帳號寫入並標示未保存；不自動轉存共用local key。

回標題先送必要檢查點但不無限等待網路；如有未保存提示狀態。新建角色確認不能悄悄清舊角色，僅在對應可寫模式已載入成功時允許取代，使用新快照保存；沒有成功不顯示「已清除雲端」。

## 4. 驗證責任矩陣

| 所有者 | 最小檢查 | 執行時間 |
| --- | --- | --- |
| T00 | scripts實際存在、contracts、最小typecheck/build | G0一次 |
| T01 | 24物品、技能／怪物範圍、ID唯一 | 本包完成 |
| T02 | 落地、單向、斜坡、梯繩、下跳 | 核心修改後 |
| T03 | 命中去重、窗邊界、鎖面向、目標數 | 核心修改後 |
| T04 | 升多級、轉職SP、滿袋交易不丟物、能力不疊加 | 核心修改後 |
| T05 | 前置、ready依現存物、領獎計畫不重領、傳點引用 | 本包完成 |
| T06 | 死亡只報一次、首領phase2一次、重試無殘留 | 本包完成 |
| T09 | 載入失敗不寫、null初始化、相同快照ID、衝突停止、過期回應 | 本包完成 |
| T10–T13 | 自己manifest／檔案、格子整除／alpha、音訊可解碼 | 新資產完成，不新增鏡像程式測試 |
| 主Agent | 聚合typecheck、build、check:content | 每波有相關改動時一次 |
| T16 | 完整主線＋iframe＋正式SDK必要情境＋ZIP | 最終候選一次；修正只重查受影響項目 |

T00建立Vitest的輕量純邏輯測試；不引入重型端到端框架。子代理使用`npm run test -- tests/自己的檔案.test.ts`，確切指令以T00實際設定為準，不跑所有測試。UI文字／樣式不新增測試、不自行開瀏覽器。環境無關問題記限制後停止擴查。

## 5. 候選版實際情境

- 新角色走完八任務與首領，觀察大致45–60分；測試中跳級捷徑不算時長證據。若只跑核心短路線，明列主線時長未驗證。
- 一次死亡復活、一次首領重試、一次關閉重開，確認進度與設定恢復。
- 真實跨來源iframe，sandbox/allow按05；子目錄資源、音效手勢、console、尺寸變更、一般／原生全螢幕／拒絕後沉浸模式、Esc與退出保留進度。
- 兩個獨立登入瀏覽器恢復同帳號角色、另一帳號隔離、衝突、讀取失敗、保存回應遺失同ID重試、登出／過期，以及管理預覽不寫正式資料。若沒有平台連線，標未驗證，fake只證明本地邏輯。
- 本版format1沒有遷移，無需搭建格式2全套；未來真的改格式才做遷移／回退必要情境。不宣告mobile，不跑iOS／手把矩陣。
- 官方pack/validate完整驗證；額外查機密與無關檔案。無工具不能以手動zip冒充通過。

## 6. 交付與停止點

目標交付dist、artifacts/game.zip、實際版本／工具雜湊、啟動及操作說明、各包report、已檢查／未驗證列表。完整主線缺失屬未完成，不能用打包成功替代。沒有發布明確授權就交候選，Release及平台上架狀態為尚未執行。
