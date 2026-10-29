# 42・基礎體驗：批次出售騰出格數

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan41交接](reports/plan41-handoff.md)已完成，唯一現況見[status](status.md#current-state)。

商店有目前背包用量與批次出售預計收入，但沒有出售後可騰出格數。root核previewMaterialSale：每個action出售原整組數量、逆序獨立domain模擬，只有成功才增加expectedSoldStacks；domain sell整組成功恰刪一格。因此可直接以目前bag.length減此既有結果呈現，不能用candidateStacks推估，金幣上限部分成交亦適用。

## W01・全新Luna Max單一UI owner

只寫src/ui/index.ts的buildShopPanel既有批次素材出售區及新plan/reports/plan42-capacity-ui.md。原批次按鈕append之後、原部分成交說明之前，在expectedSoldStacks>0時追加一個p.ms-panel-note：「出售後預覽：背包已用 N／32 → M／32 格；騰出 K 格。」N=player.bag.length，K=materialSalePreview.expectedSoldStacks，M=N-K，三者formatNumber。零成功不顯示此行。

沿用既有一次previewMaterialSale；不新增helper／resolver／預覽player，不改button label/title/data/disabled、部分成交／拒絕原因、逐筆row、選取／數量、出售順序、handler／dispatch／domain／content／state／signature／CSS／timer／存檔。不做「已成功出售」宣稱，只標預覽。

只一次指定Node24.22.1 tsc --noEmit，root審單一局部diff；純呈現不新增tests／DOM／browser，不重跑既有material-sale tests。真click／focus／layout／reader及平台未驗。

## W02・全新Luna Max候選

W01審後用高於beta48未用版本與新目錄；三metadata版本、新artifacts/plan42-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp及plan/reports/plan42-candidate.md。指定Node24.22.1／Python311完整路徑，一次build／固定tools1.2.0 pack／完整ZIP／有限audit，每步即存原命令輸出exit；成功不重跑。Plan41 audit原檔唯讀複製新副本，以AST／Path元件核resolvedpaths，不改舊候選。六metadata／SHA／counts／有限8規則與binary未掃界線如實列。不tests／tsc／browser／server／git寫入。

## W03・主代理收束

本Plan、[交接](reports/plan42-handoff.md)、status及README更新，一次文件引用檢查，完成後才開下一個明確基礎體驗Plan。

本批完整網讀Playroom範本、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs143–146，尾段完整無失敗）。保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0、相對資源與iframe契約。根無.codegraph；dirty／HEAD a20f4ac／資料／profiles／舊成品保全。不commit／push／tag／Release／發布／新增排程，不例行重試0x6D。02:40已刪除，07:50保留。
