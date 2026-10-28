# 17・既有基礎遊戲體驗改進計畫

建立：2026-10-28，香港時間。最新狀態：**beta24 SOURCE_DELIVERED／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL；限定視審收束，未發布**。原4檔27 focused與typecheck沿用；新增視審確認NPC／合成恢復卡呈現，beta23動作中／排隊／冷卻與藥水切換所見通過。窄版toast遮操作鈕修成beta24，build／pack／完整validate及恢復環境後640指定實畫所見通過。Chrome在同版本工具sandbox對照失敗、一般桌面權限成功，支持環境權限／IPC差異；未改系統安全設定、不全回歸。profiles/raw保留，不新增plan／排程。實際結果以[最終交接](reports/base-experience-handoff.md)及[啟動恢復報告](reports/base-experience-browser-recovery.md)為準；下列為設計及原驗收規劃，不代表各browser項已完成。

本計畫承接[本對話最新授權與交接](reports/base-experience-current-handoff.md)。04:05一次性排程已觸發並由主代理刪除；主代理審閱本計畫後可按下列分工實作。規劃代理本輪只寫文件。最新授權取代舊文件的「只寫plan後停止」與舊Sol High審圖分工；本份有界工作完成後停止，不自行開下一份計畫或排程。

## 1. 目標、玩家行為與排除範圍

本期集中改善四件玩家已在使用的事情：離開遊戲後安全恢復、按互動前知道實際目標、看懂技能目前的動作狀態，以及減少快捷欄不必要的圖示重建。沿用既有四區18圖、任務、怪物、素材與傷害判定。

| 情境 | 目前行為／限制 | 本期完成後 |
| --- | --- | --- |
| 戰鬥中切到別的視窗再回來 | blur凍結，focus true即恢復，不另要求繼續 | 返回前景仍凍結並顯示恢復卡；玩家明確按繼續或適用的Esc後才復戰 |
| 走近NPC／出入口 | 世界上已有名稱，HUD沒有與Space同源的即時目標；按後才得結果或失敗toast | HUD顯示這次互動真正會選的NPC或目的地，以及原有門檻；離開64px範圍即消失 |
| 普攻／重斬收招時看快捷欄 | 普攻只顯MP0；技能只顯概括的冷卻／MP原因；600ms排隊未呈現 | 顯示冷卻剩餘、動作中與仍有效的已排隊狀態；不改攻擊、MP、冷卻、判定或排隊時限 |
| 一般遊玩每次UI更新 | 快捷欄無條件建立新img／fallback；藥水圖示同一次更新可能先建錯分支再覆寫 | 相同素材描述沿用原節點；文字數值正常更新；藥水切換及error fallback正確失效 |

**固定邊界：** ID `brightwood-first-oath`、desktop鍵盤滑鼠、單人劍士、Lv1–30、四區18圖、19條主線與q20／q21／q22支線、存檔讀1–5寫5。

**排除：** 不新增區域、地圖、任務、怪物、裝備、技能、玩法系統或新刷取要求；不改首領數值／節拍、傷害範圍、移速、64px互動距離、傳點座標、任務門檻或獎勵；不改SaveData／format5、canonical key、雲端revision／requestId／備份／匯入；不重畫場景、重製音樂、加全局cache或大規模效能重構。

已有Continue／對話焦點修復、點按說明、傳點名稱、q19回顧、q21／q22均保留。舊灰畫面、實際音訊、精確預警時序、舊q09／q10未完整重演不變成本期必刷門檻。未授權push／tag／Release／平台人工確認／上架／兌換reset。

## 2. 現況、具體證據與分級

### 已交付基線

Plan16已收束為 **beta20 SOURCE_DELIVERED／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL**。四區18圖、本機format5、q21／q22、導航與世界回顧已交付。Sand原同attempt正常勝利、q22／q14手動領獎、q15實際進Ruins已閉環。Frost真q08副本最後q09 active3/6、q10未接，屬未改舊鏈未完整重演，不是新實作欠缺。上輪QA resources已關，profiles／raw仍保留。

必讀來源為[Plan16](16-world-completion-roadmap.md)、[集中交付](reports/world-completion-handoff.md)、[live-handoff頂端收束決策](reports/world-completion-live-handoff.md)、[Sand closure](reports/world-completion-sand-closure.md)與[Frost finish](reports/world-completion-frost-finish.md)。下方歷史續刷要求不覆蓋頂端收束。

