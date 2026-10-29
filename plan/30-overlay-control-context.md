# 30・基礎體驗：遮罩卡片名稱與關閉對象

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan29交接](reports/plan29-handoff.md)後完成三處名稱與beta37，見[本批交接](reports/plan30-handoff.md)。依使用者持續指令接續下一批，唯一現況見[status](status.md#current-state)。

## 已確認來源與精確契約

主代理讀[UI](../src/ui/index.ts)makeScreenCard：共用卡片設role=dialog、aria-modal=true並插入h1，卻沒有aria-label或aria-labelledby。renderPanel的關閉鈕只有「關閉」，renderKeyGuide的內部收起鈕只有「✕ 收起」，缺單獨定位時的對象名稱；外部問號鈕已具aria-label／expanded／controls，無需重做。

只處理以下三處，不改遮罩流程或焦點政策：

1. makeScreenCard新增`card.setAttribute('aria-label', title)`，直接沿同一title參數；保留role／aria-modal、h1／description文字與插入順序。所有原呼叫沿用，不逐一硬寫screen名稱。不新增id、description屬性或live region。
2. renderPanel原closeButton加`aria-label`為`'關閉' + PANEL_LABELS[panel]`，同作用中的panel；保留原可見「關閉」、title、class、data action、panel-close focus key與append順序。
3. renderKeyGuide內部「✕ 收起」鈕提取局部const（如需），加aria-label為「✕ 收起：操作按鍵提示」，再append原位置；原title／class／action／focus不動，外部toggle及aria-expanded不改。

無新元素／wrapper／helper／CSS／timer；不改hide／show、Esc、modal角色、keyboard handler、focus trap／restore、畫面狀態、命令／儲存或panel builder。這是靜態名稱缺口，未實測讀屏或焦點。

主代理本新批次重新完整網讀Playroom範本、game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning、save-compatibility；截斷尾段補讀無失敗。適用固定ID／相對資源／iframe／存檔相容／新候選；保留brightwood-first-oath／作者TommyLamm／desktop／四區18圖／Lv30／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0。基線beta36、HEAD a20f4ac、共享dirty／舊候選／真資料／QA profiles保全。根無.codegraph，目標式讀檔。

## 明確工作包與驗收

主代理保存UI基線、審閱與唯一現況；實作／修復全新gpt-6-luna／max／fork none，先W01審閱再W02。

### W01・三處名稱（Luna A）

唯一可寫src/ui/index.ts的makeScreenCard、renderPanel closeButton、renderKeyGuide內部收起鈕上述三處，新plan/reports/plan30-overlay-ui.md。其他全唯讀，共享dirty保留。只一次tsc，不新增／執行tests、DOM／browser／讀屏／截圖或build；報告實際命令exit與未驗。

### W02・新候選（全新Luna B）

W01審閱後指定高於beta36且未用的新版本／目錄，不預占beta37。只改package／lock根版本、public manifest版本、新候選／本批tmp logs、新plan/reports/plan30-candidate.md。一次Node24.22.1系build／固定pack／完整ZIP validate／前批audit路徑版本副本；source／dist SHA清單、六處metadata一致、ZIP識別、有限文字scan／未掃範圍如實列出。舊成品不覆寫，不重跑tsc，不tests／browser／server／gitwrite／發布或排程。

### W03・主代理交接

新plan/reports/plan30-handoff.md，更新Plan／status／README，只一次本批文件引用檢查。審三處diff，確認只名稱／必要按鈕const，原title參數與PANEL_LABELS同源且DOM／focus／handler不變。一次tsc、新候選完整ZIP驗證過即完成source／ZIP交付；真讀屏／click／keyboard／focus／layout未驗，不重試0x6D。完成本批後再開下一批。
