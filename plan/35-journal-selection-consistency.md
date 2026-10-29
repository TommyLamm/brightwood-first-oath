# 35・基礎體驗：手帳內容與選取高亮一致

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan34交接](reports/plan34-handoff.md)完成後執行。唯一現況見[status](status.md#current-state)。

## 已確認問題與精確修正

主代理讀src/ui/index.ts的buildWorldJournal、illustrated-panels.ts的chooseJournalQuest／buildVisualQuests及tests/journal-selection.test.ts。buildVisualQuests會用現有helper自動選ready→active→available→locked→最後一項，但world wrapper重建路線時用selectedQuestId（初開為null）決定高亮，造成詳情已有任務而所有路線未選取；wrapper補充提示另重寫部分fallback，遺漏locked／全claimed情況。

修正只在index.ts：import現有chooseJournalQuest；buildWorldJournal開頭先`const selectedQuest = chooseJournalQuest(view.questViews, selectedQuestId)`；buildVisualQuests傳`selectedQuest?.questId ?? null`；路線按鈕selected改比對selectedQuest?.questId；移除函式尾原本四段find fallback，原q21調律→調查及滿等EXP提示沿用同一selectedQuest。helper規則不改，保留顯式選取優先、過期ID fallback、locked及最後claimed fallback。不要把選取結果寫回UI state或SaveData，不改handler／group順序／進度／圖示／故事／獎勵／CSS／focus／role／aria名稱。所有highlight與aria-pressed仍沿原兩行設定，只改來源。

## 清楚工作包

主代理規劃、逐包審閱、交接；全新gpt-6-luna／max／fork none，runtime單owner。

- W01只改index上述四處與新reports/plan35-journal-ui.md；illustrated-panels、helper及tests唯讀。指定Node24.22.1跑既有journal-selection.test.ts精選兩案例，`-t 'prioritizes a ready quest|handles a new adventure'`，另monster location例skip。只一次focused、一次tsc；不加tests／DOM／browser／build。不把helper測試冒充wrapper DOM通過，主代理讀全部局部diff核接線。
- W02審閱後指定高於beta41未用版本及新目錄；只metadata版本、新artifacts/plan35-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp及reports/plan35-candidate.md。一次指定Node24.22.1 build／固定tools1.2.0 pack／完整ZIP validate／audit；新audit副本執行前核artifact與tmp皆本批，不重跑通過的focused／tsc或覆寫舊成品。報告精簡列實際命令exit、雜湊與有限掃描／binary未掃界線。
- W03主代理寫reports/plan35-handoff.md、更新Plan/status/README，一次文件引用檢查。真初開／切選取／quest狀態變更／全完成／焦點／reader與版面未驗，保留BROWSER_UNVERIFIED。完成再開下一Plan。

主代理本批完整網讀Playroom範本與game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs106–109，所有尾段完整無失敗）。適用身分固定／新候選不覆寫／相對路徑／iframe／存檔相容；保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0。無.codegraph，基線beta41與共享dirty、HEAD a20f4ac、真資料／profiles／舊成品保全。不commit／push／tag／發布／Release／額外排程，不重試相同0x6D。02:40已刪除，07:50沿實際進度續作。
