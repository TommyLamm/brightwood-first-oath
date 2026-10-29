# 45・基礎體驗：交易後金幣預覽

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan44交接](reports/plan44-handoff.md)已完成，唯一現況見[status](status.md#current-state)。

商店有目前金幣與交易總額，但確認前還須自己算餘額。本批將既有成功preview總額呈現為前後金幣；root核domain buy成功直接減total、sell成功在上限檢查後加proceeds，previewBuy／previewSale.total相符；批次expectedProceeds本來就是實際模擬結果的coins差值。只在已成功預覽時做加減顯示，不重算價格／資格／成交政策。

## W01・全新Luna Max單一UI owner

只寫src/ui/index.ts的buildInventoryPanel出售note、buildShopPanel購買／批次素材note／單組出售price span四區，以及新plan/reports/plan45-balance-ui.md。

1. 背包saleNote原文字保留，僅!salePreview.disabled時附「；出售後預覽：金幣 before → after」，after=player.coins+salePreview.total。成功設定saleNote.id='brightwood-first-oath-inventory-sale-preview-'+bagIndex，sellButton的aria-describedby引用；失敗不新增餘額或引用，原note與原因保留。
2. 商店原buyButton建立後、append該button前，僅!preview.disabled時append一個p.ms-panel-note「購買後預覽：金幣 before → after」，after=player.coins-preview.total；id='brightwood-first-oath-buy-preview-'+item.id，buyButton aria-describedby引用。保留原總價／按鈕label/title/aria-label/data/disabled順序，其餘卡片不變。
3. 原批次expectedSoldStacks>0容量note的完整句子後附「 金幣預覽：before → after。」，after=player.coins+materialSalePreview.expectedProceeds。原note id／aria-describedby沿Plan43，部分成交只算expectedProceeds，不用nominalProceeds；零成交不顯示。
4. 商店單組出售原price span原樣抽local變數，不新增row child或改append順序／tag／class。原文字保留，僅!preview.disabled時附「；出售後預覽：金幣 before → after」，after=player.coins+preview.total；成功id='brightwood-first-oath-shop-sale-preview-'+bagIndex，原sellButton aria-describedby引用；失敗無餘額及新引用，原原因不改。

所有before=player.coins，前後數字formatNumber，明標預覽，不顯示「已成交」。不新增helper／imports／preview呼叫／domain action，不指派player／coins，不改按鈕其他屬性、quantity map／onInput／onChange／guard／handler／state／signature／CSS／timer／規則／存檔；原焦點key、容量與買賣限制保留。現有row flex-wrap／card grid沿用，無新增樣式。

純呈現只一次指定Node24.22.1 tsc --noEmit、root審四區diff；不新增tests／DOM／browser，不重跑未改buy／sale／material-sale tests。真數量輸入／click／focus／reader／layout未驗。

## W02・全新Luna Max候選

root審W01後選高於beta51未用版本與新目錄；只三metadata版本、新artifacts/plan45-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp及plan/reports/plan45-candidate.md。指定Node24.22.1／Python311完整路徑，一次build／固定tools1.2.0 pack／完整ZIP／有限audit，逐步存完整命令輸出exit，成功不重跑。Plan44 audit唯讀複製新副本，以AST／Path元件核resolvedpaths；metadata用Python、建目錄用New-Item -Path，不重現PS空key或-LiteralPath失敗。不tests／tsc／browser／server／git寫入；有限掃描及binary未掃如實。

## W03・主代理收束

更新本Plan、[交接](reports/plan45-handoff.md)、status及README，一次文件引用檢查；完成後才開下一個明確基礎體驗Plan。

root本批完整網讀Playroom範本、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs160–163，尾段完整無失敗）。保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0、相對資源與iframe契約。根無.codegraph，dirty／HEAD a20f4ac／真資料／profiles／舊成品保全。不commit／push／tag／Release／發布／新增排程，不例行重試0x6D。02:40／07:50皆已觸發刪除。
