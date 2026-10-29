# 31・基礎體驗：購買前比較目前裝備

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan30交接](reports/plan30-handoff.md)後完成商店比較及beta38，見[本批交接](reports/plan31-handoff.md)。另有使用者指定的[兩個10月29日續作排程](reports/continuation-schedule-20261029.md)，不取代目前持續指令。唯一現況見[status](status.md#current-state)。

## 已確認來源與目標

主代理讀[UI](../src/ui/index.ts)buildInventoryPanel：wearable detail已將attack／defense／hpBonus與目前同slot裝備比較，顯示對比名稱、正／負差異及能力相同。buildShopPanel的裝備貨品只顯示需求／已擁有／物品能力與價格，購買前無同欄比較。本批把**原背包比較呈現**抽成共用小renderer，商店裝備卡重用，不新增評分或推薦購買政策。

既有[CSS](../src/ui/styles.css)的ms-compare／up／down可沿用，商店卡為自然流動grid、未設固定高度。renderPanel signature已有saveData，裝備改變可沿原重建，不需增加signature或每幀計算。這是文字與簡單layout增量，未實測商店畫面。

## 精確契約

1. index.ts新增一個局部檔案renderer `makeEquipmentComparison(document, view, player, item): HTMLElement | null`，使用既有UiSnapshot衍生型別。item沒有slot即return null；否則將原inventory比較區塊（currentId／current查表、p class ms-compare、對比名稱或空欄、攻擊／防禦／最大HP固定順序、delta忽略0、up／down class與▲／▼絕對值、分隔符・、全0能力相同）**原樣搬入**，最後return compare。只生成新DOM，不改資料、呼domain、派命令或重新定義屬性公式。
2. buildInventoryPanel的if(item?.slot)內原比較區塊改呼此renderer並append非null結果到原位置。原equipmentPreview／裝備按鈕／理由及全部details其他內容保持原樣，背包文字／class／順序不變。
3. buildShopPanel每個offer在原card.append（圖示／badges／h4／details／單價）之後、數量列之前，只有item.slot truthy時呼renderer一次並append非null結果。消耗品／素材／任務物品不新增比較行。原等級需求、owned badge、價格／總額、預覽、數量／購買按鈕／原因、action／data／focus／順序保持。
4. 原比較僅為物品本身相對同欄裝備差異，不改成角色總能力／臨時buff／可裝備承諾；不改isWearableUpgrade、裝備需求、交易／庫存政策、domain／app／存檔。不得增helper module、model、tests、CSS、素材、套件、tooltip、aria或其他功能。必要註解可說明共享呈現。

主代理本新批次完整網讀Playroom範本與game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning、save-compatibility；尾段補讀無失敗。適用固定ID／相對資源／iframe／存檔相容／新候選；保留brightwood-first-oath／TommyLamm／desktop／四區18圖／Lv30／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0。基線beta37、HEAD a20f4ac及共享dirty／舊候選／真資料／profiles保全。根無.codegraph，目標式讀檔。

## 明確工作包與最小驗收

主代理保存UI基線、審閱與唯一現況。實作／修復全新gpt-6-luna／max／fork none；先W01審閱，再W02新候選。

### W01・共用呈現與商店接線（Luna A）

唯一可寫src/ui/index.ts的上述renderer、inventory原比較區與shop offer單一插入，新plan/reports/plan31-shop-comparison-ui.md。其他函式／handlers／helpers／CSS／tests／app／domain／metadata唯讀。只一次tsc，不新增／執行tests、DOM／browser／截圖或build。這是搬移既有顯示計算及簡單文字layout，無新的玩法邏輯，不寫鏡像測試。報告實際diff／命令exit及未驗。

### W02・新候選（全新Luna B）

W01審閱後指定高於beta37且未用的新版本／目錄，不預占beta38。只改package／lock根版本、public manifest版本、本批新候選／tmp logs、新plan/reports/plan31-candidate.md。一次Node24.22.1系build／固定pack／完整ZIP validate／前批audit路徑版本副本，記source／dist清單hash、六處metadata一致、ZIP識別、有限文字scan／未掃範圍。舊成品不覆寫，不重跑tsc，不tests／browser／server／gitwrite／發布或額外排程。

### W03・主代理交接

新plan/reports/plan31-handoff.md，更新Plan／status／README；審renderer逐行沿用原文字與差值，inventory替換無其他增量，shop只在wearable有一行比較，不改購買。一次本批文件引用檢查（含新排程紀錄入口）；一次tsc及新候選完整ZIP驗證過完成source／ZIP交付。真商店比較布局／click／focus／讀屏未驗，不以建置或靜態審閱代替。不重試0x6D，完成本批後再開下一批。