最新凍結候選 `artifacts/world-completion-beta20/dist/`；ZIP `artifacts/world-completion-beta20/game-beta20.zip`，131,520,177 bytes／274 entries，SHA256 `154cfc4e24c20c067a0849ce7a96aeea3e9e114d9db79c8dbbdab13127bda8bf`。沿用候選報告，本規劃未重算。原玩家 `output/playwright/resume-1515/q08-claimed-format4.json`、Frost／Sand profiles、beta19／20與全部dirty不可覆寫／reset／clean。

### 確認問題與本期決策

行號為規劃快照，實作時按符號重定位。細節見[規劃證據](reports/base-experience-plan-evidence.md)。

| 編號／級別 | 已確認的來源行為 | 決策 |
| --- | --- | --- |
| E01／P0設計改善 | `src/app/app.ts:169–174` setWindowFocused；`src/app/panels.ts:28–30` isWorldFrozen；`keyboard.ts:217–236`。focus true可直接解除背景凍結 | 加app-only明確恢復閘門。P0指本期安全契約，不聲稱已重現玩家受損bug |
| E02／P1資訊缺口 | `gameplay.ts:745–791`，nearestNpc／interactNearest：NPC優先、64px、再portal；`state.ts:120–129`沒有即時互動目標 | Space與HUD共用單一純helper，不增加磁吸／遠端互動 |
| E03／P1狀態缺口 | `gameplay.ts:436–495,929–932`已有收招、600ms buffer及MP詳細回饋；`ui/index.ts:680–760`未呈現收招／排隊 | 只補runtime資訊，不改combat或技能輸入語義 |
| E04／P1重複配置 | `app.ts:235–249,738–748`、`main.ts:26–31`多次UI render；`ui/index.ts:697–705,753–754`每次replaceChildren | 只快取六格快捷欄圖示身份，不改simulation／通知架構；沒有實測FPS改善承諾 |
| E05／保留已做項目 | `ui/index.ts:1037–1043,1058–1063,1245–1283`已有canvas焦點處理；`keyboard.ts:287–320`刻意阻擋UI文字欄位遊戲鍵 | 不重做整套焦點，只在真正恢復commit後正確回canvas或原panel控制 |

### 假設與未驗，不直接派修

| 項目 | 證據界線 | 本期處理 |
| --- | --- | --- |
| 沙海傳點／移動失效 | 前段焦點及位置不確定，後段正常Right250＋Space成功並完整閉環 | 不改portal／movement；提示補資訊，不能用按鍵時長當位移證據 |
| 等待扣MP | Frost兩次採樣間有三次heavy未即時讀MP，CLI曾丟session_id | 不判MP bug、不改成本；保留採樣限制 |
| 灰canvas／背景抖動 | [靜態audit](reports/world-completion-canvas-audit.md)未定位根因；[動態短段](reports/overnight-motion-review-20261026.md)範圍有限 | 不加watchdog、強制reload或重畫；本期若再現才留最小證據交主代理分析 |
| 揮空／預警難讀 | 已有命中浮字、血條與預警；精確時序仍未驗 | 本期不增hit／miss事件、不改renderer／時序；有新遮擋證據才決策有界修復 |
| 保存提示 | 已區分本機、雲端、預覽、失敗、升級；正式雲端未驗 | 保持footer及錯誤可見，不加第二套保存狀態，不宣稱正式保存成功 |

## 3. 實作前鎖定的契約

### 3.1 頁面焦點與明確恢復

在GameAppState加入 **`focusResumeRequired: boolean`**，初始false。這是app-only記憶體狀態，不寫SaveData、localStorage或雲端；獨立於screen，避免地圖載入回調改screen時意外復戰。

