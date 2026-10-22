# 首版內容與數值 v1

此頁是 T01／T05 的唯一內容來源，所有數值為本專案初始設計，並非宣稱原版公式。T14 如實測節奏不在 45–60 分鐘，由主 Agent 集中調整此頁及 T01 資料，子代理不各自改倍率。

## 1. 地圖與固定幾何

世界高度一律 720，主地面 y=600，基準視口 960×540。除 boss 外，每圖地面是一條 x=0…width、y=600 的不可下跳 foothold，避免任務平台成為唯一可走路線。上方平台可下跳。牆只在地圖左右邊界阻擋；無死亡深坑。出生／NPC 的 y 是腳底，不是圖片左上。

| mapId／中文名 | width | 平台線段 (x1,y1)→(x2,y2) | 梯繩 x/top/bottom | 怪物出生／活動範圍 |
| --- | --- | --- | --- | --- |
| camp 晨光營地 | 1440 | (400,500)→(700,500) | 550/500/600 | snail@1000/1125/1250；活動範圍950–1050、1075–1175、1200–1300 |
| town 木葉鎮 | 1920 | (500,500)→(800,500)；(1250,500)→(1550,500) | 650/500/600 | 無怪，safe |
| forest-edge 嫩芽林道 | 1920 | (400,490)→(800,490)；(950,460)→(1300,460)；(1400,420)→(1700,420) | 600/490/600；1500/420/600 | snail@500,900；slime@1300,1650；每點±180 |
| mushroom-wood 菌傘深林 | 2160 | (300,480)→(700,480)；(950,390)→(1300,390)；(1450,450)→(1900,450) | 500/480/600；1100/390/600 | mushroom@450,850,1250；slime@1700；每點±180 |
| red-ridge 赤岩山徑 | 2160 | (300,480)→(650,480)；(800,440)→(1200,440)；(1500,500)→(1900,500) | 950/440/600；1700/500/600 | boar@450,850,1300；golem@1750；每點±160 |
| mine-gate 古礦入口 | 1920 | (350,470)→(700,470)；(1000,420)→(1400,420) | 500/470/600；1200/420/600 | golem@450,850；sentinel@1250,1600；每點±150 |
| guardian-arena 守衛祭壇 | 1440 | (250,460)→(480,460)；(960,460)→(1190,460) | 360/460/600；1080/460/600 | guardian@1000；活動600–1250；boss |

foothold ID 固定 `{mapId}:ground`、`{mapId}:platform-1..n`，梯繩 `{mapId}:ladder-1..n`。各圖主地面連通，上方平台可由跳躍或梯到達。測試地圖 `movement-lab` 僅開發用，不計入正式七圖或正式地圖選單。

### 出生點與傳點

每圖定義 left=(100,600)、right=(width−100,600)。town 另 center=(960,600)；camp 另 start=(150,600)；arena 另 entry=(160,600)。所有傳點在 y600，互動範圍64，站定按 Space 觸發，切圖後500ms 防連觸發。

| 來源傳點 | 位置 x | 目標／出生 | 條件 |
| --- | --- | --- | --- |
| camp:east | 1340 | town/left | q01 已 claimed |
| town:west | 100 | camp/right | 無 |
| town:east | 1820 | forest-edge/left | q02 已 claimed |
| forest-edge:west | 100 | town/right | 無 |
| forest-edge:east | 1820 | mushroom-wood/left | q03 已 claimed |
| mushroom-wood:west | 100 | forest-edge/right | 無 |
| mushroom-wood:east | 2060 | red-ridge/left | q04 已 claimed |
| red-ridge:west | 100 | mushroom-wood/right | 無 |
| red-ridge:east | 2060 | mine-gate/left | q06 已 claimed |
| mine-gate:west | 100 | red-ridge/right | 無 |
| mine-gate:east | 1820 | guardian-arena/entry | q07 已 claimed |
| guardian-arena:exit | 100 | mine-gate/right | 無 |

returnTown 在非戰鬥鎖定／非切圖時可用：停止攻擊後傳 town/center，無費用。arena 只在首領未交戰、玩家死亡或首領擊敗後可回城；交戰中提示需先脫離或挑戰結束。死亡一律 town/center，尚未到 town 時 camp/start。

## 2. NPC 與對話

