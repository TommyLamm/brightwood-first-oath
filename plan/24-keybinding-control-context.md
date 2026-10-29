# 24・基礎體驗：重綁按鈕的動作與目前鍵位說明

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。重綁控件上下文及beta31已交付，見[實作交接](reports/plan24-handoff.md)。依使用者持續建立Plan並實作、直到要求停止的指令，在 [Plan23交接](reports/plan23-handoff.md)後完成本批，可接續下一個Plan。唯一現況見 [status](status.md#current-state)。

## 來源與目標

主代理讀 [UI](../src/ui/index.ts) `buildSettingsPanel` 的KEY_ACTIONS迴圈（2944附近）：每列視覺上有動作名稱、目前有效鍵位badge及重綁鈕，但所有按鈕只有相同「更改按鍵」／「按鍵中…」名稱，缺少單獨定位的操作對象；row沒有群組名稱。既有 `effectiveKeyText` 已處理Plan19有效鍵位及alias，直接重用。`onKeyDown`（1962附近）在pending時會以Esc取消；本批提示可如實說明這條既有行為。

音量slider已有aria-label／百分比aria-valuetext，綁定訊息已有role=status，沒有必要重做。本批只補重綁控件上下文，不新增交互或修改鍵位政策。這是靜態可見名稱觀察，未實測screen reader效果。

基線beta30／作者TommyLamm／ID brightwood-first-oath／desktop、四區18圖／Lv30、讀格式1–5寫5、SDK1.1.0／protocol1／schema2／固定tools1.2.0保留。HEAD a20f4ac與Plan19–23共享dirty、所有舊候選／玩家資料／QA profiles不還原、不覆寫。主代理本新批次完整網讀Playroom範本及七份main指定文件，截斷尾段補讀，沒有失敗；適用固定ID、相對資源、iframe、存檔相容及新版本候選要求。根無.codegraph，目標式讀檔。

## 呈現契約

只在buildSettingsPanel的KEY_ACTIONS迴圈內：

1. 原row加role=group，以動作label及現有effectiveKeyText產生名稱，例如「向左移動，目前按鍵 ←」。不增加id或全域命名空間。
2. 原rebindButton保留可見文字、class、actionId及 `binding-<action>` focus key；用aria-label及title標明動作與目前鍵位。一般狀態如「更改按鍵：向左移動，目前按鍵 ←」；pending狀態名稱必須保留可見「按鍵中」語意，且包括動作、目前鍵位及「按 Esc 取消」。不得硬寫實際可重綁鍵。
3. 原bindingMessage、role=status與插入位置保留，不新增live region／aria-describedby／持久化ID或重複朗讀來源。不改DOM順序、不新增元素或控制鈕。

不使用aria-pressed把此動作鈕改成切換鈕。不改重綁handler、conflict／repeat guard、Esc行為、key label helper、鍵盤、volume／mute／reset、focus或Settings儲存；不增helper、CSS、套件或測試。

## 明確工作包

主代理負責契約、審閱與唯一現況；實作／修復使用全新 `gpt-6-luna`／`max`／`fork none`。本批先UI後候選，最多主代理加三名活動代理，不為並行派多人改共享UI。

### W00・主代理

已鎖來源與範圍，保存本批UI基線；先派W01，完成局部審閱後才產候選。本批交接完成後再開下一個Plan。

### W01・重綁名稱與群組（Luna A）

唯一可寫：`src/ui/index.ts` 中buildSettingsPanel的KEY_ACTIONS迴圈、新 `plan/reports/plan24-keybinding-ui.md`。其他函式、handlers、CSS、helpers、tests及app/domain唯讀。按以上三條契約增加屬性，沿用已計算的value及state.pendingBinding，不複製有效按鍵解析。

只執行一次tsc。這是名稱／title／role呈現修整，不新增／執行測試、browser、screen reader、DOM或截圖；不重跑Plan19鍵盤測試。報告實際命令、結果與未驗界線，不稱真實輔助閱讀通過。

### W02・新候選（全新Luna B）

W01完成且主代理審閱後，指定高於beta30、未使用的新版本／新目錄，不預占beta31。唯一可寫package／lock根版本、public manifest版本、新候選、新 `plan/reports/plan24-candidate.md` 與本批tmp／logs；作者／ID／devices／cloudSave／固定工具不變。

使用Node24.22.1+且24系，一次build／固定tools pack／完整ZIP validate。沿用前批source／dist SHA清單、ZIP識別、metadata一致性與有限文字掃描／未掃範圍；可複製前批一次性audit改路徑，原檔不改。不造框架、不重掃舊候選；不跑tests／browser、不重跑tsc、不commit／push／tag／發布。

### W03・主代理交接

新 `plan/reports/plan24-handoff.md`，更新Plan狀態、status唯一入口與README；核對diff限迴圈屬性、原handler／focus未變。只查本批文件引用，列實際source／候選及未驗。依低風險呈現與最小驗證要求略過browser，不重試0x6D；保持BROWSER_UNVERIFIED。完成此批後接續下一批。

## 完成條件

主代理讀局部diff、一次tsc、新候選一次build／固定pack／完整ZIP驗證通過。不以此代替真keyboard／screen reader／layout驗收，也不標平台通過。原dirty、資料、候選與QA資源保全，不發布或建排程。