| 事件 | 必須行為 |
| --- | --- |
| window.blur／document hidden | 釋放held keys，清pending transient命令及bufferedAttack。有gameplay且screen為playing／paused／loading時設閘門true；保留panel stack、位置／HP／MP、任務及已開始attack |
| 同頁canvas→HUD／對話／input | 沿既有規則放鍵、阻擋文字輸入遊戲鍵；不設閘門，不把同頁欄位或重綁當作離開頁面 |
| window.focus／重新visible／canvas click | 只更新真實windowFocused／鍵盤焦點；不能清閘門。handleFocus須核visible且document.hasFocus |
| 明確繼續／適用Esc | windowFocused且screen為playing或paused才清閘門；app命令層在saveStatus conflict或saveUpgrade時一律不處理togglePause，涵蓋重綁鍵及所有命令來源。原manual paused可同一次回playing。loading或更高優先存檔卡片不可繞過 |
| 有panel時Esc | 沿用先關頂層panel；關panel不清閘門。卡片文字不得保證第一次Esc一定復戰 |
| returnTitle／明確newGame | 清app-only閘門及暫時焦點記錄；單純loadMap完成／focus不清 |

`worldIsFrozen = isWorldFrozen(state, windowFocused) || focusResumeRequired`；保留settings凍結與其他panel不凍結政策。audio setPaused亦包含閘門；不改音訊素材或宣稱聽驗。

恢復卡顯示於原paused，或`screen==='playing' && focusResumeRequired`。文案：「畫面曾離開遊戲，已安全暫停。按『繼續遊戲』恢復冒險。」保留loading、存檔衝突／升級、dead、result等更高優先卡片。

焦點恢復須在render收到閘門清除／paused→playing的**已commit轉換**後處理，不只在dispatch當刻focus。無panel回canvas；有panel則保留原有效data-focus控制，失效時選該panel第一個有效控制或關閉鈕。保留文字選取、數量、range、重綁、對話防repeat；不將開panel或按對話鈕誤當復戰。

### 3.2 共用互動目標

新增 `src/app/interaction-target.ts`，純函式，不讀DOM／Phaser、不改資料：

```ts
export const INTERACTION_RANGE_PX = 64;
export type InteractionTarget =
  | { kind: 'npc'; placement: Readonly<NpcPlacement> }
  | { kind: 'portal'; portal: Readonly<Portal> };
export function nearestNpcPlacement(
  map: MapDef | undefined, position: Readonly<Vec2>, radius: number,
): Readonly<NpcPlacement> | null;
export function resolveInteractionTarget(
  map: MapDef | undefined, position: Readonly<Vec2>,
): InteractionTarget | null;
export function portalBlockMessage(
  save: SaveData, portal: Readonly<Portal>, catalog: ContentCatalog,
): string | null;
```

NPC保持Math.hypot、距離≤64、距離再npcId排序；有NPC就優先於所有portal。無NPC才按同距離規則選portal，tie按portal.id。`nearNpc`仍判最近NPC身份，不能改成任一指定NPC在範圍就算。門鎖不影響選擇順序。

portalBlockMessage先minLevel，再requiredQuest claimed；搬移`gameplay.ts:1241–1249`現有lockedPortalMessage的ready／active／available區別，open回null。`interactNearest`調同helper執行原healer／merchant／dialogue／transition；實際按鍵執行時重算，不能信任舊HUD快照。

HUD只讀同helper：NPC顯「Space 交談：名稱」或「互動：名稱」，portal顯「Space 前往：目的地」，blocked列原門檻。石碑／航標不能假稱Space即完成inspect。快捷鍵按DEFAULT＋保存重綁顯示，不寫死Space。

無target隱藏即時提示，保留一般互動鈕與原無對象toast。只在playing、無恢復閘門、無遮擋panel時顯示；用獨立HUD小行／互動鈕title，不佔toast、不每tick aria-live。只改DOM，不新增WorldSnapshot／renderer圈選或素材。

### 3.3 戰鬥UI摘要

新增 `src/app/combat-ui-state.ts`：

```ts
export type CombatUiState = {
  actionLockUntilMs: number;
  bufferedSkillId: Id | null;
};
export function deriveCombatUiState(
  gameplay: GameplayState | null, catalog: ContentCatalog, nowMs: number,
): CombatUiState;
```

actionLockUntilMs取玩家仍有效attack的`startedAtMs + windupMs + activeMs + recoveryMs`最大值，沒有為0；忽略敵人attack／非attack skill。bufferedSkillId僅玩家存活且buffer的`expiresAtMs >= nowMs`時回傳，否則null。不建立、續期或消費buffer，不改MP／combat。

顯示順序：未載入／不可操作畫面 → 未學習／原MP不足／本技能冷卻 → 有效已排隊 → 玩家動作中 → 原可用等級與MP。buff已生效維持目前效果剩餘秒數優先；普攻亦可顯自己的冷卻／動作中，成本仍MP0。