| ID／名字 | 位置 | role／功能 |
| --- | --- | --- |
| guide 森芽 | camp x250 | scout，q01 接交、教學 |
| mentor 岩嶺教官 | town x700 | mentor，q02／q03／q04 接交、一轉 |
| merchant 木葉商人 | town x1000 | merchant，24物品中只售武器／防具／帽／藥水 |
| healer 晨露 | town x1300 | healer，免費回滿 HP/MP、簡短補給說明 |
| keeper 礦道守望者 | red-ridge x250 | keeper，q05–q08 接交、首領劇情 |

NPC x±64 可互動，面向最近 NPC；距離同分按 id 字典序。接任務顯示 acceptText／目標／獎勵，未完成顯示 progressText，完成顯示 completeText 及領獎。每段對話30–100字、繁體中文、2–4句，圍繞森林失衡與古礦守衛；T05 撰寫具體文字，不增加新角色／支線。

## 3. 玩家、成長、經濟

新角色 L1、exp0、STR12、DEX4、AP0、SP0、coins120，starter-sword 裝備於武器槽，cloth-shirt 裝備衣服槽，帽=null；背包 small-red×10、small-blue×5。裝備中的道具不佔背包格。升級每級給5AP，一轉後每級給1SP；轉職當下給1SP，之前等級不補發SP。滿30停止累積經驗，剩餘 exp=0。

升 L→L+1 的 expToNext[L] = 40 + 12L + 3L²，L=1..29；index0固定0、index30固定0。每次多級升級循環扣需求；任務 minLevel 若較高，補到該級並依每級規則發點數，將 exp 清0；不得減級。轉職 q02 原子先補到10、再改職業並給1SP，之後每級才給SP。

maxHp=80+20×(L−1)+12×vitalityRank+裝備hpBonus；maxMp=40+2×(L−1)。attack=2×STR+DEX−1+武器attack（初始 DEX4 時等同舊式 3+2×STR）；defense=floor(DEX/4)+全部裝備defense，增益期間再加 guardRank×3；critChance=min(40%,DEX×0.4%)。STR 每點 +2 攻擊為主屬性；DEX 每點 +1 攻擊並提供防禦與暴擊，全 DEX 期望傷害約為全 STR 的 6～7 成，換取明顯較高的防禦。升級／轉職回滿；增減裝備／技能不免費回滿，僅 clamp hp/mp 到新上限。基本能力不含裝備加成，deriveStats 每次重算，不遞增疊加。

命中皆成功，無命中迴避擲骰；單段傷害=max(1,floor((attack×技能倍率×暴擊−目標defense×0.5)×(0.95+0.10×rng)))，暴擊時×1.5、否則×1。先擲 variance，critChance>0 的攻擊者再擲一次暴擊；敵人 critChance=0、不擲骰。普攻倍率1；敵人使用同式。只在真正命中時扣血。普通敵人受擊水平速度±120、垂直−80；首領不擊退；玩家受擊水平±140、垂直−120。擊退方向遠離攻擊來源，重疊時用來源 facing。

背包32格，裝備stack1、消耗99、材料999、任務99，金錢0..9,999,999。物品先補既有堆疊再開新格，不留0數量格。商店數量1..99，售價按表；任務物品禁止出售／丟棄。裝備背包不足時交換仍可原子成功，卸下無空間則失敗。藥水共享1000ms冷卻（app runtime），滿血／滿魔且藥水無其他效果時拒絕不扣物。

## 4. 24 種物品（ID不可另造別名）

