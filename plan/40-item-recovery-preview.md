# 40・基礎體驗：背包藥水恢復預覽

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan39交接](reports/plan39-handoff.md)已完成，唯一現況見[status](status.md#current-state)。

背包消耗品已呼叫resolveItemUse決定可用狀態，但成功只顯示「使用一個」，玩家無法從此處得知受上限裁切後的HP／MP。本批直接呈現現有結果，不新增恢復公式或套用預覽player。

## W01・全新Luna Max單一UI owner

只寫src/ui/index.ts中buildInventoryPanel原消耗品區及新plan/reports/plan40-item-recovery-ui.md。沿用唯一一次resolveItemUse，成功從原player及usePreview.value.player各讀hp/mp，經formatNumber顯示「HP before → after；MP before → after」。成功時在原使用按鈕前加p.ms-panel-note「使用後預覽：summary」，title為「使用一個：物品名；summary」。原label、aria-label、data、disabled與失敗title／原因保留。失敗不得顯示假預覽。

不改helper／domain／app／點擊guard／冷卻signature／state／timer／CSS／數量／fallback政策／存檔，不指派預覽player、不增加resolve呼叫或自動派命令。只一次指定Node24.22.1 tsc --noEmit，root審局部diff；不新增tests／DOM／browser，不重跑未變的item-use tests。實際click／focus／冷卻到期／layout／reader未驗。

## W02・全新Luna Max候選

W01審閱後使用高於beta46未用版本與新目錄。只改三metadata版本、新artifacts/plan40-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp及新plan/reports/plan40-candidate.md。指定Node24.22.1與Python311完整路徑，一次build／固定tools1.2.0 pack／完整ZIP validate／有限audit，各步即存原命令輸出與exit；不重跑成功checks。從Plan39 audit原檔複製新副本，以Path元件核resolvedpaths，不改舊成品。六metadata、SHA／counts及260 binary未掃界線如實列。不重跑W01 checks或啟動browser／server。

## W03・主代理交接

更新本Plan、[交接](reports/plan40-handoff.md)、status／README，一次文件引用檢查；本批完成再開下一個有明確範圍的基礎體驗Plan。

本批完整網讀Playroom範本、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs131–134，尾段完整無失敗）。保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0、相對資源與iframe契約。根無.codegraph；保留dirty／HEAD a20f4ac／真資料／profiles／歷史成品。不commit／push／tag／Release／發布／新增排程，不例行重試0x6D。02:40已刪除，07:50保留。
