# 27・基礎體驗：AP加點的實際能力預覽

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan26交接](reports/plan26-handoff.md)後完成AP預覽、UI與beta34，見[本批交接](reports/plan27-handoff.md)。依使用者持續指令接續下一批。唯一現況見[status](status.md#current-state)。

## 目標與來源

主代理讀取[能力面板](../src/ui/illustrated-panels.ts)buildVisualStats：力量／敏捷有每點效果，但+1、最多+5及全部AP→力量按鈕只說明成本，沒有加點後實際能力。敏捷的每4點防禦與暴擊40%上限，使每次實際收益不同。沿既有title及aria-label提供目前→預計能力、剩餘AP，不增加版面元素。

[domain](../src/domain/progression/index.ts)allocateAp分支已驗stat／正整數amount／AP足夠／屬性安全整數；deriveStats已含裝備／技能與防禦floor、暴擊cap。[snapshot](../src/app/state.ts)顯示面板相同deriveStats；戰鬥臨時guard另在gameplay合成，不把臨時buff混入加點預覽。[UI click](../src/ui/index.ts)allocate-ap原先用最新AP clamp amount再dispatch；保留此政策，新增同源預覽guard，不採用預覽player。

主代理本新批次重新完整網讀Playroom範本與game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning、save-compatibility，尾段已補讀、沒有失敗。適用固定ID／相對資源／iframe／相容存檔／新候選。保留brightwood-first-oath／TommyLamm／desktop／四區18圖／Lv30／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0，基線beta33。根無.codegraph；共享dirty、HEAD a20f4ac、歷史成品／真資料／QA profiles保全。

## 共用判定契約

新純src/ui/ap-allocation-preview.ts，匯出previewApAllocation({player,rules,stat,amount})，stat型別str或dex，回Result<{before: DerivedStats, after: DerivedStats, remainingAp: number}>。

只調原applyProgressAction(player,{type:'allocateAp',stat,amount},rules)；失敗傳原code/message。成功用deriveStats(inputPlayer,rules)與deriveStats(resultPlayer,rules)，回兩個能力物件與resultPlayer.ap，丟棄player；不改input、不dispatch、不另算屬性、上限或AP扣除。失敗不回虛構after／remainingAp。結果沒有可套用的player。

## UI契約

僅buildVisualStats原+1／最多+5迴圈及player.ap>5全部力量按鈕：沿原amount選擇／去重／出現條件，逐鈕呼叫helper一次。disabled依!preview.ok；失敗title為原domain訊息。成功title包含消耗amount AP、攻擊before→after、防禦before→after、暴擊率百分比before→after（各toFixed(1)）、剩餘AP，明確稱「預計」。aria-label以**原完整可見label**起頭，再附同一說明；普通按鈕包含力量或敏捷，全部力量亦標對象。可用buildVisualStats內一個小局部formatter統一文字，不新增全域框架或公式。

保留原可見label、class、dataset.stat／amount／focus、button工廠與append順序；無新元素、wrapper、CSS或live region，不改總能力／每點規則文字／其他panel。title/aria預覽不代表已加點。

index.ts只加import及allocate-ap分支guard：先保留原stat驗證、available與amount clamp；取最新view.player，缺player即return；對原clamped amount呼helper，只有ok才派原allocateAp payload。不採用before／after／remainingAp修改狀態，不變commandqueue／app／domain。沒有AP時不派原必失敗命令，真規則仍由app執行。

## 清晰分工與最小驗收

主代理負責契約、保存兩檔基線、逐包審閱與唯一現況。實作／修復全新gpt-6-luna／max／fork none；包順序W01→審閱→W02→審閱→W03，最多主代理加三名活動代理。

### W01・純預覽與focused cases（Luna A）

唯一可寫新src/ui/ap-allocation-preview.ts、新tests/ap-allocation-preview.test.ts、新plan/reports/plan27-ap-preview.md；其餘唯讀。最多六組cases：力量+1／+5／全部與剩餘AP；敏捷跨／未跨防禦4點門檻；暴擊達到／已達40%上限；AP不足及0／負數／小數／非有限amount沿domain拒絕；安全整數溢出沿domain拒絕；有裝備／技能時before／after保留其影響。成功／失敗檢查輸入不變、無player輸出，可分攤同組，不為測試新增大fixture框架。

新focused檔只跑一次，若修單例只跑該例；不跑整suite、舊AP tests、tsc、build或browser。報告實際命令與結果，交root讀helper／tests再派UI。

### W02・能力面板與點擊（全新Luna B）

唯一可寫src/ui/illustrated-panels.ts的import與buildVisualStats上述按鈕、src/ui/index.ts的import與allocate-ap分支、新plan/reports/plan27-ui-integration.md。按UI契約實作，只一次tsc；不重跑W01、不新增DOM測試／browser／build，不改其他UI／helpers／app。

### W03・候選（全新Luna C）

UI審閱後指定高於beta33未用的新版本／目錄，不預占beta34。只改package／lock根版本與public manifest版本、新候選／本批tmp及plan/reports/plan27-candidate.md。一次Node24.22.1系build／固定pack／完整ZIP validate／前批audit路徑副本，記source／dist清單hash、六處metadata一致、ZIP識別及有限文字scan／未掃範圍。禁止覆寫舊候選、不重跑focused／tsc、不browser／server／gitwrite／發布或排程。

### W04・主代理交接

新plan/reports/plan27-handoff.md、更新本Plan／status／README，一次本批文件引用檢查。讀helper及兩處UI diff，確認原amountclamp／資料／派送及公式不變。focused、tsc及新完整ZIP驗證通過即完成source／ZIP交付；真hover tooltip、讀屏／click／keyboard／focus未驗，不以模型替代。不重試既有0x6D環境；本批交接完再開下一批。
