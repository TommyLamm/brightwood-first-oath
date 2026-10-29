# 44・基礎體驗：背包分類導覽

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan43交接](reports/plan43-handoff.md)已完成，唯一現況見[status](status.md#current-state)。

背包只有目前分類的組數，其他分類須切換才知道是否有物品；重按目前分類還會清掉選取詳情。本批補分類組數及相同分類no-op，維持原順序／實際bagIndex、背包資料與所有動作政策。

## W01・全新Luna Max純分類選取

只新增src/ui/inventory-entries.ts、tests/inventory-entries.test.ts及plan/reports/plan44-inventory-entries.md。INVENTORY_FILTERS為readonly五項all／equipment／consumable／material／quest，原中文label「全部／裝備／消耗品／材料／任務物品」，匯出InventoryFilter union。

selectInventoryEntries(bag:readonly BagStack[],items:RulesCatalog['items'],filter:InventoryFilter):InventoryEntry[]。entry為{stack:BagStack,bagIndex:number,item:ItemDef|undefined}，先原bag map再原分類filter；all包含缺資料項，equipment只weapon/body/hat，其餘kind精確相同。保持原bagIndex、bag順序及stack/item原參照，回傳新array，不排序／合併／過濾數量／改輸入／呼domain／讀player／設定selection。這是原builder既有判斷的單一來源。

單次新檔約5 focused groups：all原順序／原index與重複item分組；三種gear及其他kind排除；三獨立非gear分類；空bag及缺catalog只在all；全部cases核bag/items不變與回傳新array及原參照。小型明確fixtures，不引game boot。不改index／domain／app／content／其他tests；只一次指定Node24.22.1新檔vitest，原命令輸出exit存tmp，不另tsc。

## W02・全新Luna Max單一UI owner

root審W01後，只寫src/ui/index.ts的imports、inventoryFilter宣告與PanelBuildState型別、inventory-filter handler及buildInventoryPanel原分類／filtered區，新plan/reports/plan44-ui-integration.md。

inventoryFilter以InventoryFilter default all；categories沿INVENTORY_FILTERS，不另重複分類判斷。各原chip label變「分類（N）」：N=同helper該分類的entry數，不是quantity總和，零亦顯示；加aria-label「背包分類：分類，N 組物品」。原kind／focus data、class／aria-pressed與排序不變。原filtered改同helper當前filter；原categoryLabel、note、32格grid／empty／selected及所有item詳情動作保持原樣。

handler先INVENTORY_FILTERS.find白名單，未知或等於目前filter直接return，不清選取／不render／不dispatch。不同有效分類才改filter、沿原selectedBagIndex=null與renderPanel(view,true)，不改sellQuantities或bagStateMessage。保留signature／state pass-through與reconcileBagViewState等既有機制；不要CSS／timer／save／app／domain／新命令或其他導航改動。

只一次指定Node24.22.1 tsc，root審局部diff與索引／同分類guard；不重跑W01 tests／既有bag tests／DOM／browser。真click／focus／reader／layout未驗。

## W03・全新Luna Max候選及主代理收束

W02審後選高於beta50未用版本，新三metadata版本、新artifacts/plan44-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp及plan/reports/plan44-candidate.md。指定Node24.22.1／Python311完整路徑，一次build／固定tools1.2.0 pack／完整ZIP／有限audit，逐步存完整命令輸出exit，成功不重跑。Plan43 audit原檔唯讀複製新副本，AST／Path元件核resolvedpaths；metadata用Python，不重現PS空key。有限scan／binary未掃如實。不tests／tsc／browser／server／git寫入。

root更新本Plan、[交接](reports/plan44-handoff.md)、status及README，一次文件引用檢查；完成後再開下一明確基礎體驗Plan。

root本批完整網讀Playroom範本、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs151–154，尾段完整無失敗）。保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0、相對資源與iframe契約。根無.codegraph，dirty／HEAD a20f4ac／真資料／profiles／舊成品保全。不commit／push／tag／Release／發布／新增排程，不例行重試0x6D。02:40／07:50兩排程皆已觸發刪除。
