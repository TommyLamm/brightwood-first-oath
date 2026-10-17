# 共用契約 v1：所有程式包必讀

本文件是程式介面的單一來源。T00 將下列定義落地為 `src/contracts/`，並補齊此處以欄位表描述的型別；只做型別及最小共用 helper，不替子代理寫功能。僅主 Agent 修改此目錄，變更後通知所有消費者。

## 1. 坐標、時間、ID、匯出

- 世界 px，X 向右、Y 向下；人物位置為腳底中心。碰撞 AABB 為 x±12、y−44…y，圖像不決定碰撞。
- dtSeconds 固定 1/60；gameTimeMs 為暫停不前進的整數時間。所有冷卻、buff、重生、動畫均使用此時鐘，不在 domain 內讀真實時間。
- Id 為字串，內容 ID 按 08 固定；EntityId 由 app 遞增產生，單次執行不重用。序列化僅存內容 ID，不存 runtime entity。
- 純 domain 不依賴 Phaser、DOM、儲存、SDK；接受唯讀輸入，回傳新值或結果，不在失敗時偷偷修改原物件。
- 每包公開介面只從自己的 index.ts 匯出。主 Agent 維護 contracts/index.ts，不建立所有 domain 共用 barrel，避免競寫。

```ts
type Id = string;
type EntityId = string;
type Facing = -1 | 1;
type Vec2 = { x: number; y: number };
type ErrorCode = 'INVALID' | 'LOCKED' | 'INSUFFICIENT_COINS' |
  'BAG_FULL' | 'NOT_FOUND' | 'REQUIREMENT' | 'COOLDOWN' |
  'NO_MP' | 'DEAD' | 'NOT_READY' | 'OUT_OF_RANGE';
type Result<T> = { ok: true; value: T } |
  { ok: false; code: ErrorCode; message: string };
type RandomSource = { next(): number }; // [0,1)，app 注入
type InputFrame = {
  moveX: -1 | 0 | 1; climbY: -1 | 0 | 1;
  jumpPressed: boolean; downHeld: boolean;
};
type MovementState = {
  position: Vec2; velocity: Vec2; facing: Facing;
  mode: 'grounded' | 'airborne' | 'climbing' | 'dead';
  footholdId: Id | null; ladderId: Id | null;
  dropThroughUntilMs: number; knockbackUntilMs: number;
};
type MovementConfig = {
  speed: number; climbSpeed: number; gravity: number;
  jumpVelocity: number; terminalVelocity: number;
  width: number; height: number;
};
type BagStack = { itemId: Id; quantity: number };
type Equipment = { weapon: Id | null; body: Id | null; hat: Id | null };
type PlayerProgress = {
  name: string; job: 'beginner' | 'swordsman';
  level: number; exp: number; str: number; dex: number;
  ap: number; sp: number; hp: number; mp: number; coins: number;
  skillRanks: Record<Id, number>; bag: BagStack[]; equipment: Equipment;
};
type QuestState = {
  status: 'active' | 'claimed'; counters: Record<Id, number>;
}; // 缺項代表尚未接取，不另存 available
type Settings = {
  masterVolume: number; musicVolume: number; sfxVolume: number;
  muted: boolean; bindings: Record<string, string>;
}; // 音量 0..1；binding 是 KeyboardEvent.code
type SaveData = {
  player: PlayerProgress; quests: Record<Id, QuestState>;
  visitedMaps: Id[]; location: { mapId: Id; spawnId: Id };
  flags: { bossDefeated: boolean; chapterComplete: boolean };
  settings: Settings;
}; // formatVersion、revision 是外層 envelope，不重複放 data
type SaveEnvelope = {
  formatVersion: 1; data: SaveData; savedAt: string;
}; // 本機 envelope；雲端另用 SDK 正式 DTO
type DerivedStats = {
  maxHp: number; maxMp: number; attack: number; defense: number;
};
type Reward = {
  exp: number; coins: number; items: BagStack[];
  minLevel?: number; job?: 'swordsman';
};
```

## 2. 靜態內容型別（T00 建立，T01／T05 填資料）

所有 definition 有 id 與 name，內部使用 ID，不用中文名稱查表。陣列順序不得成為識別碼。數值範圍見 08。

