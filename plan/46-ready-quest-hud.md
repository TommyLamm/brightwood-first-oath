# 46・基礎體驗：HUD待回報任務數

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan45交接](reports/plan45-handoff.md)已完成，唯一現況見[status](status.md#current-state)。

HUD追蹤器只呈現第一個ready／active任務；任務面板按鈕沒有同時待回報的項數。root核view.questViews既有ready狀態、panelButtons每次render更新與AP／SP及背包徽章。本批加任務徽章，不改任務追蹤、選取或領獎判斷。

## W01・全新Luna Max單一UI owner

只寫src/ui/index.ts原render內panelButtons迴圈，於原inventory分支後、原AP/SP區前加quests專用分支；及新plan/reports/plan46-quest-hud-ui.md。

若有view.saveData，readyCount=view.questViews.filter(({status})=>status==='ready').length，無角色則0。readyCount>0時button.dataset.badge=String(readyCount)，aria-label「開啟任務（待回報 N 項）」，title「任務：N 項待回報，請查看手帳中的回報 NPC 與獎勵」。零項時delete badge，aria-label回「開啟」+PANEL_LABELS[panel]，title回PANEL_LABELS[panel]；分支末continue，避免被原AP/SP區清除。沿原前方class toggle與aria-expanded。

只數ready，不算available／active／locked／claimed，不呼resolveQuestClaim或推斷可領獎；badge只表示待回報，不保證背包／金幣等允許領取。不加live／role／彈窗／dispatch，不改visible label/icon／data panel／click／focus／既有inventory與AP/SP分支、tracker／選取／helper／domain／content／state／signature／CSS／timer／存檔。沿用既有data-badge樣式。

純呈現只一次指定Node24.22.1 tsc --noEmit，root審局部diff與ready限定／清除分支／continue；不新增tests／DOM／browser，不重跑未變quest tests。真徽章／click／focus／reader／layout未驗。

## W02・全新Luna Max候選

root審W01後用高於beta52未用版本及新目錄。只三metadata版本、新artifacts/plan46-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp及plan/reports/plan46-candidate.md。指定Node24.22.1／Python311完整路徑，一次build／固定tools1.2.0 pack／完整ZIP／有限audit，逐步存完整命令輸出exit，成功不重跑。Plan45 audit唯讀複製新副本，AST／Path元件核resolvedpaths；metadata用Python、New-Item用-Path，不重現空key／-LiteralPath錯誤。不tests／tsc／browser／server／git寫入，有限scan／binary未掃如實。

## W03・主代理收束

更新本Plan、[交接](reports/plan46-handoff.md)、status與README，一次文件引用檢查；完成後才開下一個有明確範圍的基礎體驗Plan。

root本批完整網讀Playroom範本、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs168–171，尾段完整無失敗）。保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0、相對資源與iframe契約。根無.codegraph；dirty／HEAD a20f4ac／資料／profiles／舊候選保全。不commit／push／tag／Release／發布／新增排程，不例行重試0x6D。02:40／07:50皆已觸發刪除。