冷卻／動作剩餘以game time向上取至0.1秒；0／過期消失，暫停不倒數。已排隊只在對應格顯示，不稱一定出招或命中。**不因收招／排隊額外disable**，保持原600ms鏈招；disabled仍沿screen、學習、MP、該技能cooldown規則，普攻連按政策不變。原MP詳細toast、技能未學原因、浮字／HP條沿用。

### 3.4 Snapshot與圖示身份

唯一UI owner加入下列**選填**UiSnapshot欄位，正式createUiSnapshot明確填入，舊fixture省略時UI採false／null／0：

```ts
focusResumeRequired?: boolean;
interactionHint?: {
  targetKey: string; // npc:<npcId> 或 portal:<portalId>
  kind: 'npc' | 'portal';
  label: string; // 不含快捷鍵
  blockedMessage: string | null;
} | null;
combatUi?: { actionLockUntilMs: number; bufferedSkillId: Id | null };
```

不擴散至SaveData／Manifest／SDK；windowFocused註解同步說明頁面焦點與恢復閘門。

快捷欄只快取六格圖示：先分skill／item及實際itemId，藥水不再先經不存在skill分支。descriptor包括asset key、解析URL、displayWidth／Height、label、class、missing狀態；相同描述保留同一子節點。manifest重載即使key相同但URL／尺寸不同也失效。小藥用完轉大藥須同步圖示、label、count、data-item-id、title。

error fallback在相同descriptor穩定保留，不每tick重試壞圖；descriptor真正改變才建新節點。沿用missing／error標籤，不保留舊成功圖冒充新圖。其他文字／disabled／buff照常更新；cache在createUi closure，dispose清除。不快取整個view、不合併app通知、不新增全域cache、timer或套件。

## 4. 有界工作包

所有程式包交**全新gpt-6-luna／max／fork none**，主代理分析、定案、協調，不直接寫遊戲程式。新檔若已被其他人建立，先回主代理確認所有權。每包只改自己的增量，不能還原整個dirty檔。每包report列變更理由、source、實際命令、結果、略過／未驗及下一步。

### B00・開工與規格分配（P0，主代理）

- 04:05後刪除已觸發的一次性排程，讀本plan與current-handoff；記branch／HEAD、git status摘要、版本及所有權，不讀取／輸出完整玩家raw。
- 新任務主代理完整讀當時main模板及七份規格，給每包適用摘要；子代理按§6選讀。核仍beta20或記實際差異，不重驗舊ZIP／啟舊profile。
- 發A批三份詳細任務：背景證據、§3契約、文件／符號、禁止範圍、依賴、最小檢查、報告、停止條件，不能只派「優化UI」。

**驗收／檢查：** 靜態確認基線與所有權可執行。**回退：** 文件更正，不動遊戲。主代理維護 `plan/reports/base-experience-dispatch.md`。

### B01・失焦明確恢復核心（P0，Luna-A）

**只擁有：** `src/app/app.ts`；`src/app/state.ts`的GameAppState／initial／appCommand／worldIsFrozen，**不改createUiSnapshot**；`src/app/keyboard.ts`、`src/app/command-queue.ts`；新 `tests/integration/app-focus-resume.test.ts`；`plan/reports/base-experience-focus.md`。不改UI／ports／gameplay內容。

1. 按§3.1加app-only閘門；blur／hidden鎖，focus／visible／canvas pointer只報真實頁面狀態，不能清閘門。handleFocus核visible且hasFocus。
2. 失焦放held keys、清pendingGameplayCommands及app中copy的bufferedAttack，保留已開始attack。queue增 `discard(types: ReadonlySet<CommandDraft['type']>): void`，不改剩餘seq／nextSeq。失焦清`attack/pickup/interact/inspect/useItem/togglePause`，保留保存、接領任務、設定等明確操作。
3. update開始若wasFrozen，本次queue的五種transient gameplay命令不在同tick「先unpause後補打」；togglePause按明確恢復處理。respawn／retry／returnTown保留原screen限制及lifecycle。
4. appCommand(togglePause)僅windowFocused且playing／paused可清閘門；manual pause、Esc先關panel保留。returnTitle／真正newGame清閘門，loadMap完成不清。
5. synchronizeAudio的paused判斷包括閘門，不改audio unlock／素材。B04稍後補UI，不在此跨檔臨時接線。

