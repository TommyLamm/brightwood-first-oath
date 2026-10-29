# 37・基礎體驗：探索HUD背包容量提醒

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan36交接](reports/plan36-handoff.md)後執行，唯一現況見[status](status.md#current-state)。

主代理讀index.ts的HUD panelButtons建立／render迴圈及inventory／shop容量段：面板內有已用N／32格與>=28樣式，HUD背包鈕沒有資訊；既有data-badge樣式已用於AP／SP，可顯示短數字而不加新樣式。容量提示不代表所有拾取都會失敗，同類未滿堆疊仍沿原規則。

## W01・全新Luna Max單一UI owner

唯一可寫src/ui/index.ts的render panelButtons迴圈一個inventory分支、新plan/reports/plan37-hud-ui.md。

在原top class及aria-expanded設定後、unspent AP／SP段前處理panel==='inventory'：有player時用player.bag.length，aria-label=「開啟」+PANEL_LABELS[panel]+「（已用 N／32 格）」；title=label+「：已用 N／32 格」，used>=28時再加「；可出售或使用物品整理空位」。used>=28設data.badge=String(used)，否則刪除；數字只顯示28–32，不寫N/32以免既有badge寬度擠字。無player時恢復原aria-label、title=label並刪badge。分支處理後continue，避免AP/SP清理段刪掉inventory徽章。AP/SP原段全部保持原樣。

不改visiblelabel／icon／class／按鈕handler／focus／aria-expanded，容量與threshold與原背包一致，不新增state／timer／signature／CSS／依賴或helper，不改背包上限／拾取disabled／堆疊或存檔。現有render輸入已有player，交易或拾取後沿原view更新，不另外查storage。

只一次完整指定Node24.22.1 tsc --noEmit，主代理審局部diff核AP/SP未變、無player清舊值，純呈現不加tests／DOM／browser。真badge版面、容量跨閾值刷新及reader未驗。

## W02・全新Luna Max候選

W01審閱後指定高於beta43未用版本及新目錄。只metadata版本、新artifacts/plan37-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp、新plan/reports/plan37-candidate.md。一次指定Node24.22.1 build／固定tools1.2.0 pack／完整ZIP validate／有限audit；複製Plan36 audit副本時全替換plan/tmp/版本並核resolvedpaths，原件及舊候選唯讀。Python用已知Python311完整路徑，不必重試無runtime的py launcher；讀lock使用Python或PS-AsHashtable。每步執行即保存完整命令／原輸出／exit log，報告寫plan/reports，不重跑成功checks，不補造原輸出。列SHA／counts／metadata一致、文字scan與binary未掃界線；無browser／server／tests／tsc重跑。

## W03・主代理交接

新plan/reports/plan37-handoff.md與Plan/status/README，一次文件引用檢查。source／ZIP交付與真UI驗收分開，完成才開下一Plan。

主代理本批完整網讀Playroom範本與game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs118–121，完整尾段無失敗）。適用固定身分／存檔相容／新候選不覆寫／相對資源與iframe；保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0。無.codegraph，dirty、HEAD a20f4ac、真資料／profiles／歷史成品保全。不commit／push／tag／Release／發布／額外排程，不重試0x6D；02:40已刪除，07:50保留。