| 型別 | 必要欄位 |
| --- | --- |
| ItemDef | kind:weapon/body/hat/consumable/material/quest；stackLimit、minLevel、attack、defense、hpBonus、restoreHp、restoreMp、buyPrice、sellPrice、iconKey、visualKey；不適用數值為 0，visualKey 可 null |
| SkillDef | kind:attack/buff/passive；maxRank、requiredLevel、requiredJob:'any'/'swordsman'/'enemy'、mpCost、cooldownMs、windupMs、activeMs、recoveryMs、reach、height、targets、multiplierBase、multiplierPerRank、durationMs、defensePerRank、hpPerRank、regenPerRank、effectKey；basic為any，其餘依08 |
| MonsterDef | level、maxHp、attack、defense、exp、coins、speed、width、height、aggroRange、attackRange、attackWindupMs、attackCooldownMs、respawnMs、actorKey、drops:{itemId,chance,min,max}[]；接觸傷害用 attack |
| Foothold | id、x1、y1、x2、y2、dropThrough:boolean；規定 x1<x2，除地面外上方單向 |
| Ladder | id、x、topY、bottomY；吸附範圍 16px |
| Portal | id、x、y、targetMapId、targetSpawnId、requiredQuestId:Id|null、minLevel:number；皆雙向定義，不推導反向 |
| MapDef | width、height、themeKey、musicKey、safe、spawns:{id,x,y}[]、footholds、ladders、walls:{x,y,width,height}[]、portals、npcs:{npcId,x,y}[]、monsters:{spawnId,monsterId,x,y,roamLeft,roamRight}[]、boss:boolean |
| NpcDef | id、name、role:mentor/merchant/healer/scout/keeper、dialogueId、actorKey |
| QuestObjective | type:reach/kill/collect/equip；targetId、count；reach 的 count 固定1 |
| QuestDef | giverNpcId、turnInNpcId、prerequisiteIds、minLevel、objectives、consumeItems:BagStack[]、reward:Reward、summary、acceptText、progressText、completeText |
| RulesCatalog | items、skills、monsters 三個 Record<Id,Def>、progression:{maxLevel,expToNext:number[]}、movement:MovementConfig |
| WorldCatalog | maps、npcs、quests 三個 Record<Id,Def>、dialogues:Record<Id,{speaker,text}[]> |
| ContentCatalog | {rules:RulesCatalog;world:WorldCatalog} |

T01 的 rules/index.ts 與 T05 的 world/index.ts 各匯出常數 rulesCatalog／worldCatalog。app 才組成 ContentCatalog，不讓兩個資料代理搶總 index。測試 fixture 可只建需要欄位，但不能在 production 依賴假內容。

## 3. 各包公開函式

以下簽名由 T00 建立所需參數型別，子代理落地同名匯出。不允許各自定義 save、hero、item 的另一套格式。

### T02 movement

`createMovement(position:Vec2):MovementState`；`stepMovement(state:MovementState,input:InputFrame,map:MapDef,config:MovementConfig,dtSeconds:number,nowMs:number):MovementState`。死亡直接傳回不動狀態；攻擊減速由 app 傳入較低 speed 的 config，不讓 movement 查技能或 hp。

### T03 combat

```ts
type CombatActor = {
  id: EntityId; position: Vec2; facing: Facing;
  hp: number; stats: DerivedStats; faction: 'player' | 'enemy';
  body: { width: number; height: number }; knockbackImmune: boolean;
  skillRanks: Record<Id, number>;
};
type AttackRequest = { sourceId: EntityId; skillId: Id }; // 普攻為 basic
type AttackInstance = {
  id: EntityId; sourceId: EntityId; skillId: Id; startedAtMs: number;
  facing: Facing; origin: Vec2; rank: number; hitIds: EntityId[];
};
type CombatState = {
  attacks: AttackInstance[];
  cooldowns: Record<EntityId, Record<Id, number>>;
};
type Hit = { attackId: EntityId; sourceId: EntityId; targetId: EntityId;
  damage: number; knockback: Vec2 };
type CombatStep = { state: CombatState; hits: Hit[];
  started: AttackInstance[]; rejected: {sourceId:EntityId;code:ErrorCode}[] };
```

`tryAttack(state,request,actors,rules,nowMs,nextId):Result<{state:CombatState;attack:AttackInstance}>`，nextId 是 `()=>EntityId`。只判施放／冷卻／存活／目標存在，不扣 MP；玩家 MP 由 app 預檢及 T04 扣除，兩者成功才一起提交。

`stepCombat(state,actors,rules,dtSeconds,nowMs,rng):CombatStep`；以有效窗及已命中集合處理單段命中。rank在tryAttack固定：basic及敵招為1，其餘從source.skillRanks取，無rank不能出手。app套HP／擊退，combat不改Progress或MonsterState。buff／passive由app管理。敵招同在SkillDef表，與玩家可學技能分開。

### T04 progression／inventory

`createPlayer(name,rules):PlayerProgress`；`deriveStats(player,rules):DerivedStats`；`countItem(player,itemId):number`。