**依賴：** B00；可與B02／B03並行。

**驗收：** active→blur→focus仍凍結，gameTime／位置／HP／MP／cooldown不前進；明確恢復從原game time前進；held／buffer／失焦前transient不延遲爆發；loading完成仍鎖；manual paused／title／dead／result不被focus轉playing；panel stack保留。

**最小檢查：** 新focused檔約5個核心案例覆蓋普通恢復／stale input、loading、manual及非playing、同頁UI不算blur、queue保seq。沿用asset-fixtures／app初始化，不修無關app-foundation舊catalog計數。只跑新檔；audio假port僅驗setPaused，非聽音。全域typecheck留B04，browser留B06。

**回退：** 只撤本包增量，不能reset整檔；若閘門阻續玩未修，不標完成，不靠清save／reload或悄悄取消安全契約。

### B02・共用互動核心（P1，Luna-B）

**只擁有：** 新 `src/app/interaction-target.ts`；`src/app/gameplay.ts`內nearestNpc／nearNpc／interactNearest／lockedPortalMessage、相關import與64px常數；新 `tests/interaction-target.test.ts`；`plan/reports/base-experience-interaction.md`。不改state／ports／UI／內容表。

**工作：** 按§3.2抽純helper，Space與nearNpc接入；保留healer／merchant／inspect二階段／原錯誤訊息／requestTransition。回報exports及樣本供B04使用，不把hint存gameplay或toast。

**依賴：** B00，與其他core並行。**驗收：** 64邊界含、64以上不含；tie按ID；NPC優先較近portal；level先quest；ready未claimed仍擋；無target原toast；一個app核心案例證Space實際執行同helper選中者。

**最小檢查：** 新檔約5–6個參數化核心案例，沿用startNewGame與合法runtime；只跑此檔，不content、不舊任務長刷、不全部app-gameplay，不碰真save。

**回退：** 撤本包helper接線與測試，B04提示同時撤；不可留兩套nearest規則。

### B03・戰鬥UI狀態推導（P1，Luna-C）

**只擁有：** 新 `src/app/combat-ui-state.ts`、`tests/combat-ui-state.test.ts`；`plan/reports/base-experience-combat-ui.md`。只讀gameplay／combat／skills，不改它們、state／ports／UI。

**工作：** 按§3.3回傳純runtime摘要，給B04 basic／heavy／sweep動作中、有效及到期buffer例；不複寫600ms為新常數。

**依賴：** B00；與A／B並行。**驗收：** 僅玩家有效attack造成鎖；敵人／過期／非attack不鎖；到期或死亡不顯排隊；原combat／MP／buffer不變。

**最小檢查：** 此新檔約3個核心案例，不重測傷害／首領／全部技能平衡。**回退：** 刪本helper及顯示接線，無存檔遷移。

### B04・單一UI整合及快捷欄圖示減量（P0接線＋P1體驗，全新Luna-D）

**依賴：** B01–B03交付、主代理接受，B01釋放state。

**唯一擁有：** `src/contracts/ports.ts`的UiSnapshot加法欄位；`src/app/state.ts`的createUiSnapshot；`src/ui/index.ts`、`src/ui/styles.css`必要小樣式；新 `tests/base-experience-ui-snapshot.test.ts`；`plan/reports/base-experience-ui-integration.md`。不改combat／persistence／maps／renderer，其他代理不能同寫這些共享檔。

1. 按§3.4接snapshot；interactionHint調同target／portalBlockMessage，combatUi調B03；缺catalog仍null。正式snapshot明確填值，舊fixture省略採安全預設。
2. renderScreen signature加入閘門，卡片優先級照§3.1；focusBanner不得再說點一下即可繼續。UI只讀flag，用原togglePause命令明確恢復。
3. commit後才恢復canvas或原panel有效data-focus，保留文字選取／數量／range／重綁／對話repeat護欄。不重寫成全局焦點服務。
4. 閘門待恢復時不可由快捷鈕／拾取／互動／回城發起遊戲動作；繼續鈕及更高優先保存操作仍可用。
5. 即時互動小行獨立於toast，不蓋任務追蹤／保存footer；640×360以換行或省略配title處理長字，不縮到不可讀。
6. 顯示冷卻數字／動作中／已排隊，保留disabled與buff政策。先分skill／item，再按descriptor快取圖示，保留MP／count／重綁／fallback語義。
7. 不重構整個UI、panel JSON signature、world map或save提示；額外想法記候選，不擴scope。

