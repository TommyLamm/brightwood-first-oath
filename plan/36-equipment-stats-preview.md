# 36・基礎體驗：裝卸前的實際角色能力預覽

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan35交接](reports/plan35-handoff.md)完成後依持續指令執行，唯一現況見[status](status.md#current-state)。

## 來源與目標

主代理讀index.ts的背包equip、buildEquipmentPanel及裝卸handler、equipment-preview.ts、equipment-preview.test.ts、deriveStats／DerivedStats與AP預覽模式。背包有物品原始能力差值，卸下面板只有可否操作，尚無實際角色操作前後數值。增加攻擊／防禦／生命上限預覽，沿domain操作與deriveStats，不另算公式，不套用預覽player，不改裝卸政策、HP或背包。

## W01・純model，全新Luna Max

唯一可寫新src/ui/equipment-stats-preview.ts、新tests/equipment-stats-preview.test.ts、新plan/reports/plan36-equipment-stats.md。

匯出`EquipmentStatsPreview = {before:DerivedStats; after:DerivedStats}`及`previewEquipmentStats(input: EquipmentPreviewInput): Result<EquipmentStatsPreview>`，input/type沿existing equipment-preview.ts。只呼一次applyProgressAction(input.player,input.action,input.rules)，失敗原code/message，成功deriveStats原player與result.value後，只回before/after。不得回player／action結果或改input；不改舊previewEquipmentAction（handler仍使用）。

最多五組focused真domain小fixture：武器裝備／替換的實際stats；卸下body的defense與maxHp、原hp不變；滿包換裝成功及stats；滿包卸下／需求不足／過期index／空槽失敗沿原碼訊息；level／vitality被動下deriveStats一致。各場景核player/rules不變、成功僅before/after且無player/value.player。可合併場景為5組，不boot遊戲。不mock整個domain，不新增數值公式。只一次新test檔vitest，修失敗才精選重跑，不tsc／browser／build。

## W02・UI單owner，全新Luna Max

唯一可寫index.ts的import、新局部純文字formatter、背包equip與裝備unequip builder及新plan/reports/plan36-ui-integration.md。

import新helper及preview type。新增`formatEquipmentStatsPreview(preview: EquipmentStatsPreview): string`，只用formatNumber將before/after的attack／defense／maxHp組成「攻擊 X → Y；防禦 X → Y；生命上限 X → Y」，不能推算HP治療或自算stats。

背包原equip卡及equipment面板unequip卡，原render previewEquipmentAction改呼新helper一次；disabled改!preview.ok、失敗title及可見ms-disabled-reason沿message，成功title保留原動作／對象並加summary。成功時原操作鈕前新增一個p.ms-panel-note：分別「裝備後預覽：」／「卸下後預覽：」+summary。保留背包原makeEquipmentComparison及全部其他內容。失敗不顯示虛構stats。

原equip aria-label與visiblelabel／data/focus不變。unequip抽出原button變數、追加aria-label「卸下」+slotLabel(slot)+「：」+(item?.name??itemId)，原visiblelabel與data不變。原所有click handlers保持舊previewEquipmentAction最新判定及dispatch，不用newpreview player。不要移除舊helperimport，handlers仍需它。無新state／timer／signature／CSS／policy／排序。

只一次指定Node24.22.1 tsc --noEmit，不tests／DOM／browser／build；主代理讀全部局部diff核無額外裝卸呼叫或dispatch變更。真排版／focus／reader／click未驗。

## W03・新候選，全新Luna Max

W02審閱後核高於beta42未用版本與新目錄；只metadata版本、新artifacts/plan36-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp、新plan/reports/plan36-candidate.md。一次指定Node24.22.1 build／固定tools1.2.0 pack／完整ZIP validate／audit。audit新副本全替換本批plan、tmp及版本，先核resolvedpaths；不得PS ConvertFrom-Json直接讀lock空key（使用-AsHashtable或Python），避免已知prep問題。不要複雜化wrapper。

每步執行即存原命令／輸出／exit log，報告務必寫plan/reports/，不是repo根reports/。成功checks不重跑；source/distSHA及ZIP hash、六版本metadata與finite8patterns文字scan／260binary未掃範圍如實列出。禁止重跑W01／W02，禁止browser／server／gitwrites／發布。

## W04・主代理交接及保留

新plan/reports/plan36-handoff.md與Plan/status/README，一次本批文件引用檢查；分清source／ZIP與實際browser驗收。完成本批才開下一批。

主代理本批完整網讀Playroom範本、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs111–114，尾段完整無失敗）。適用固定身分／新候選不覆寫／相對資源及iframe／存檔相容；保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0。根無.codegraph，現有dirty、HEAD a20f4ac、玩家資料／profiles／舊候選保全。不commit／push／tag／Release／發布／新增排程；不重試相同0x6D環境，02:40已刪除、07:50沿實際進度續作。