| ID／中文名 | kind／最低級 | 能力／效果 | 買／賣 |
| --- | --- | --- | --- |
| starter-sword 練習短劍 | weapon/1 | attack4 | 40/10 |
| iron-sword 鐵製長劍 | weapon/10 | attack12 | 300/75 |
| steel-sword 精鋼長劍 | weapon/20 | attack24 | 900/225 |
| guardian-sword 守衛之刃 | weapon/28 | attack38 | 1800/450 |
| cloth-shirt 旅行布衣 | body/1 | defense2 | 40/10 |
| leather-vest 輕革甲 | body/10 | defense7 hpBonus20 | 250/60 |
| iron-mail 鐵環甲 | body/20 | defense14 hpBonus40 | 700/175 |
| cloth-cap 布帽 | hat/1 | defense1 | 30/7 |
| leather-cap 皮帽 | hat/10 | defense4 | 180/45 |
| iron-helm 鐵盔 | hat/20 | defense8 | 500/125 |
| small-red 小紅藥水 | consumable/1 | restoreHp80 | 20/5 |
| large-red 大紅藥水 | consumable/1 | restoreHp200 | 45/11 |
| small-blue 小藍藥水 | consumable/1 | restoreMp40 | 25/6 |
| large-blue 大藍藥水 | consumable/1 | restoreMp100 | 55/13 |
| snail-shell 蝸殼 | material/1 | 無 | 0/3 |
| slime-gel 黏液 | material/1 | 無 | 0/5 |
| mushroom-cap 菌蓋 | material/1 | 無 | 0/8 |
| boar-tusk 野豬牙 | material/1 | 無 | 0/12 |
| stone-chip 石片 | material/1 | 無 | 0/18 |
| metal-shard 金屬片 | material/1 | 無 | 0/25 |
| forest-seed 林心種子 | quest/1 | q03 | 0/0 |
| spore-sample 孢子樣本 | quest/1 | q04 | 0/0 |
| ridge-emblem 山徑印記 | quest/1 | q06 | 0/0 |
| guardian-core 守衛核心 | quest/1 | q08 | 0/0 |

非裝備效果欄位預設0；材料／任務 buyPrice=0代表不可買，不能讓 UI 顯示免費取得。所有24物品都要 iconKey=`item:{id}`；visualKey 只有裝備為 `equip:{id}`。

## 5. 技能表

玩家可學五技能皆 requiredJob=swordsman、maxRank10，每次學習耗1SP、升一rank；無前置鏈。basic 不可學、不耗SP，初心者可用。

| ID／名稱 | 類型／解鎖 | MP／冷卻 | 前搖/有效/後搖 ms | 射程×高／目標 | 效果 |
| --- | --- | --- | --- | --- | --- |
| basic 普通攻擊 | attack/1 | 0/550 | 180/80/290 | 65×60／1 | 倍率1 |
| heavy-strike 重斬 | attack/10 | 6/650 | 220/80/350 | 85×70／1 | 1.30+0.08×rank |
| sweep 橫掃 | attack/12 | 10/850 | 260/100/490 | 110×80／3 | 0.80+0.06×rank |
| iron-guard 堅韌守護 | buff/14 | 12/1000 | 200/0/200 | 自身 | 30秒 defense+3×rank，不疊加，只刷新 |
| vitality 生命鍛鍊 | passive/10 | 0/0 | 0/0/0 | 自身 | maxHp+12×rank |
| rest-recovery 休息恢復 | passive/10 | 0/0 | 0/0/0 | 自身 | 無攻擊／受傷3秒後，每2秒恢復2×rank HP |

攻擊判定範圍：面向右時 x=origin.x…x+reach、左則 x−reach…x；y=origin.y−height…origin.y。有效窗內首次碰到才命中，最多targets，按距離再entityId選。buff 施放同樣遵循 MP／狀態原子檢查，T14 管理時間，T04 派生能力讀取有效增益時傳入 stats 補正，不把 buff 存檔。

預設快捷1=heavy-strike、2=sweep、3=iron-guard；未學提示，不自動學習。UI 提醒可用AP/SP，不替玩家配點。提供「建議 STR 優先」文字即可。

## 6. 敵人表與掉落

所有普通敵人接觸與近戰共用800ms玩家受傷保護，活怪每出生點最多1隻，死亡後8000ms重生。巡邏速度表內，追擊×1.3；aggroRange300，attackRange55，前搖350ms、冷卻1400ms。碰撞體寬高分別 snail28×24、slime32×32、mushroom32×42、boar48×36、golem50×62、sentinel40×58，腳底語意相同。

| ID／名字 | L／HP | attack／defense | exp／coins | speed | 100%材料／條件任務物 |
| --- | --- | --- | --- | --- | --- |
| snail 苔殼蝸牛 | 1/50 | 6/0 | 20/5 | 32 | snail-shell；無 |
| slime 嫩芽史萊姆 | 8/120 | 12/2 | 40/10 | 55 | slime-gel；q03 active→forest-seed |
| mushroom 菌傘菇 | 12/260 | 20/5 | 75/16 | 60 | mushroom-cap；q04 active→spore-sample |
| boar 赤背野豬 | 16/520 | 30/9 | 130/24 | 85 | boar-tusk；q06 active→ridge-emblem |
| golem 礦岩魔像 | 21/1000 | 40/15 | 220/36 | 38 | stone-chip；無 |
| sentinel 鏽甲哨兵 | 25/1600 | 48/20 | 350/50 | 65 | metal-shard；無 |
| guardian 古礦守衛 | 30/6000 | 55/28 | 2000/500 | 42 | q08 active→guardian-core |