**驗收：** 三欄位同源且不進SaveData；範圍外無假可互動提示；恢復需本人動作且panel保焦點；狀態資訊不改MP／動作；同descriptor節點穩定、小→大藥及error能失效。

**最小檢查：** snapshot接線新檔2–3個核心案例，不重複B02／B03全部；整合完成後typecheck一次。純文案／樣式不加test；圖示identity／焦點由B06同一次短段驗，不裝jsdom／happy-dom或造完整假DOM。未變A–C已過不重跑。

**回退：** 按表面撤本包增量，不留半套閘門UI或hint。圖示cache可單獨撤，但P1仍須明列未完成；不能冒稱全包驗收。

### B05・最終來源與新候選（P0，全新Luna-E）

**只擁有：** package.json／package-lock.json／public/game.json版本欄位；新獨立 `artifacts/base-experience-<實際版本>/`；`plan/reports/base-experience-candidate.md`。不擅改遊戲／Release workflow。

**依賴：** B04完成、無未解P0、source owner釋放。若仍需修source，先修再建。

- 當刻查未使用且高於最新的版本，不先占beta21；同步三版本，ID／schema2／desktop／讀1–5寫5不變。
- 用既有符合 `>=24.22.1 <25` 的bundled Node。沿用已過且來源未變focused／typecheck；只重跑失效的直接相關項，不npm test全套。內容未改略content並說明。
- 新唯一目錄build一次，固定tools1.2.0 pack／完整validate各一次，ZIP在dist外；記來源清單／指紋、dist指紋、ZIP bytes／entries／SHA256、Node／工具、有限文字機密掃描範圍。
- source相符才標SOURCE_DELIVERED／ZIP_VALIDATED，凍結候選供Terra；beta19／20不動。

後續命令模式，實際版本由owner代入，並非規劃已執行：

```powershell
npm.cmd run build -- --outDir artifacts/base-experience-<version>/dist
node tools/playroom/pack.mjs artifacts/base-experience-<version>/dist artifacts/base-experience-<version>/game.zip
node tools/playroom/validate.mjs artifacts/base-experience-<version>/game.zip
```

**驗收／最小檢查：** 一次build／官方完整ZIP，版本及Manifest相符。環境失敗先辨關聯，無關不擴整修，交source並列限制。**回退：** 只撤版本增量或另建修正版；不刪save／舊候選、不移tag、不覆寫同版成品。

### B06・唯一集中browser／視覺短段（P0驗收，Terra）

**代理：** 全新 `gpt-6.1-terra／max／fork none`，每次最多一名。所有browser與視覺均交Terra，不讓Luna另開QA視窗。Terra不改source；問題由主代理分析再派全新Luna修。

**只擁有：** 新 `output/playwright/base-experience-<version>/`、唯一新profile／session／雙origin服務；`plan/reports/base-experience-browser.md`。讀B05路徑及本節、適用browser技能；不讀整段長對話或動原profile。B05候選凍結後才開測。

**單一路線：** 新QA角色camp短段為主；需已學技能或portal門檻時，用獨立且已驗證format5 QA fixture，記前置由fixture提供，只寫新origin。可沿用合法fixture另存副本、定點修改並驗證；不讀寫原玩家q08／Frost／Sand profile，不稱從零全通，不為本期完成q01–q22。