`applyProgressAction(player,action,rules):Result<PlayerProgress>`。ProgressAction union：gainReward{reward}、addItem{stack}、removeItems{items}、buy{itemId,quantity}、sell{bagIndex,quantity}、equip{bagIndex}、unequip{slot}、useItem{itemId}、allocateAp{stat:str/dex,amount}、learnSkill{skillId}、spendMp{amount}、damage{amount}、restore{hp,mp}、changeJob、setLevelFloor{level}。gainReward只處理exp/coins/items，reward.minLevel/job由app另送setLevelFloor/changeJob以控制q02順序，不在兩處重複套用。setLevelFloor僅任務腳本可用，UI無此命令。

同次 Reward／購買／領獎／更裝須先驗證最終背包，再一次提交；失敗輸入深度相等。背包索引為當前 snapshot 的索引，UI 命令排入後由 app 以最新資料重新驗證，不接受過期索引直接刪物。

### T05 quests

`getQuestView(data,questId,catalog):QuestView`（locked/available/active/ready/claimed 與目標進度）；`acceptQuest(data,questId,catalog):Result<SaveData>`；`recordQuestEvent(quests,event,world):Record<Id,QuestState>`；`planQuestClaim(data,questId,catalog):Result<QuestClaimPlan>`。

QuestEvent 為 reached{mapId}、killed{monsterId}。收集與裝備狀態從當前 PlayerProgress 計算，不額外計數以防賣出後仍能交。QuestClaimPlan 為 `{nextQuests,removeItems,reward}`，不直接改玩家；app 在 cloned player 上依次 removeItems、gainReward、setLevelFloor／changeJob，全部成功才一起提交玩家與 nextQuests。T05 不 import T04，避免循環與開工等待。

### T06 actors

`createMonster(entityId,spawn,map,rules):MonsterState`；`stepActors(monsters,player,map,rules,dtSeconds,nowMs):ActorStep`；`applyMonsterHit(monsters,hit,nowMs):MonsterState[]`。

MonsterState為 `{id,monsterId,spawnId,movement,hp,mode,idleUntilMs,lastAttackAtMs,phase,deadAtMs,width,height,pendingSkillId,attackOrigin,attackFacing,deathReported}`；mode=idle/patrol/chase/windup/recovery/dead，phase=1/2，deadAtMs及attackOrigin可null，pendingSkillId為Id|null。ActorStep為 `{monsters,attackRequests:AttackRequest[],telegraphs:Telegraph[],deaths:EntityId[],respawnRequests:EntityId[]}`。Telegraph為 `{id,sourceId,kind:'rect',rect:{x,y,width,height},resolveAtMs}`。applyMonsterHit改HP及dead，stepActors首次看到dead&&deathReported=false才回deaths並設true。重生到時回respawnRequests，由app用新EntityId重新createMonster替換。

AI進windup當刻送一次AttackRequest，combat處理唯一前搖／有效窗，AI只保持同時序停止／預告／後搖，不能等前搖後才送。Telegraph.resolveAtMs=start+skill.windupMs。擊退設定movement.velocity與knockbackUntilMs=now+180，T02期間保留vx不被輸入蓋掉。玩家受傷保護由app統一800ms。

### T07 render

`createWorldRenderer(scene,assetManifests:AssetManifest[],catalog:ContentCatalog):WorldRenderer`。提供 `loadMap(map:MapDef):Promise<void>`、`render(snapshot:WorldSnapshot):void`、`resize(width,height):void`、`dispose():void`。scene由app建立，不另建Game或update；catalog僅查NPC名／敵人尺寸，不在renderer發獎勵。

WorldSnapshot 為 `{mapId,nowMs,player:{id,movement,hp,maxHp,animationKey,visual:{weapon,body,hat}},monsters:MonsterState[],drops:DropState[],npcs:MapDef['npcs'],attacks:AttackInstance[],telegraphs:Telegraph[],effects:VisualEvent[]}`。DropState 為 `{id,itemId:Id|null,quantity,coins,position,expiresAtMs}`；coins 掉落 itemId=null、quantity=0。VisualEvent 為 `{id,kind:damage/levelup/pickup/hit/buff,position,value?:number,key?:Id,atMs}`。面板／商店不由 renderer 製作。

### T08 UI