每次死亡各掉材料1、coin表值；普通敵人另20% small-red、10% small-blue。boar另3% steel-sword、sentinel另3% iron-mail；guardian必掉guardian-sword×1。各機率獨立，無任務就不掉任務物。掉落120秒消失，拾取半徑90；金錢入coins不佔格。死亡事件只發一次，不能每 tick 重發或刷任務事件。

敵招enemy-melee由T01建SkillDef：倍率1、單體、MP0、前搖350ms／有效80ms／後搖970ms、cooldown1400ms、reach55／height70。guardian-slam：前搖900／有效100／後搖800、reach180／height100、倍率1.4；guardian-wave：前搖1100／有效100／後搖900、reach420／height50、倍率1.1；兩首領招MP0、cooldown0，AI在上一招後搖結束後再等phase1=2500ms／phase2=1800ms才開始下一招，避免雙重冷卻。敵招maxRank1、requiredJob='enemy'，不列可學清單。首領HP≤50%轉phase2一次，交替slam/wave。預告矩形與命中同源，低波可跳避；origin/facing出招時固定。離場／死亡／重試清boss及攻擊，無跨圖重生計時。

## 7. 八主線任務（不可漏領／重領）

任務必須手動接取、手動領獎，前一任務claimed才可接下一個。只有 q02 需要達L3，其餘不額外設等級門檻；獎勵保證路線有足夠最低級。所有下列擊殺計數僅接取後累積，collect檢查現存物。

| ID／標題 | NPC接／交 | 目標／消耗 | Reward exp/coins/items/minLevel |
| --- | --- | --- | --- |
| q01 第一次出發 | guide/guide | kill snail3 | 60/80/small-red5/L3 |
| q02 劍士的選擇 | mentor/mentor | reach town1；minL3 | 250/200/iron-sword1/L10；job=swordsman |
| q03 林心的訊號 | mentor/mentor | collect forest-seed5，消耗5 | 600/250/leather-vest1/L13 |
| q04 菌林調查 | mentor/mentor | kill mushroom6＋collect spore-sample4，消耗4 | 1000/350/leather-cap1/L16 |
| q05 穿越赤岩 | keeper/keeper | kill boar8 | 1700/500/steel-sword1/L20 |
| q06 山徑封印 | keeper/keeper | collect ridge-emblem6＋equip steel-sword1，消耗印記6 | 2500/650/iron-mail1/L24 |
| q07 古礦的回聲 | keeper/keeper | kill golem6＋sentinel6 | 4000/900/iron-helm1＋large-red10＋large-blue10/L28 |
| q08 守衛的安息 | keeper/keeper | kill guardian1＋collect guardian-core1，消耗核心1 | 6000/1200/無/L30；flags章節完成 |

q05 的 keeper 在 red-ridge 入場近處；q04 claimed 才開 red-ridge。q06 claimed 開 mine-gate，q07 claimed 開arena。q08 須在進arena前接取；q07領獎後對話立即提供q08，不自動接但顯著提示。首領先擊敗但忘接q08可重試再完成，不永久鎖死。

領獎先在副本驗證consume及所有reward格數，全部成功才提交；無空間顯示清理背包提示，任務保持ready。q02重領不能重給轉職SP，章節flag只在q08成功領獎時設定。首領死亡先flags.bossDefeated=true並顯示戰鬥結果，q08領獎再顯示章節結算。

## 8. 節奏與資料檢查

目標時間分配：教學及轉職5–8分、兩張森林12–15分、山徑10–12分、礦道10–15分、首領與結算5–10分。一次代表路線實測後只集中調整擊殺／收集數與經驗，避免改動所有模組。

T01 檢查24 items／6可用玩家招式（含basic）＋3敵招／7 monsters（含boss）及所有數值；T05 檢查7正式maps／5NPC／8quests、所有引用與前置無循環、傳點出生存在、物品來源可達。T00／T14 聚合時再跑一次跨目錄檢查，不能因個別表通過就宣稱主線可玩。
