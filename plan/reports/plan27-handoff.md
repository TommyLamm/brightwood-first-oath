# Plan27・AP加點預覽交接

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan26交接](plan26-handoff.md)後完成[Plan27](../27-ap-allocation-preview.md)，唯一現況見[status](../status.md#current-state)。主代理本新批次完整網讀範本與七份main規格，尾段補讀無失敗，固定身分／存檔相容／SDK／tools保留。

W01全新Luna Max `/root/plan27_ap_preview`完成純previewApAllocation及六組focused，[報告](plan27-ap-preview.md)列單次6/6 PASS。主代理讀helper與全部tests，確認僅委派原domain及deriveStats、失敗原code/message、沒有player輸出且輸入不變。W02 UI由全新Luna Max `/root/plan27_ap_ui`完成，[報告](plan27-ui-integration.md)列一次tsc exit0，之後只補力量／敏捷字串，未重跑。主代理審讀兩檔全部增量：局部formatter逐鈕一次preview，原amount去重／出現條件／dataset／DOM與最新狀態clamp保留，不採用preview快照。W03由全新Luna Max `/root/plan27_candidate`完成，確認beta34新目錄及tag未用；候選結果列下節。主代理保存index／illustrated兩檔基線在 `.playroom/tmp/plan27-integration-review/`，收到包後逐包審閱再派後包。

保全共享dirty／HEAD a20f4ac、玩家資料／profiles／舊候選。無本批browser／server，真tooltip／讀屏／click／keyboard／focus未驗，不commit／push／tag／發布或建立排程。本批完成後接續下一批。

## 候選與實際檢查

W03全新Luna Max `/root/plan27_candidate`已完成，主代理讀[候選報告](plan27-candidate.md)及build／validator log：一次build（76 modules）／固定pack／完整ZIP validate／audit各exit0；先前新6 focused與一次tsc沿用不重跑。三個實作包均完成。W02型別檢查後只有力量／敏捷字串補充，最終source已包含在此build中。

`brightwood-first-oath`／`1.0.0-beta.34`，[game.zip](../../artifacts/plan27-1.0.0-beta.34/game.zip) 131,526,311 bytes／274 entries，SHA-256 `10f40ed2daa364fae68321a2e41c5dd294a3ccf7a91024e3c1a0231b2d2af12f`。source清單423 files／135,738,055 bytes，dist274／135,746,091 bytes；清單hash及六處metadata一致見候選報告。8-pattern scan14 text entries／1,763,754 bytes零命中，260 binary entries／133,982,337 bytes未掃。完整logs在 `.playroom/tmp/plan27-candidate-beta34/`。舊成品保留，未將模型／封包結果當成真UI操作通過。

本批一次文件引用檢查：7份文件、74個本地連結、7個Markdown anchor零失敗，未重跑已過遊戲檢查。
