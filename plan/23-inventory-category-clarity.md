# 23・基礎體驗：背包分類與格位說明

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。背包分類文字／aria及beta30新候選已交付，見[實作交接](reports/plan23-handoff.md)。依使用者持續規劃並實作、直到要求停止的指令，在 [Plan22完成交接](reports/plan22-handoff.md)後完成本批，接續下一個Plan。唯一現況見 [status](status.md#current-state)。

## 目標與來源證據

本批只改善背包分類的文字與無障礙屬性；不改物品排列、篩選結果或操作。

主代理已讀 [UI](../src/ui/index.ts) 的 `buildInventoryPanel`（2357–2445附近）及分類click路徑，確認：

- 分類鈕只有is-active class，沒有aria-pressed或群組名稱。
- filtered列表保留真正bagIndex，但物品aria-label使用分類壓縮後的index+1稱「背包第N格」，與原格位不一致。
- 分類中的顯示空位一律稱「空背包格」，容易和真正剩餘容量混淆；上方總已用格數仍正確。
- 背包為空、某分類無物品及有物品但未選取，右側都顯示「選取一件物品」，缺少當前狀態說明。

這是靜態文字／屬性觀察，未做browser或screen reader實測，不宣稱目前物品操作index有誤。真命令一直使用原bagIndex，本批只讓描述與它一致。

基線beta29／author TommyLamm／ID brightwood-first-oath／desktop、四區18圖／Lv30、讀1–5寫5、SDK1.1.0／protocol1／schema2／固定tools1.2.0維持。HEAD a20f4ac及Plan19–22共享dirty、所有玩家資料／QA profiles／舊候選保全。主代理本新批次完整網讀Playroom範本與七份指定main文件（截斷尾段補讀），沒有失敗；適用固定ID、相對資源、iframe、存檔相容及新候選不可覆寫要求。根無.codegraph，目標式讀檔。

## 明確呈現契約

1. categoryBar以group及「背包分類」aria-label標識；五個原分類鈕保留label、action、kind、class及focus key，依原inventoryFilter設aria-pressed字串true／false。不改成tab角色或新增方向鍵行為。
2. 直接沿用原filtered結果顯示當前分類名稱與物品組數（filtered.length，組為stack，不是件數）。非全部分類可補「其他分類的物品仍計入已用格數」；不為計數另寫一套篩選器，也不在每個分類鈕加重算計數。
3. grid aria-label區分全部背包與目前分類，包含顯示組數。物品aria-label以原bagIndex+1表示背包格位；data-bag-index、選取／交易命令及focus key一律不改。
4. 全部模式空位仍稱空背包格；分類模式僅稱分類顯示空位，不把被隱藏的物品說成已移出背包。原32格渲染、空位數字與CSS保留。
5. 右側未選取時分三種文字：總bag為空→「背包目前是空的」及探索拾取說明；bag非空但filtered為空→「此分類沒有物品」並指向原「全部」分類；filtered有物品但未選取→保留原選取說明。已選取詳細區完全保留。

不要硬寫可重綁的快捷鍵；不新增重置按鈕、focus路徑、live region、排序搜尋、分類持久化、unknown item政策或容量公式。不改helper、app、domain、交易、領獎或存檔。

## 分工與所有權

主代理負責契約、局部diff審閱、唯一現況與交接。實作／修復使用全新 `gpt-6-luna`／`max`／`fork none`。本批兩包有依賴，先UI後候選，不為並行給多人同改UI。

### W00・主代理

已鎖beta29來源與實際證據；保存UI局部diff基線、保留原dirty。交付本Plan再派W01；本批完成後才開下一批。

### W01・背包呈現（Luna A）

唯一可寫：`src/ui/index.ts` 的 `buildInventoryPanel` 及新 `plan/reports/plan23-inventory-ui.md`。CSS、click handlers、其他函式、tests及所有helper唯讀。只按上述五條呈現契約修改；沿用現有ms-panel-note等樣式，不建新component／helper。

主代理靜態核對：全部／裝備／空分類的label、bagIndex標籤、空位措辭、原已用容量、原選取／交易／focus資料屬性未改。**文字與aria屬性變更不新增或執行測試、不啟動browser、不跑全suite**；只做一次tsc作此大檔的低成本型別檢查。報告實際改動／命令／結果及未實測screen reader／click／排版。

### W02・新候選（全新Luna B）

待W01完成及主代理讀diff接受後，指定高於beta29且未使用的新版本／新候選路徑，本Plan不預占beta30。唯一可寫package／lock根版本、public manifest版本、新候選、新 `plan/reports/plan23-candidate.md` 與本批tmp／logs。作者、ID／devices／cloudSave／SDK／固定工具不變。

Node24.22.1+且24系，一次build／固定pack／完整ZIP validate；沿用簡單source／dist SHA清單、ZIP識別與metadata核對、有限文字掃描及未掃範圍。可複製前批一次性audit腳本改新路徑，原檔不改；不新增框架／重掃舊候選。W01已過tsc不重跑，不執行tests或browser、不commit／push／tag／發布。

### W03・主代理交接及下一批

新 `plan/reports/plan23-handoff.md`，更新本Plan完成狀態、status唯一入口及README，列source／候選、實際檢查及未驗。只查本批文件連結。本Plan為小範圍呈現改善，browser與screen reader實測略過，保留BROWSER_UNVERIFIED；不因已知0x6D重試環境。完成此批後依持續指令規劃並實作下一個Plan。

## 最小驗收及界線

主代理局部diff、一次typecheck、新候選一次build／固定pack／完整ZIP validate為本批完成條件。不跑Plan22或更早focused、不加DOM測試／截圖矩陣。沒有發布、排程、真資料變更或凍結成品覆寫。UI可讀性、真鍵盤／screen reader、browser實際操作均未實測，不能由文字審閱或封包驗證宣稱通過。
