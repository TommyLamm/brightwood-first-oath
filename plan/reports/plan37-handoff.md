# Plan37・HUD背包容量交接

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan36](plan36-handoff.md)完成後交付[Plan37](../37-hud-bag-capacity.md)。八份指定規格由主代理本批完整網讀（refs118–121），清楚工作包見Plan。

W01只加HUD inventory分支與一次指定Node24.22.1 tsc，主代理審閱後W02新候選。純容量呈現，不改拾取／堆疊／SaveData，真UI未驗。保留作者TommyLamm、讀1–5寫5、dirty／舊成品／玩家資料；無新提交或發布／browser／server。02:40已刪除，07:50保留。

W01全新Luna Max `/root/plan37_hud_ui`完成，[報告](plan37-hud-ui.md)列指定Node24.22.1一次tsc exit0。主代理讀基線的唯一17行diff，核有／無player、>=28與低於閾值清理、continue避免AP/SP清理、原AP/SP段未改。

W02全新Luna Max `/root/plan37_candidate`完成beta44，[候選報告](plan37-candidate.md)與validator/audit既有logs經主代理核讀。Node24.22.1 build／固定pack／完整ZIP validate／Python3.11.9 audit各一次exit0。第一次prep路徑guard誤判於build前中止（metadata已更新），修正後未重寫metadata、未重跑正式checks，原log保留。ZIP 131,527,564 bytes、274 entries，SHA-256 `5599063ac50fd6d3b819221510c6ae839e88f2881321f11c537482292bbb58d6`，artifacts/plan37-1.0.0-beta.44。有限8類規則掃14 text／1,767,979 bytes，0 finding；260 binary／133,982,337 bytes未掃，非完整秘密稽核。

純呈現不加tests／DOM／browser；badge版面／跨閾值刷新／reader及遊戲操作仍未驗，不稱CANDIDATE_READY或平台通過。文件檢查後才規劃設定頁靜音與零音量說明，保留原audio/controller與onInput/onChange。

主代理一次文件引用檢查：6 documents／57 local links／6 anchors，0 failures，exit0，未追加遊戲檢查。
