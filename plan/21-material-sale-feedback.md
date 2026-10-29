# 21・基礎體驗：批次素材出售的預期結果

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。批次素材出售預覽、商店接線及beta28新候選已完成，見[實作交接](reports/plan21-handoff.md)。使用者已要求「持續建立新Plan並實作，直到我讓你停下」，本批交接後接續下一個Plan。[Plan20交接](reports/plan20-handoff.md)及其browser未驗界線保留。下文「本次只有規劃」等描述為原規劃階段邊界，已由後續實作指令接續。

唯一現況為 [status](status.md#current-state)，本Plan的程式證據與取捨見[規劃證據](reports/plan21-planning-evidence.md)。

## 1. 目標與基線

讓商店「出售全部素材」在按下之前，說明既有逐組出售流程預計可以成交多少組、取得多少金幣，以及哪些結果會被拒絕。尤其接近金幣上限時，不再把所有素材的標價總和呈現為預期收入。

基線為 `brightwood-first-oath`／`1.0.0-beta.27`、作者 `TommyLamm`、desktop、四區18圖、Lv30、讀存檔格式1–5／寫5。SDK1.1.0／protocol1／schema2、固定Playroom tools1.2.0不變。[beta27候選與檢查](reports/plan20-candidate.md)保留；HEAD仍為 `a20f4ac`，工作區Plan19／20的未提交增量不得還原或覆寫。

Plan20兩model共11項focused、UI typecheck及beta27 build／pack／完整ZIP validate是前批已過結果，本Plan不為規劃重跑。browser仍未驗；相同環境已知crashpad 0x6D，不把換profile當成新環境。

## 2. 固定的行為界線

- 篩選只收既有 `kind === 'material' && sellPrice > 0` 的背包stack；同itemId的不同stack分開計算。「組」指stack，不是不同物品種類。
- 使用原背包index由高到低，每組出售整個 `stack.quantity`。某組失敗，保留該次之前的模擬狀態並繼續較低index；成功才接續domain回傳的player。不排序、不截斷數量、不改金幣上限或價格。
- 預覽只在函式內持有模擬player，不把它回傳、存進UI或當成實際交易結果。真正交易仍由原sell命令及app的商人距離檢查執行。
- 部分能成交時保持按鈕可用；點擊仍派出原候選的全部sell命令，包括預覽失敗的組，不引入新的跳過政策、原子交易或遇錯中止。
- 全部不能成交時，按鈕停用並顯示原因。點擊防線使用最新view重新預覽，拒絕時不清出售草稿。這項前置回饋不保證queued命令執行時狀態仍相同。
- 無素材時保留原本不顯示批次鈕的行為；純model仍需安全回傳空結果。非商人時優先顯示既有商人前置原因，不宣稱可立即交易。

排除：單筆買賣／裝卸重寫、經濟平衡、素材用途、任務／技能／藥水、資料遷移、批次確認視窗、撤銷、排序搜尋、全域focus或panel signature重構。既有數量草稿、背包reconciliation與鍵盤修整保留。不新增套件／測試框架。

## 3. 預覽與UI契約

新增 `src/ui/material-sale-preview.ts`，公開純收集器 `collectMaterialSaleActions(player, rules)` 及 `previewMaterialSale({player, rules, atMerchant})`。

收集器回傳readonly `{bagIndex, quantity}` 列表，按§2的原篩選與由高至低順序。model與真正UI dispatch都使用它；數量來自當前snapshot，不引用上次render或跨角色快取。

預覽固定回傳 `actions`、`candidateStacks`、`nominalProceeds`、`expectedSoldStacks`、`expectedRejectedStacks`、`expectedProceeds`、`disabled`、`reason`與`code`。`code` 為原ErrorCode或 `NOT_AT_MERCHANT`／`NO_MATERIALS`／null；不暴露成功的player。非商人原因優先，成交組數／收入為0，拒絕組數為候選組數；商人但空候選回NO_MATERIALS、各計數與收入為0。全部成功時reason／code為null；部分／全部domain拒絕時，保留第一個錯誤，即使disabled為false仍可顯示原因。W01交付型別後，W02直接使用，不自行猜測不同欄位。

商人狀態下逐一調用原 `applyProgressAction(...,{type:'sell',...action},rules)`：成功採用回傳狀態繼續模擬、累計成交；失敗保留狀態並記錄第一個domain code/message、繼續下一組。expectedProceeds取最終模擬coins減原coins；nominalProceeds才是素材標價總和。不得使用「總價加金幣是否超限」一條算式取代逐組結果，也不從單筆 `previewSale` 猜出下一個player。

UI使用同一預覽顯示：

| 預覽 | 顯示／操作 |
| --- | --- |
| 全部可成交 | 保留「出售全部素材」語意，標示預期收入。 |
| 部分可成交 | 用「依序出售素材（預計 +N 金幣）」等無全售保證的文字；可見說明「預計成交 X／Y 組」，附第一個拒絕原因，按鈕可用。 |
| 零可成交 | 停用，顯示第一個拒絕原因；收入不得用素材標價冒充。 |
| 非商人 | 停用，商人原因優先；保留既有前置政策。 |

原因需可見，不能只藏title；沿用現有reason樣式及flex-wrap。點擊重算後若可用，就遍歷收集器的完整action列表，維持原 `sellQuantities.delete(bagIndex)` 和逐筆dispatch；不僅派出模擬成功者。preview只依player／rules及互動旗標推導，不含距離資料，也不是「已售出」或「已保存」證據；即使同一view仍可能被runtime距離gate拒絕。實際app執行亦可能受先前排隊命令或死亡影響，原檢查仍為權威。

## 4. 明確工作包與所有權

主代理負責契約、順序、審閱及唯一全局狀態。所有實作／修復使用全新 `gpt-6-luna`／`max`／`fork none`；真正browser／圖審僅唯一 `gpt-6.1-terra`／`max`／`fork none`。主代理加最多三名活動子代理。本批有依賴，按下列順序派工，不為並行讓多名代理同改UI。

### W00・主代理鎖基線

開工重讀根AGENTS與當時最新線上規格，確認status、dirty、helper路徑是否碰撞及版本；不覆寫beta27。將§2–3交給W01，先鎖契約，再派W02。不得給Luna「自行找地方優化」等不明確任務。

### W01・純預覽模型（Luna A）

唯一可寫：新 `src/ui/material-sale-preview.ts`、新 `tests/material-sale-preview.test.ts`、新 `plan/reports/plan21-material-sale-preview.md`。domain、app、其他helper及UI唯讀。先查路徑不存在；若已存在交主代理判定，不覆寫。

交付§3 API及最多六組focused案例：

1. 空候選／只有非素材或零售價物品，列表為空、不改player。
2. 非商人且domain也可能拒絕時，商人前置原因優先。
3. 混合背包與同物品多stack：只取正售價素材、高index先、整組數量，正常總收入正確。
4. 多組累計恰好到上限全部成功；各組單獨可售但累計超限時部分成交。
5. 高index整組超限失敗，低index小組仍可成功；不能遇錯break或自動拆高index那組。
6. 所有候選均超限：零成交、完整拒絕原因及code。

各情境對輸入player／rules做不變核對；成功及失敗路徑與原domain逐筆結果一致。用合法小fixture，不開遊戲／生成存檔。只跑新test檔；報告API、實際命令與結果。需要改domain或交易政策時先回主代理，不擴包。

### W02・商店UI接線（全新Luna B，依賴W01）

唯一可寫：`src/ui/index.ts`、必要時局部 `src/ui/styles.css`、新 `plan/reports/plan21-ui-integration.md`。已確認既有CSS路徑；沒有必要不改樣式。helper、domain與app唯讀。

只改 `sell-materials` 點擊分支及 `buildShopPanel` 的批次素材區：同源顯示／停用／原因，點擊最新view重判後派完整候選action。保留單筆買賣／裝卸、input／change、草稿／focus、重綁及其他panel原流程。沒有必要不改CSS。一次typecheck；不重跑未改helper，不加鏡像DOM測試、不啟動browser。

### W03・新候選（全新Luna C，依賴W02審閱）

唯一可寫：package.json版本、package-lock兩處根版本、public/game.json版本、新候選目錄與新 `plan/reports/plan21-candidate.md`。主代理實作定案後指定高於beta27且未使用的版本與路徑；本Plan不預占beta28。作者TommyLamm、ID／desktop／cloudSave不變。

使用Node24.22.1+且24系，一次build、固定tools1.2.0 pack、完整ZIP validate。記錄source／dist／ZIP識別、metadata一致性、logs與有限文字掃描範圍；不新增fingerprint框架、不覆寫舊候選。source再變才重做相關檢查。

### W04・條件式局部QA（唯一Terra）

只有具體可用的新執行上下文，或使用者明確要求有界環境對照，才啟動；相同0x6D不反覆換profile重試。條件不成立則交付source／候選，標browser未驗，不以此延伸成完整舊任務回歸。

條件成立時按 [browser lifecycle](../tools/qa/browser-lifecycle.md) 與 [run record](../tools/qa/templates/run-record.md)，新run／隔離profile／自有loopback ports、子目錄跨來源sandbox iframe。只驗商店正常全售及接近上限「高index失敗、低index成功」兩段：按鈕／原因與一擊後raw相符；必要時640×360一張最擁擠面板，不做尺寸矩陣。合成前置需另給Luna明確fixture包、validator接受、provenance、空canonical guard；不能改真玩家存檔或以合成冒充通關。

實際路線／焦點／可讀性與model驗證分開記；圖片與長log存工作區，審圖依根AGENTS縮圖要求。環境啟動一次同錯即停，只清理可確認owner的自有資源，保留profiles／raw。不根據歷史PID關程序。

### W05・主代理收束

新 `plan/reports/plan21-handoff.md`，更新本Plan狀態、status唯一入口與README索引。逐項列實作、實際檢查、候選及未驗界線；只做本輪文件引用檢查，不掃全歷史。完成本Plan後才規劃下一批，不把下一批規劃與本批未完工作混在一起。

## 5. 最小驗收與交付界線

開發完成條件：W01相關focused、W02一次typecheck、W03一次build／pack／完整ZIP validate，以及主代理確認失敗後繼續、完整候選dispatch與其餘流程未改。W04依前提決定執行；未執行保持BROWSER_UNVERIFIED，不標CANDIDATE_READY或正式平台通過。

本次只有規劃，不執行以上開發檢查、不升版、不build／pack、不開browser、不commit／push／tag／Release或發布。回退僅針對本包可辨認增量，保全原dirty、玩家存檔、QA資料及所有凍結候選。