`createUi(root:HTMLElement,dispatch:(command:CommandDraft)=>void):UiController`；提供render(view:UiSnapshot)、setPanel(panel:PanelId|null)、isInputCaptured():boolean、dispose()。UI不修改SaveData或import domain。PanelId=inventory/equipment/skills/stats/quests/map/shop/dialogue/settings。UiSnapshot為 `{screen:title/create/loading/playing/paused/dead/result,error?:string,saveData:SaveData|null,stats:DerivedStats|null,questViews:QuestView[],catalog:ContentCatalog,saveStatus:SaveStatus,toast:string|null,panels:PanelId[],interaction:{npcId:Id;dialogue:string[]}|null,canReturnTown:boolean,nowMs:number,skillReadyAtMs:Record<Id,number>,potionReadyAtMs:number}`。panels最後一個為頂層，app持stack；setPanel僅顯示，點擊開關發setPanel/closePanel命令，app決定暫停。CommandDraft為GameCommand各union成員移除seq後的distributive union，由T00建立，不能直接Omit整個union導致payload失去對應關係。

QuestView為 `{questId:Id,title:string,status:'locked'|'available'|'active'|'ready'|'claimed',objectives:{type:QuestObjective['type'];targetId:Id;current:number;required:number}[],reward:Reward}`。QuestClaimPlan為 `{nextQuests:Record<Id,QuestState>,removeItems:BagStack[],reward:Reward}`。T00落地這兩型別，T05及UI不各猜一份。

### T09 persistence

`validateSave(raw:unknown,catalog):Result<SaveData>`；`createPersistence({gameId,storage,cloud,catalog,onStatus}):Persistence`。storage 是 StorageLike{getItem,setItem,removeItem}；cloud 是 CloudPort（下一節）。Persistence 提供 `initialize():Promise<LoadOutcome>`、`checkpoint(data):void`、`retry():Promise<void>`、`invalidate():void`、`dispose():void`。LoadOutcome 為 `{mode:local/cloud/preview/memory,status:SaveStatus,data:SaveData|null}`；loadError 不產生可寫 cloud 新角色。

### T13 audio

`createAudio(manifest,settings):AudioController`；提供 `unlock():Promise<void>`、`setMusic(key):Promise<void>`、`playSfx(key):void`、`setSettings(settings):void`、`setPaused(paused):void`、`dispose():void`。拒絕播放只回報音訊狀態，不 throw 中斷 app。

## 4. 命令、儲存與組裝

GameCommand是 `{seq:number,type,payload}` discriminated union，type/payload：newGame{name}、continue{}、attack{skillId}、pickup{}、interact{}、acceptQuest{questId}、claimQuest{questId}、buy{itemId,quantity}、sell{bagIndex,quantity}、equip{bagIndex}、unequip{slot}、useItem{itemId}、allocateAp{stat,amount}、learnSkill{skillId}、returnTown{}、retryBoss{}、respawn{}、togglePause{}、setPanel{panel:PanelId|null}、closePanel{}、setSettings{settings}、retrySave{}、useCloudVersion{}、playTemporary{}、returnTitle{}。seq由app統一分配；UI／鍵盤交無seq的CommandDraft給包裝器，由其補seq，不各自重編。setPanel非null推入／置頂，null清全部，closePanel移除最後一項；app依stack決定settings暫停。移動InputFrame每tick擷取，不逐幀入命令列。

SaveStatus = unavailable/loading/ready/saving/saved/localSaved/previewOnly/loadError/saveError/conflict/authLost/incompatible。CloudPort 是 SDK 的薄 adapter：`ready():Promise<{mode,progressAvailable,capabilities}>`、`loadProgress():Promise<CloudRecord|null>`、`saveProgress({data,revision,formatVersion:1,requestId}):Promise<CloudSaved|null>`。CloudRecord 沿 SDK `{data,revision,formatVersion,gameVersion,updatedAt}`；CloudSaved 加 saved:true。Error 保留 code、machineCode；不自行實作 postMessage 或帳號 API。

T09 建 cloud port interface 與可注入測試 fake；T15 寫正式 `src/platform/playroom-port.ts` adapter；T14 將實際 cloud 注入。這三者不得各自引入另一份 SDK。

每 tick 的唯一順序：取得輸入／命令 → 驗證及原子交易 → AI 產生意圖 → 玩家／怪物移動 → 攻擊實例及命中 → HP／擊退／死亡 → 唯一死亡獎勵／任務事件 → 掉落與拾取 → 檢查點 → snapshots 渲染／UI／音效。跨圖採鎖輸入→準備資源→成功才交換世界→安全出生→reach事件→解鎖；失敗留舊世界重試。

## 5. 修改與完成規則

禁止 `as any` 掩蓋不一致、兩套內容 loader、重複的 game loop、UI 直接改物品數、renderer 發獎勵。缺介面由子代理向主 Agent 提具體 signature 建議，主 Agent 改 contracts 並通知，不自行私建平行格式。

T00 的型別可有必要輔助細節，但不得改此頁定義的責任與公開函式語意。每個包報告列實際匯出與消費者，主 Agent 只在接口接合後標整合完成。
