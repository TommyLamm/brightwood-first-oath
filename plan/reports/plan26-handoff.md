# Plan26・物品操作名稱與選取狀態交接

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan25交接](plan25-handoff.md)後完成[Plan26](../26-item-action-context.md)，唯一現況見[status](../status.md#current-state)。主代理已重新完整網讀範本及七份main規格含尾段，沒有讀取失敗；固定ID、TommyLamm作者、desktop、存檔讀1–5寫5及SDK／tools保留。

W01為全新Luna Max `/root/plan26_item_action_ui`：只改背包／商店builder七處名稱與slot狀態，[報告](plan26-item-action-ui.md)完成，一次tsc exit0。主代理依 `.playroom/tmp/plan26-integration-review/ui-before.ts` 審讀全部七處diff：重用原preview數量／總額、原元素順序／dispatch／focus／disabled／marker未變。W02由全新Luna Max `/root/plan26_candidate`完成；preflight確認新目錄與tag未用，[候選報告](plan26-candidate.md)已交付。主代理讀報告及build／validator log，build／固定pack／完整ZIP validate／audit各一次exit0，未重跑tsc。

候選`brightwood-first-oath`／`1.0.0-beta.33`，[game.zip](../../artifacts/plan26-1.0.0-beta.33/game.zip) 131,525,976 bytes／274 entries，SHA-256 `f86b41a35764a2845e0aea6130e71085f4378a11888ff9608ee15ec2beccdc67`。source421 files／135,730,526 bytes，dist274／135,745,213 bytes；清單hash與六處metadata一致性見候選報告。有限8-pattern scan14 text entries／1,762,876 bytes零命中，260 binary entries／133,982,337 bytes未掃。完整logs在 `.playroom/tmp/plan26-candidate-beta33/`。本批未新增或執行tests；兩個子代理包均完成。

原HEAD a20f4ac與共享dirty、舊候選／玩家資料／profiles保全。無browser／server及新QA資源，真screen-reader／click／keyboard／layout未驗。不commit／push／tag／發布或建排程；本批完成後依持續指令接續下一批。

本批一次文件引用檢查：6份文件、64個本地連結、7個Markdown anchor零失敗；未重跑遊戲檢查。
