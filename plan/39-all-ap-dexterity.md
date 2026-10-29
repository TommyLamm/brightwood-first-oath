# 39・基礎體驗：全部AP投入敏捷入口

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan38交接](reports/plan38-handoff.md)完成後執行，唯一現況見[status](status.md#current-state)。

主代理讀illustrated-panels.ts的buildVisualStats／describeAllocation、index.ts allocate-ap handler及對應CSS。現在ap>5有全部AP→力量，敏捷只有+1／最多+5，需要重複操作。handler及preview已支援str/dex任意合法amount；foot既有flex-wrap。本批增加同等敏捷按鈕，不改domain或既有加點規則。

## W01・全新Luna Max單一UI owner

唯一可寫src/ui/illustrated-panels.ts的原`if (player.ap > 5)`整批加點區、新plan/reports/plan39-ap-ui.md。

在原if內，以readonly tuple list `[['str','力量'],['dex','敏捷']] as const`依序建立兩鈕。每鈕label保持格式「全部 AP → 名稱（N）」；button action allocate-ap，data `{stat,amount:String(player.ap)}`，原secondary class，`describeAllocation(label,stat,player.ap)`原樣取得disabled／title／ariaLabel。append到原foot，力量在前、敏捷在後，再原help details。原力量文字、資料順序及因此產生focus key維持相同；新敏捷key自然不同，不加新focus系統。

只擴原區迴圈，不改if門檻、+1/+5卡片、describeAllocation／previewApAllocation／index handler／domain／數值政策／AP供給／CSS／layout／存檔／state／signature／timer或自動派命令。點擊仍由原guard重新判斷；不預選、不自動分點，不新增確認流程。

只一次指定Node24.22.1 tsc --noEmit，root審完整局部diff，核typed tuple stat/amount/label對應與原STR key及helpers未變。純UI入口不新增tests／DOM／browser，不重跑未變已過的AP helper tests。真click／focus／兩鈕版面與讀屏未驗。

## W02・全新Luna Max候選

W01審閱後指定高於beta45未用版本／目錄；只metadata版本、新artifacts/plan39-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、新tmp及新plan/reports/plan39-candidate.md。一次Node24.22.1 build／固定tools1.2.0 pack／完整ZIP validate／Python311完整路徑audit，副本路徑依Path元件核resolvedpaths，不用原碼連續路徑字串guard，不猜替換數；讀lock用Python或-AsHashtable。可參考Plan38成功prepare副本做法但原腳本／舊候選不改。每步即存原命令／完整輸出／exit，成功checks不重跑；六版本metadata／SHA／counts／有限文字scan與binary未掃界線如實列。不得重跑tsc／tests或browser／server／gitwrites。

## W03・主代理交接及保留

新plan/reports/plan39-handoff.md與Plan/status/README，一次文件引用檢查。完成本批再開下一Plan，source／ZIP與真UI驗收分開。

主代理本批完整網讀Playroom範本、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility（refs127–130，尾段完整無失敗）。適用固定身分／存檔相容／相對資源與iframe／新候選不覆寫；保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0。根無.codegraph，dirty、HEAD a20f4ac、真資料／profiles／舊候選保全。不commit／push／tag／Release／發布／額外排程，不例行重試0x6D。02:40已刪除，07:50保留。