| 短段 | 必要操作／證據 | 停止界線 |
| --- | --- | --- |
| 恢復 | 新候選跨來源子目錄iframe短移；切離window或tab一次再回，卡片仍凍結；明確繼續後可移；一個對話／數量欄位證同頁UI focus不設閘門 | 不長等刷怪；公開DOM／HUD及必要raw，禁注入私有app state；manual pause／Esc只測一次相關路徑 |
| 互動 | 一個NPC範圍內外短移，提示出現／消失，Space開同名對話；一個既有portal核目的地／原門檻，可通則只進一次 | 無反應先核visible／hasFocus／canvas active／panel；不直接判portal bug、不走全區 |
| 技能 | 合法已學QA技能：普攻→收招中按一次skill，看動作中／有效排隊／冷卻及原MP；一個有限MP分支看不足原因 | 不用按鍵數或MP差當命中，不追首領勝利／全部rotation，等完整原動畫 |
| 圖示 | 自然多次UI tick同slot子節點identity不變，而MP／冷卻文字更新；一次小→大藥核圖示／count／itemId | 不FPS benchmark／全素材遍歷；簡便診斷可明標DOM fault或fixture分支，不冒稱正常路線 |
| 尺寸 | 960×540為主，同進度縮640×360一次看新卡片／小行／快捷欄，不壓操作與保存footer；console／資源看新異常摘要 | 不反覆截圖；純樣式可靜態確認者不為此另開第二輪browser |

error fallback若需驗cache，只做一次明標DOM error事件／斷圖診斷，不改真素材／全局網路設定；沒有簡便方法列未驗交主代理，不造複雜框架。

每段正常bringToFront、click canvas並核公開hasFocus／activeElement；本期有恢復卡時先明確Continue。放鍵後再讀結果，不能以focus函式或等待時長當輸入成功。單owner／單route，不搶Chrome焦點。

先只留1–2張必要組合畫面，長邊≤1280px、JPEG60–75；透明先合成背景。完整圖／raw／長log留repo，不輸出base64／data URI／大量JSONL。Terra同時完成該短段視檢，不再另派代理重審全部圖。

失敗先放鍵、pause、存最小現況與ownership；主代理分析再詳細派Luna修，Terra不直接改程式。修後只重測失效短段，未變已過沿用。browser／CLI若因無關環境無法啟動，報限制停止排障。

結束保存新QA raw／HUD及paused狀態；核session、profile、PID完整命令列與ports均屬本任務後再關，保留profile／證據。不能舊PID盲殺或碰其他服務，未能核實者照實列出。

## 5. 分批並行及共享檔

| 批次 | 槽位 | 工作與交接 |
| --- | --- | --- |
| 0 | 主代理 | B00最新規格／基線／所有權；明確發令A批 |
| A | 主＋3名全新Luna＝4 | B01焦點核心、B02互動核心、B03combat UI helper；各report，UI／ports完全不動 |
| B | 主＋1名全新Luna | B04唯一owner接ports／state snapshot／UI／CSS及圖示；A owner停止寫已釋放檔，整合typecheck一次 |
| C | 主＋1名全新Luna | B05版本／一次build／固定pack完整validate；凍結source／dist供Terra |
| D | 主＋1名Terra | B06唯一browser／視覺route及cleanup；Terra活動時最多另2名Luna，且不得動同候選／browser；無須填滿槽 |
| 修復 | 主分析→全新Luna，Terra停止輸入 | 只修確認且屬scope缺陷；需新候選則另立版本；Terra只補受影響短段 |
| 收尾 | 主代理 | 更新status／README／current-handoff與最終report；完成本份工作後停止 |

`ui/index.ts`／styles／ports只有B04或明確後續修復owner；gameplay只B02指定函式，B01清buffer在app的copy完成；state上半段先B01、snapshot後B04，**不在同時有兩個writer**。版本只B05。主代理始終維護status／README／全局handoff，不直接寫遊戲程式。

## 6. 規格按包選讀與最小驗證

主代理每次新任務完整取得模板及七份main規格，記時間並下發適用摘要。**子代理是否完整重讀由主代理按包指定，不把八份完整重讀設為每包硬門檻。**

| 包 | 下發摘要／必要原文 |
| --- | --- |
| B01 | 背景可預期、Esc屬遊戲、模式切換不重載、訪客可玩；局部操作包不必完整重讀，有iframe疑問再指定相關段 |
| B02／B03／B04 | 保留玩法／資料、相對資源、desktop可讀、保存成功不冒稱雲端；局部UI／效能不必完整八份 |
| B05 | 指定模板打包段、game-development建置交付、Schema、workflow、sdk-versioning工具／Node段原文；改SDK／Manifest或跨規格疑問才完整 |
| B06 | 指定iframe／子目錄／尺寸／Esc及不可mock冒稱正式能力段，另讀browser技能；未改SDK／save不重驗帳號矩陣 |
| 擴至SDK／save／Manifest／iframe核心／發布 | 主代理先評授權與scope，再指定相關原文；跨規格或必要才全八份，本計畫不默認擴scope |

