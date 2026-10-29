# 22・基礎體驗：領取任務獎勵前的拒絕原因

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。共用領獎計算、app／NPC按鈕接線與beta29已交付，見[實作交接](reports/plan22-handoff.md)。依使用者「持續建立新Plan並實作，直到我讓你停下」，[Plan21已交付](reports/plan21-handoff.md)後完成本批，現在可規劃並實作下一批。唯一現況見 [status](status.md#current-state)，來源見[規劃證據](reports/plan22-planning-evidence.md)。

## 1. 目標與基線

NPC對話中的「領取任務獎勵」目前只依任務ready顯示；真正執行還可能因背包無空間或金幣超限而拒絕。本批在按鈕前顯示同源原因並停用不可領取的操作，點擊時使用最新view重判。正常領獎仍派原claimQuest命令，由app正式執行與保存。

基線beta28／作者TommyLamm／ID brightwood-first-oath／desktop，四區18圖與Lv30、讀1–5寫5、SDK1.1.0／protocol1／schema2／固定tools1.2.0保留。HEAD a20f4ac，Plan19–21的共享dirty與所有舊候選、玩家存檔、QA profiles不還原、不覆寫。前批6 focused／tsc／build／pack／完整ZIP validate已過，不為本Plan重跑。

## 2. 固定語義與排除

原領獎計算順序必須維持：`planQuestClaim` → `removeItems` → 可選 `setLevelFloor` → 可選 `changeJob` → `gainReward`（清除minLevel／job欄位）。只在全部成功時採用最後player及nextQuests；失敗保留原player／quests／flags。不可僅以bag.length32拒絕：交付整組物品可能先騰出空位，獎勵也可能合併進既有stack。

不改獎勵、交付物、等級／轉職條件、任務完成條件、存檔格式、背包容量、金幣上限或SDK。q08的chapter畫面、旗標、升級特效、獎勵toast、interaction refresh、NPC距離gate均留在app原位。沒有自動丟物品、延後獎勵、部分領取、重送／自動領獎或領獎確認視窗。

不改交易、藥水、技能、地圖、任務內容、全域focus／panel signature。既有panel signature含完整saveData及questViews／interaction，本批不另建刷新框架。UI預覽只判資料計算，不證距離、生命狀態、命令執行時queue或保存成功；原app仍為權威。

## 3. 共用計算契約

新增純 `src/domain/quests/claim.ts`，直接輸出：

`resolveQuestClaim(data: SaveData, questId: Id, catalog: ContentCatalog): Result<ResolvedQuestClaim>`

`ResolvedQuestClaim`包含 `{player: PlayerProgress, nextQuests: QuestClaimPlan['nextQuests'], reward: QuestClaimPlan['reward']}`。只將原app計算鏈移至此函式，使用原domain Result與錯誤順序，不自寫容量／金幣公式。保留原 `planQuestClaim` 公開API；新claim模組可import index，但index不反向re-export新模組，避免循環依賴。app與UI直接import claim.js。

app保留原quest查找及nearNpc檢查，通過後調新函式；成功才使用result.value.player／nextQuests，reward供原toast使用。副作用與最後saveData／flags提交保持原樣。UI呼叫同函式時只取ok／code／message，丟棄成功value，不存預覽player、不更新任務或保存。

NPC對話中ready卡片的按鈕使用 `disabled: !result.ok`，失敗有title及可見 `.ms-disabled-reason`，沿用原focus data與「領取任務獎勵」標籤；原獎勵文字不變。claim-quest點擊取得最新saveData／questId，重新計算，可用才派原命令。不存在或已領／不再ready時安全拒絕，不以先前render結果dispatch。接取任務與其他對話動作不改。

## 4. 明確工作包

主代理負責契約、審閱與文件，實作／修復全新 `gpt-6-luna`／`max`／`fork none`；browser僅條件成立的一名 `gpt-6.1-terra`／`max`／`fork none`。主代理加最多三名活動子代理。W01→W02→W03有依賴，不讓多名代理同改UI或app。

### W00・主代理

讀根AGENTS及最新八份線上文件、status／交接，確認新路徑無碰撞並保留UI／app局部diff基線。先鎖本契約，再派W01；本批完成交接後才開下一個Plan。

### W01・共用領獎計算及app接線（Luna A）

唯一可寫：新 `src/domain/quests/claim.ts`、`src/app/gameplay.ts`（只claimQuest分支及import）、新 `tests/quest-claim.test.ts`、新 `plan/reports/plan22-quest-claim.md`。UI、原quests index、progression、既有tests與contracts唯讀。若需要跨此範圍改契約，先回主代理。

純helper最多七組focused：正常領獎與不變性；滿包且交付後仍無空間拒絕並保留物品／任務；滿包但交付整組騰位成功；滿包但獎勵可合併成功；金幣恰好到上限／超限；等級下限→轉職→獎勵順序；未知／未完成／已領任務安全拒絕。使用合法小fixture或既有catalog資料，成功／失敗均檢查輸入data與catalog不變。不新增真存檔或全遊戲mock。

只跑新test檔一次；app改接線後另跑既有 `tests/integration/app-gameplay.test.ts` 的三個相關案例（用 `-t` 精確選名）：`keeps quest items and quest state when a full bag cannot accept the reward`、`summarises the reward in a toast when a quest is claimed`、`auto-collects guardian boss drops on death so q08 and chapterComplete can be claimed`。不跑整個大integration檔或全suite；失敗只修本包及相關重跑。三例不能證全部任務通關，報告實際選取數量。

### W02・NPC對話UI接線（全新Luna B）

依賴W01交付及主代理審閱。唯一可寫：`src/ui/index.ts`（新import、claim-quest分支、buildDialoguePanel ready卡片）、必要局部 `src/ui/styles.css`、新 `plan/reports/plan22-ui-integration.md`。helper／app／domain／tests唯讀。

落實§3，維持dialogue focus標記與其他動作。UI只丟棄預覽成功value，不直接套player。現有reason樣式優先，不需要就不改CSS。只跑一次typecheck；W01已過focused不重跑，不新增鏡像DOM測試，不開browser或build。

### W03・新候選（全新Luna C）

W02審閱後由主代理指定高於beta28且未使用的新版本／新目錄，本Plan不預占beta29。唯一可改package／lock根版本、public manifest版本，新候選及 `plan/reports/plan22-candidate.md`；作者／ID／desktop／cloudSave與固定工具不變。

Node24.22.1+且24系，一次build、固定tools1.2.0 pack、完整ZIP validate。保存source／dist清單與ZIP hash、metadata一致性、logs及有限文字掃描／未掃範圍；沿用上批簡單流程，不新增框架、不重掃舊候選，不重跑已過tests／tsc。未發布、不commit／push／tag。

### W04・有條件局部browser（唯一Terra）

只有具體可用新環境，或使用者明確要求有界環境對照，才按 [lifecycle](../tools/qa/browser-lifecycle.md) 和 [run record](../tools/qa/templates/run-record.md) 開新run／profile／自有ports及跨來源子目錄iframe；既有0x6D不例行重試。不滿足則標BROWSER_UNVERIFIED並交付source／候選。

可執行時只驗滿包拒絕卡及交付騰位後可領各一段，核一次before／after raw及正常單擊，必要時補640×360最擁擠對話一張。合成前置另派Luna明確fixture／validator／provenance包，空canonical guard；保全真資料。圖片／logs存工作區、審圖依根AGENTS縮圖規則，只清理可核owner的自有資源，不重刷所有舊任務。

### W05・主代理交接

新 `plan/reports/plan22-handoff.md`、本Plan完成狀態、status唯一現況及README入口；核對app副作用未移、UI未採用player，列實際檢查／候選／未驗。只查本輪文件引用。收束後依使用者持續指令規劃並實作下一批。

## 5. 最小完成條件

W01新focused及精選三個app案例、W02一次tsc、W03一次build／pack／完整ZIP驗證通過，主代理對照局部diff確認原順序／副作用與其他流程保留。W04依條件執行；未驗不標CANDIDATE_READY或平台通過。不重跑Plan21或更早已過檢查，不發布、不建立排程。失敗先判是否相關，不以環境問題擴大排障。
