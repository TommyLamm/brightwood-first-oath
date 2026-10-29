# 25・基礎體驗：背包藥水的使用前回饋

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。共用判定、背包回饋與beta32完成，見[實作交接](reports/plan25-handoff.md)。依使用者持續建立Plan並實作、直到要求停止的指令，在 [Plan24完成交接](reports/plan24-handoff.md)後完成本批，可接續下一批。唯一現況為 [status](status.md#current-state)。

## 1. 目標與靜態證據

背包消耗品的「使用一個」目前一直可按，冷卻或HP／MP已滿要等app／domain拒絕才看見原因。本批把既有判定提供給背包按鈕；成功仍派原useItem命令，真正狀態改變由app執行。

| 來源 | 已確認的行為 |
| --- | --- |
| [gameplay](../src/app/gameplay.ts) useItem 542–560附近 | 先判共用冷卻，再將已用完的小紅／小藍改為有庫存的大紅／大藍；缺消耗品先給補貨訊息，之後才調domain。成功才將potionReadyAtMs設為nowMs+1000。 |
| [progression](../src/domain/progression/index.ts) useItem 431–451附近 | 驗物品／消耗品／死亡及實際恢復效果；HP／MP已滿無效果時安全拒絕，再扣物品與恢復。不需要新滿血政策或第二套公式。 |
| [UI](../src/ui/index.ts) buildInventoryPanel | 消耗品鈕只帶itemId，沒有disabled／可見使用原因。快捷列已有庫存／cooldown顯示，本批不重寫快捷列。 |
| 同檔renderPanel signature／render | signature含saveData，但無potionReadyAtMs或nowMs；每次render仍會調renderPanel。因此若只加disabled，冷卻結束而data未變可能仍顯示舊狀態。需加單一庫存面板冷卻布林依據，不加毫秒倒數。 |
| [state](../src/app/state.ts) createUiSnapshot；[panels](../src/app/panels.ts) isWorldFrozen | snapshot已有nowMs及potionReadyAtMs；背包本身不凍結世界，settings／非playing／失焦沿原freeze。使用原game時間，不另建wall-clock或timer。 |
| [既有app案例](../tests/integration/app-gameplay.test.ts) 1176附近 | 已測小紅耗盡改大紅及藍藥用完補貨訊息；本批改共用接線後只精選這一例。 |

這是靜態回饋缺口，沒有已證實物品遺失。原domain已有不浪費滿HP／MP藥水的拒絕，本批沿用，不改效果／冷卻／替代順序。

基線beta31／作者TommyLamm／ID brightwood-first-oath／desktop、四區18圖／Lv30、讀格式1–5寫5、SDK1.1.0／protocol1／schema2／tools1.2.0保留。HEAD a20f4ac與Plan19–24共享dirty、舊候選／玩家資料／QA profiles不還原、不覆寫。主代理本新批次完整網讀Playroom範本與七份main指定文件，截斷尾段補讀、無失敗；適用固定ID、相對資源、iframe、存檔相容及新候選要求。根無.codegraph，目標式讀檔。

## 2. 共用使用判定

新增純 `src/app/item-use.ts`：

`resolveItemUse({player, rules, requestedItemId, nowMs, potionReadyAtMs}): Result<{player: PlayerProgress, itemId: Id}>`

嚴格提取原app useItem分支的判定次序：

1. nowMs小於期限，回COOLDOWN及原「藥水還在冷卻中。」訊息。
2. 僅requestedItemId為small-red／small-blue且該小藥無正庫存、有對應大藥正庫存時才替代；有小藥優先小藥，直接要求大藥不反向替代。
3. resolved item為消耗品但無正庫存，回NOT_FOUND及原含物品名稱／木葉商人補貨的訊息；此app前置仍先於domain滿HP／MP原因。
4. 調原applyProgressAction useItem，失敗回原code/message；成功回其player及resolved itemId。輸入player／rules不變，不設定冷卻或派命令。

gameplay改用同helper，失敗只沿原toast；成功才採用player並在原位置設定nowMs+1000。冷卻、聲音觸發、命令queue、focus gate及其他app流程不移、不改。不新增validation優先序或SaveData欄位。

## 3. 背包UI接線與刷新

僅selected consumable卡呼叫helper作預覽，成功value丟棄，不採用player／resolved物品到UI狀態。原「使用一個」鈕依ok停用，失敗title及既有ms-disabled-reason文字可見；增加 `data-inventory-use="true"` 標記，其他data及focus策略保留。

use-item click只有此明確標記的背包鈕使用最新view再次判斷，拒絕不派命令；成功仍派原requested itemId，不把預覽player或先前resolvedId當成已消耗。**沒有標記的快捷列／其他來源維持原dispatch路徑**，避免改變既有按鍵／快捷列提示及每幀成本。

renderPanel signature只新增 `potionCooling: panel === 'inventory' && view.nowMs < view.potionReadyAtMs`，沿原render／focus保護重建；布林只在冷卻狀態切換時改變，不把nowMs、remaining秒數或deadline原值加入signature。不新增timer／interval、快照欄位或focus框架。遊戲時間被既有暫停／settings／失焦凍結時仍沿原時間，不承諾wall-clock一秒後必定可用。

不改快捷列、數量草稿、分類、交易、裝卸、領獎、鍵位、冷卻長度、藥效、滿資源政策、死亡規則或其他panel。不是自動喝藥、排隊補喝或更聰明的用藥策略。

## 4. 明確工作包

主代理負責契約、審閱及唯一現況。實作／修復全新 `gpt-6-luna`／`max`／`fork none`，真正browser僅前提成立的一名 `gpt-6.1-terra`／`max`／`fork none`。主代理加最多三名活動子代理；W01→W02→W03依序，不讓多人同改UI或app。

### W00・主代理

確認新helper／test路徑不存在、保存app／UI基線，鎖上述次序與單一marker／signature布林。先交W01，通過審閱才派W02；本批完成交接後才開下一個Plan。

### W01・共用item使用判定及app（Luna A）

唯一可寫：新 `src/app/item-use.ts`、`src/app/gameplay.ts`（useItem分支及import）、新 `tests/item-use.test.ts`、新 `plan/reports/plan25-item-use.md`。其他app、progression、UI、contracts及既有tests唯讀。

最多七組focused：冷卻先於其他拒絕；期限前拒絕／恰到期限可用；有小紅時優先小紅；小紅／小藍耗盡對應大藥替代（可同組兩情境）；直接大藥不反向替代及用完原補貨訊息；滿HP／滿MP／死亡沿domain原拒絕；未知／非消耗品沿domain結果。成功／失敗均核輸入不變，成功只消耗一個正確藥並採原恢復量。

新test檔一次；app改接線後只 `-t` 精選既有 `requires merchant interaction to sell and falls back to large potions when small potions run out` 一例，不跑整個integration或fullsuite。若只修單例期待值，僅重跑該例；不要重跑其餘已過案例。不執行tsc／browser／build，由後包接續。

### W02・背包使用回饋（全新Luna B）

W01交付且審閱後，唯一可寫 `src/ui/index.ts` 的新import、selected consumable使用鈕、use-item分支的marker guard、renderPanel signature單一布林，及新 `plan/reports/plan25-ui-integration.md`。CSS、其他函式與所有helpers／app唯讀。

實作§3；不為快捷列每幀呼叫domain，不擴大signature或改focus。核對使用成功仍原requestedId dispatch、預覽value不採用、無marker舊路徑不改；一次tsc，不重跑W01，不加鏡像DOM測試或啟動browser。

### W03・新候選（全新Luna C）

UI定案後指定高於beta31且未用的新版本／新目錄，不預占beta32。只改package／lock根版本、public manifest版本、新候選與 `plan/reports/plan25-candidate.md`、本批tmp／logs；作者／ID／desktop／cloudSave／SDK／tools不變。

Node24.22.1+且24系，一次build／固定pack／完整ZIP validate；沿用簡單source／dist SHA清單、ZIP識別、metadata核對、8類有限文字掃描／未掃範圍。可複製前批一次性audit改路徑，原檔不改；不造框架／重掃舊候選，不重跑已過focused或tsc，不commit／push／tag／發布。

### W04・條件式局部QA（唯一Terra）

只有具體可用新環境或使用者明確有界對照指令才按 [lifecycle](../tools/qa/browser-lifecycle.md)／[run record](../tools/qa/templates/run-record.md)開新run/profile/ports及跨來源子目錄iframe；相同0x6D不例行重試。否則列browser未驗並交付source／候選。

可執行時只驗背包滿HP拒絕、一次正常消耗與共用冷卻到期再啟用短段，核原始資料確實只消耗一次、未重點擊仍能隨game時間刷新。必要合成前置另派有界Luna fixture／validator／provenance，保全真資料；圖片／logs依根AGENTS保存，僅清自有資源。不得用model／tsc宣稱timed DOM或focus通過。

### W05・主代理交接

新 `plan/reports/plan25-handoff.md`，更新本Plan、status唯一入口與README；局部diff核對原useItem優先序／成功後deadline、marker舊路徑及布林signature範圍。只查本輪文件引用，列實際checks／候選／未驗。收束後依持續指令規劃實作下一批。

## 5. 最小完成條件

新focused及既有精選一例、一次tsc、新候選一次build／固定pack／完整ZIP驗證通過，主代理讀局部diff。W04依條件，真實冷卻到期DOM／focus／版面未驗仍明列。既有Plan21–24或更早檢查不重跑，不發布／建排程，不碰真資料及舊成品。
