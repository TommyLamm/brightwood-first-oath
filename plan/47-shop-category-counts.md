# 47・基礎體驗：商店分類貨品數

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan46交接](reports/plan46-handoff.md)已完成，唯一現況見[status](status.md#current-state)。

背包分類已可直接看見各組數，商店仍須切換才見該類貨品數。本批使分類導覽一致，並避免重按目前商店分類時無用重繪。root核SHOP_FILTERS／selectShopOffers既有正價與非quest、gear／consumable分類及穩定排序；原語義完全沿用，只稱「貨品數」，不代表玩家金幣／空位已允許購買。

## W01・全新Luna Max單一UI owner

只寫src/ui/index.ts的shop-filter handler及buildShopPanel原SHOP_FILTERS迴圈，新增plan/reports/plan47-shop-ui.md。

每分類count=selectShopOffers(view.catalog.rules.items,category.id).length。原chip label變category.label+'（'+count+'）'，加aria-label「商店分類：分類，N 件貨品」。保留原kind／focus、class／aria-pressed與順序，零數亦顯示且仍可切換。當前offers、note／empty／grid／購買及出售皆不變。

handler原白名單find後，只將if(!filter)改if(!filter || filter.id===shopFilter)return；有效不同才沿原set／renderPanel(view,true)。不改shopQuantities／sellQuantities／bag selection、任何其他handler／onInput／onChange／data／signature／state／CSS／timer／helper／domain／排序／資料／存檔，不加live／role／dispatch或購買資格計算。

只一次指定Node24.22.1 tsc --noEmit與root局部diff審閱；純呈現不新增tests／DOM／browser，不重跑未改shop-offers tests。真click／focus／raw數量草稿／reader／layout未驗。

## W02・全新Luna Max候選

W01審後用高於beta53未用版本及新目錄；只三metadata版本、新artifacts/plan47-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp及plan/reports/plan47-candidate.md。一次指定Node24.22.1 build／固定tools1.2.0 pack／完整ZIP／Python311有限audit，逐步完整存命令輸出exit，成功不重跑。

為避近期複雜prepare字串guard摩擦，使用唯讀.playroom/tmp/plan38-candidate-beta45/prepare_candidate.py簡單成功模板，於新副本將plan38→plan47、plan37→plan46、beta45→beta54、beta44→beta53、beta.45→beta.54、beta.44→beta.53六組整體替換（不猜出現次數）；其source audit即唯讀Plan46 beta53，產生新Plan47 beta54副本。依AST／Path元件核resolvedpaths及metadata 1／2／1替換，不連續路徑字串guard；不改模板／舊audit／成品。metadata用Python，建目錄用New-Item -Path。不tests／tsc／browser／server／git寫入，有限scan／binary未掃如實。

## W03・主代理收束

更新本Plan、[交接](reports/plan47-handoff.md)、status及README，一次文件引用檢查；完成後才開下一個明確基礎體驗Plan。

root本批完整網讀Playroom範本、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs173–176，尾段完整無失敗）。保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0、相對資源與iframe契約。根無.codegraph，dirty／HEAD a20f4ac／資料／profiles／舊候選保全。不commit／push／tag／Release／發布／新增排程，不例行重試0x6D。02:40／07:50皆已觸發刪除。
