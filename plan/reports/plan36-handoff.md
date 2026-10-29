# Plan36・裝卸能力預覽交接

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan35](plan35-handoff.md)完成後交付[Plan36](../36-equipment-stats-preview.md)。八份指定規格由主代理本批完整網讀（refs111–114），清楚工作包見Plan。

全新Luna Max W01純model及5 focused、root審閱、W02 UI／一次指定Node24.22.1 tsc、W03新候選均完成。新stats僅before/after，保留domain裝卸及deriveStats，不改HP或存檔；真UI未驗。不commit或發布，不新browser／server；保留所有dirty／作者TommyLamm／讀1–5寫5／舊成品。02:40已刪除，07:50保留。

W01全新Luna Max `/root/plan36_equipment_stats`完成，[報告](plan36-equipment-stats.md)列單次新5 focused PASS。主代理讀helper與完整測試，核原domain單次操作／deriveStats前後、失敗碼訊息及不暴露player，五組實際值與不變性檢查接受。W02全新Luna Max `/root/plan36_equipment_ui`接單，只改兩處builder與文字formatter及一次指定tsc；原click guards維持舊helper。

主代理將README當前入口縮為最新Plan與唯一status，移除反覆堆疊的已完成Plan長段，各批仍由status對應列存取；歷史區保留。此為索引文字維護，未另跑檢查，待本批文件檢查一次收束。

W02全新Luna Max `/root/plan36_equipment_ui`完成，[報告](plan36-ui-integration.md)列指定Node24.22.1一次tsc exit0。主代理完整審基線四處diff，確認兩render各一次新preview、三欄純formatNumber、success p／failure原message、unequip對象aria與原click guard不變。

W03全新Luna Max `/root/plan36_candidate`完成beta43，[候選報告](plan36-candidate.md)及原tmp 02–05日誌經主代理核讀：Node24.22.1下build／固定pack／完整ZIP validate及Python3.11.9 audit各一次exit0。py launcher未找版本後用完整Python路徑，原正式成功checks不重跑。ZIP 131,527,456 bytes、274 entries，SHA-256 `d66953a8d020595abe249b073d31de2b6350ac1f97cf7225861aa81ce1312ae8`，artifacts/plan36-1.0.0-beta.43。有限8規則掃14 text／1,767,589 bytes、0 findings，260 binary／133,982,337 bytes未掃，不是完整秘密稽核。

本批真layout／focus／reader／click／HP上限變化呈現未驗，不稱CANDIDATE_READY或平台通過。完成文件檢查後，下一批可沿既有HUD背包鈕加入接近滿格提醒，保留拾取與堆疊政策。

主代理一次文件引用檢查：7 documents／56 local links／6 anchors，0 failures，exit0；README縮入口後引用數下降，歷史未刪。沒有追加遊戲檢查。
