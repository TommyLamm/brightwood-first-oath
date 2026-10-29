# 41・基礎體驗：技能學習資格與消耗預覽

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan40](reports/plan40-handoff.md)已完成，唯一現況見[status](status.md#current-state)。

技能卡自行組合job／level／SP／rank條件，未直接採用domain的完整學習資格；畫面也未顯示學習後剩餘SP或生命鍛鍊對實際最大HP的影響。本批只做唯讀預覽與UI接線，不改技能、數值、可學清單或原命令流程。

## W01・全新Luna Max純預覽

只新增src/ui/skill-learning-preview.ts、tests/skill-learning-preview.test.ts及plan/reports/plan41-skill-preview.md。Input為player／rules／skillId；previewSkillLearning回Result<{before:DerivedStats;after:DerivedStats;remainingSp:number}>。只呼一次applyProgressAction(player,{type:'learnSkill',skillId},rules)，失敗原code/message；成功deriveStats原與結果、讀結果sp，丟棄draft player，不另寫資格或公式。

用真rulesCatalog與createPlayer建立小型有效fixture。單次focused約5組覆蓋攻擊技能初學／升級與SP扣除、最後1SP→0、生命鍛鍊實際最大HP增量且不自動補血、未知／不可學技能、job／level／零SP／滿級失敗及domain優先序。每個成功失敗核player及rules不變，輸出無player／hp／mp。禁止改domain／content／app／UI或擴完整suite；只執行新檔一次vitest，保存命令輸出exit，不另tsc。

## W02・全新Luna Max單一UI owner

root審W01後，只寫src/ui/index.ts的import與buildSkillsPanel及新plan/reports/plan41-ui-integration.md。每技能只呼一次previewSkillLearning，以結果失敗message取代原手寫reason；保留rankReady供原已滿級label與原因呈現條件。刪除僅供舊reason的levelReady／jobReady。

成功在原actionButton前追加p.ms-panel-note「學習後：SP before → remainingSp」，before用player.sp；若before.maxHp與after.maxHp不同，接「；最大 HP before → after」。全部formatNumber；成功title保留「消耗 1 SP 學習或提升技能」並附summary；失敗title採原domain message且不顯示成功summary。原技能details／下一級效果／生命不自補提示、卡片與排序、visible label／aria-label／data／action／focus流程／handler不變。不套用預覽player，不改state／signature／CSS／timer／dispatch／存檔。只一次指定Node24.22.1 tsc，root審diff，不重跑W01 tests，不啟browser。

## W03・全新Luna Max候選與主代理收束

W02審閱後選高於beta47未用版本與新目錄，三metadata版本、新artifacts/plan41-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp及plan/reports/plan41-candidate.md。指定Node24.22.1及Python311完整路徑；一次build／固定tools1.2.0 pack／完整ZIP validate／有限audit，每步即存原命令輸出exit，成功checks不重跑。audit讀Plan40原檔複製新副本，以AST／Path元件核resolvedpaths，不改舊成品。不tests／tsc／browser／server／git寫入。

root更新[交接](reports/plan41-handoff.md)、本Plan／status／README，一次文件引用檢查，完成再開下一個明確基礎體驗Plan。真click／focus／reader／layout未驗，source／ZIP與平台驗收分開。

本批完整網讀Playroom範本、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs135–138，尾段完整無失敗）。保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0、相對資源與iframe要求。無.codegraph；保留dirty／HEAD a20f4ac／真資料／profiles／舊候選。不commit／push／tag／Release／發布／新增排程，不例行重試0x6D。02:40已刪除，07:50保留。
