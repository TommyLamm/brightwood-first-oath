# 32・基礎體驗：商店購買貨品分類

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**（2026-10-29 02:40續作收束）。在[Plan31交接](reports/plan31-handoff.md)後依使用者持續指令開始。唯一現況見[status](status.md#current-state)，指定[兩次續作排程](reports/continuation-schedule-20261029.md)保留。

## 已確認來源與目標

主代理讀[UI](../src/ui/index.ts)buildShopPanel：所有可購買貨品同放一個長grid，無分類；背包已有ms-category-bar／ms-chip分類樣式及aria-pressed模式，可沿用。現有offers為buyPrice>0且kind非quest，再依consumable／weapon／body／hat順序、minLevel、buyPrice排序。shopKindOrder僅此排序使用，其他kind排最後。本批保持「全部」結果完全相同，新增藥水與裝備分類以便補貨。

分類僅為UI lifetime中的獨立狀態，初始all；切換或關閉重開可沿此UI狀態，無SaveData／localStorage欄位。不共用inventoryFilter，不清shopQuantities／sellQuantities或改bagIndex，出售清單及素材批售一律原樣。

## 純貨品選取契約

新增src/ui/shop-offers.ts：

- `SHOP_FILTERS` readonly常數，依序 `{id:'all',label:'全部'}`、`{id:'consumable',label:'藥水'}`、`{id:'equipment',label:'裝備'}`，匯出ShopFilter union。
- `selectShopOffers(items: Readonly<RulesCatalog['items']>, filter: ShopFilter): ItemDef[]`：Object.values新陣列，保留原buyPrice>0且kind!==quest，再沿原shopKindOrder（unknown kind使用原indexOf>>>0）、minLevel／buyPrice排序；類別all不再排除任何原本可買物品，consumable僅消耗品，equipment僅weapon／body／hat。等價比較器與同值時原插入順序保留。不按等級、金幣、已擁有或可否穿戴隱藏貨品。
- 只回物品參照的新陣列，不修改catalog／items、不派命令、不計價、不呼交易preview。不新增價格或可買政策。unknown filter不在typed API範圍，UI handler必須先白名單確認。

## UI精確接線

1. index.ts import常數／helper／type；UiAction加shop-filter；createUi新增獨立`let shopFilter: ShopFilter = 'all'`，renderPanel signature、PanelBuildState及傳入state各加此欄。只UI狀態，不加clearTransient reset，不改inventory狀態。
2. handler新增shop-filter：以SHOP_FILTERS.find比對dataset.kind，未知即return，已知才更新shopFilter並renderPanel(view,true)。不dispatch、不清數量／selection、不自訂focus策略，沿原preserveFocus。
3. buildShopPanel以selectShopOffers取代原offers filter／sort；移除已無引用的舊UI shopKindOrder，不留兩份排序。原每張卡、Plan31比較、數量／價格／preview／購買及所有出售區塊不改。
4. 原「商店貨品」標題後、grid前加入categoryBar，沿ms-category-bar／ms-chip+is-active、role=group、aria-label=商店貨品分類；三鈕原常數label、action shop-filter、data.kind、focus=`shop-filter-<id>`、aria-pressed=String(state.shopFilter===id)。不使用tablist或增加鍵盤系統。
5. bar後一個ms-panel-note，顯示`目前分類「label」共 N 件貨品。只篩選購買貨品，出售清單維持全部。`，N為offers.length；grid前offers空時另以ms-empty-state顯示「目前分類沒有可購買貨品。」。不聲稱背包空／沒有出售物品。原grid及出售section順序保持。無新CSS／素材／dependencies。

主代理本新批次完整網讀Playroom範本與game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning、save-compatibility，截斷尾段補讀無失敗。適用固定ID／相對資源／iframe／存檔相容／新候選；保留brightwood-first-oath／TommyLamm／desktop／四區18圖／Lv30／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0。基線beta38、HEAD a20f4ac與共享dirty／舊成品／真資料／profiles保全。根無.codegraph，目標式讀檔。

## 清楚分工與最小驗收

主代理保存UI基線、逐包審閱與唯一現況。實作／修復全新gpt-6-luna／max／fork none；W01→審閱→W02→審閱→W03，不派多人同改UI。

### W01・純選取與focused（Luna A）

唯一可寫新src/ui/shop-offers.ts、新tests/shop-offers.test.ts、新plan/reports/plan32-shop-offers.md。最多五組：all保持原eligibility（含正價material／排除正價quest及非正價）；完整kind→level→price及同值穩定順序；藥水只consumable且保排序；裝備含weapon/body/hat不含其他；空結果與所有filter輸入不變／陣列獨立。小型fixture即可，不boot遊戲。

新test檔只一次，修單例只重跑該例，不跑舊suite／tsc／browser／build。回報實際命令與exit，交root讀helper與cases。

### W02・分類UI（全新Luna B）

唯一可寫index.ts上述import／UiAction／UI狀態／signature／state／handler／buildShopPanel分類區及移除舊shopKindOrder，新plan/reports/plan32-ui-integration.md。所有交易卡／出售區／helpers／CSS／tests／app／domain唯讀。只一次tsc，無tests／DOM／browser／build。核切filter不改數量maps或bagselection，不改原onclick／blur規則。

### W03・新候選（全新Luna C）

UI審閱後指定高於beta38未用版本／目錄，不預占beta39。只改package／lock根版本、public manifest版本、新候選／本批tmp logs、新plan/reports/plan32-candidate.md。一次Node24.22.1系build／固定pack／完整ZIP validate／前批audit路徑版本副本，**執行audit前核artifact及tmp都指本批**，避免漏改路徑。source／dist SHA清單、六處metadata、ZIP識別、有限文字scan／未掃範圍如實列出；舊成品不覆寫，不重跑focused／tsc，不browser／server／gitwrite／發布或額外排程。

### W04・主代理交接

新plan/reports/plan32-handoff.md，更新Plan／status／README；核all等價原篩選排序、白名單及獨立UI state、原卡／交易／出售未變，一次本批文件引用檢查。focused／一次tsc／新完整ZIP驗證過完成source／ZIP交付。真切類別／焦點／數量草稿／click／layout列未驗，不例行重試0x6D，不以模型或封包結果代替。完成本批後再開下一批。