- 本規劃輪只有文件核對，沒有遊戲tests／browser／build／pack。
- A各跑自己新focused檔；B只snapshot接線focused及typecheck一次；未變已過不重跑。純文字／樣式／小布局不預設新增test或browser。
- C只一次必要build／固定pack／完整validate；版本增加不觸發全部遊戲測試。內容表未改略content check並說明。
- D只新變更短段，單owner／route；不全回歸、不長刷舊q09／q10、不逐擊截圖。
- focused形式：`npx.cmd vitest run <本包test檔> --exclude '**/.worktrees/**'`；避免寬pattern選入舊工作樹，不安裝全局依賴。
- 環境失敗先判關聯；無關或啟動過慢報限制，不擴工具整修。使用者說「不用檢查，我會自己檢查」即停止可選驗證，完成實作、列略過，不稱未驗PASS。

## 7. 風險、素材與回退

| 風險 | 控制 |
| --- | --- |
| 閘門困住玩家／loading覆蓋 | 獨立app旗標、explicit resume／loading focused；阻斷即P0，不靠清save或reload解決 |
| HUD與Space分歧 | 同helper／64px／優先順序，執行時重算，不renderer另寫nearest |
| 排隊資訊改鏈招 | helper只讀，不續期600ms、不新增disable、不宣稱命中 |
| cache保留舊藥／壞圖風暴 | descriptor含實際URL／尺寸／label，error同描述穩定；一次identity／切換檢查 |
| 640px新行遮操作 | 小行換行／title，保HUD與save footer；只新表面一次視檢 |
| dirty／候選混用 | 只撤各包增量，新版本／獨立目錄／source指紋，保留beta19／20與原save |
| QA搶焦點／控制錯誤 | 唯一Terra，公開focus與pause guard，等完整動畫；CLI或等待失誤不判遊戲bug |

本期預設**零新圖像／零新音訊**。若確需圖片，主代理先給用途、構圖／風格、尺寸、透明需求、輸出檔及可判定驗收，由Luna讀imagegen技能並使用imagegen，Terra審核；優先沿既有素材。不得為「更漂亮」無據新增整套素材，prompt／原稿／來源留repo。

## 8. 最終交付與停止標準

1. B01安全恢復、B02同源互動、B03／B04狀態資訊及圖示減量已實作；無未解本期P0，P1逐項列完成或具體未完成，不偷改範圍。
2. 直接相關focused、typecheck、build與官方ZIP有實際結果；失敗／略過照實。沒有save格式／玩法數值／內容表變更，canonical／format5與原件保留。
3. 新版本source／dist／ZIP相符，舊候選保留。分別標 `SOURCE_DELIVERED`、`ZIP_VALIDATED`、`BASE_EXPERIENCE_LOCAL_ACCEPTED`或`LOCAL_ACCEPTANCE_PARTIAL`；本期局部接受不改寫Plan16全部通過。
4. Terra短段證據、raw、ownership、cleanup可追溯；未測分支明列，不用unit／mock／console0冒充真操作。
5. 正式平台／真帳號雲端／原生全螢幕或沉浸、實際音訊、原預警精確時序、灰畫面原因、舊q09／q10未重演邊界保留，不宣稱整體CANDIDATE_READY／PLATFORM_RELEASED。
6. 主代理更新status、plan README及current-handoff，寫 `plan/reports/base-experience-handoff.md`：改了甚麼／玩家前後行為／來源候選／實際檢查／未驗／回退／資源清理。
7. 沒有新授權不commit／push／tag／Release／平台確認／上架。完成本份計畫後停止，不另開優化計畫或續排程。

## 9. 本規劃輪實際工作

已完整網路讀模板與七份main文件，來源及適用要求詳[證據檔](reports/base-experience-plan-evidence.md)。只讀AGENTS、必要plan／report／source、git status；確認無.codegraph後用rg。新增前確認17編號未用。

只新增本文件與證據檔。第一次寫入因用量限制未經自動審核完成而沒有落盤；04:05恢復後重試保存，沒有繞過審核。沒有改遊戲／素材／版本／存檔、派子代理、啟動browser／service、跑遊戲tests／typecheck／content／build／pack，沒有commit／push／發布。文件檢查以交付回報的實際結果為準。
