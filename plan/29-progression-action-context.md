# 29・基礎體驗：技能與任務動作的對象名稱

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan28交接](reports/plan28-handoff.md)後完成三處名稱與beta36，見[本批交接](reports/plan29-handoff.md)。依使用者持續指令接續下一批。唯一現況見[status](status.md#current-state)。

## 來源與契約

主代理讀[UI](../src/ui/index.ts)buildSkillsPanel（2691附近）、buildDialoguePanel（2941／2953附近）：技能卡按鈕共用「學習技能／提升至等級N／已滿級」，多張NPC任務卡共用「接取任務／領取任務獎勵」。可見標題有對象，但按鈕自身名稱沒有技能或任務名稱。沿[Plan26](26-item-action-context.md)物品動作方式，只補這三處aria-label，未實測讀屏。

1. buildSkillsPanel先將原三態可見label原樣存到actionLabel，用同一label建立原learn-skill鈕；aria-label為`actionLabel + '：' + skill.name + '，目前等級 ' + rank + '/' + skill.maxRank`。沿原rank／maxRank，不再判斷或計算技能效果／SP成本。
2. buildDialoguePanel available卡的accept-quest鈕aria-label為`'接取任務：' + quest.title`。
3. 同builder ready卡claim-quest鈕aria-label為`'領取任務獎勵：' + quest.title`。保留Plan22的claimPreview／disabled／title／reason及focus，不能另調helper或修改領獎判定。

可把inline makeButton提取局部const再setAttribute，append回原位置；不新元素／wrapper／id／role／live region，不動class、可見label、title、disabled、原data/action/focus、任務卡篩選、append順序、handlers、helper、CSS、domain／app或存檔。動作鈕不加aria-pressed。此批不擴到其他已具上下文控件。

主代理本新批次完整網讀Playroom範本與game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning、save-compatibility，尾段補讀無失敗。適用固定身分／相對資源／iframe／存檔相容／新候選。保留brightwood-first-oath／作者TommyLamm／desktop／四區18圖／Lv30／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0。基線beta35、HEAD a20f4ac與共享dirty、舊候選／真資料／QA profiles保全。根無.codegraph，目標式定位。

## 明確工作包與驗收

主代理保存UI基線、審閱與唯一現況；實作／修復全新gpt-6-luna／max／fork none，先W01審閱再W02。

### W01・三處按鈕名稱（Luna A）

唯一可寫src/ui/index.ts上述兩個builder三處、新plan/reports/plan29-action-ui.md。其餘唯讀，保留全部既有dirty。只一次tsc；屬性／名稱低風險修改不新增／執行tests、DOM／browser／讀屏或截圖，不build。報告實際命令／結果與未驗；交root審全部diff。

### W02・新候選（全新Luna B）

W01審閱後指定高於beta35且未用的新版本／目錄，不預占beta36。只改package／lock根版本與public manifest版本、本批新候選／tmp logs、新plan/reports/plan29-candidate.md。一次Node24.22.1系build／固定pack／完整ZIP validate／前批audit只改路徑版本副本，記source／dist SHA清單、六處metadata一致、ZIP識別、有限文字scan／未掃範圍。不覆寫舊成品、不重跑tsc、不tests／browser／server／gitwrite／發布或排程。

### W03・主代理整合

新plan/reports/plan29-handoff.md，更新Plan／status／README；審閱名稱都以原完整可見label起頭、對象與rank取原值、所有disabled／reason／data／dispatch／focus不變。只一次本批文件引用檢查。tsc與新候選完整ZIP驗證過即完成source／ZIP交付，真讀屏／click／keyboard／layout未驗，不以型別／封包代替。完成本批後再開下一批。
