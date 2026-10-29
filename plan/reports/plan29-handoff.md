# Plan29・技能與任務動作名稱交接

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan28交接](plan28-handoff.md)後完成[Plan29](../29-progression-action-context.md)，唯一現況見[status](../status.md#current-state)。主代理本新批次完整網讀範本與七份main規格，尾段補讀無失敗，固定身分／存檔相容／SDK／tools保留。

W01全新Luna Max `/root/plan29_action_ui`完成，[報告](plan29-action-ui.md)列一次tsc exit0。主代理依 `.playroom/tmp/plan29-integration-review/ui-before.ts` 審讀三處全部diff，名稱以原label起頭並取原skill.name／rank／maxRank或quest.title，原disabled／title／reason／preview／data／focus及append順序保留。W02由全新Luna Max `/root/plan29_candidate`完成，確認beta36新目錄與tag未用，結果列下節。

共享dirty／HEAD a20f4ac、玩家資料／profiles／舊候選保全；無本批browser／server，讀屏／click／keyboard／layout未驗。不commit／push／tag／發布或建排程，完成本批後依持續指令接續。

## 候選與實際檢查

W02全新Luna Max `/root/plan29_candidate`完成，[候選報告](plan29-candidate.md)及build／validator log已由主代理讀取。一次build（76 modules）／固定pack／完整ZIP validate／audit各exit0；W01一次tsc沿用，不跑tests，兩包均完成。

候選`brightwood-first-oath`／`1.0.0-beta.36`，[game.zip](../../artifacts/plan29-1.0.0-beta.36/game.zip) 131,526,568 bytes／274 entries，SHA-256 `faf00b355dae465240f446f988ef64620c0b82cdf6f00d3ad535f40662051e38`。source423 files／135,740,054 bytes，dist274／135,746,809 bytes；清單hash／六處metadata一致性見候選報告。8-pattern scan14 text entries／1,764,472 bytes零命中，260 binary entries／133,982,337 bytes未掃。完整logs在 `.playroom/tmp/plan29-candidate-beta36/`，舊成品保留，不以封包驗證代替讀屏或互動通過。

本批一次文件引用檢查：6份文件、79個本地連結、7個Markdown anchor零失敗，未重跑已過遊戲檢查。
