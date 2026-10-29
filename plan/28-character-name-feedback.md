# 28・基礎體驗：建立角色的名稱即時回饋

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan27完成交接](reports/plan27-handoff.md)後完成名稱回饋及beta35，見[實作交接](reports/plan28-handoff.md)。依使用者持續指令接續下一批。唯一現況見[status](status.md#current-state)。

## 來源與目標

主代理讀[UI](../src/ui/index.ts)captureNameInput／renderScreen showCreate／create-confirm／onInput：輸入保留maxLength16與角色名稱label，確認按鈕只檢查trim後非空，沒有鄰近名稱驗證提示。新遊戲在[app](../src/app/gameplay.ts)startNewGame才用[domain](../src/domain/progression/index.ts)validatePlayerName拒絕空白／控制字元，成功回trim名稱；沒有唯一性或伺服器查名規則。本批直接共用這個validator，提前顯示錯誤與實際將使用的名稱，保留原雙重取代確認。

這不是新增命名政策。無新長度、字元白名單、截斷、轉大小寫或伺服器查重；不修改domain／app／存檔。輸入中可見提示用textContent／原makeElement文字參數，不能插HTML。

主代理本新批次完整網讀Playroom範本及game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning、save-compatibility，截斷尾段補讀、無失敗。適用固定ID／相對資源／iframe／存檔相容／新候選。保留brightwood-first-oath／作者TommyLamm／desktop／四區18圖／Lv30／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0，基線beta34、HEAD a20f4ac與共享dirty／舊候選／真資料／profiles保全。根無.codegraph，目標式讀檔。

## 精確呈現與流程契約

1. index.ts匯入既有validatePlayerName。在建立角色卡原input正後方新增**一個**p feedback，ID為brightwood-first-oath-character-name-feedback；每張卡只有此一節點，不新增表單／元素包裝／timer／live region。無錯時用ms-panel-note與「建立後將使用名稱「正規化名稱」。」；錯時用ms-warning與validator原message。不稱名稱可用或已保存。
2. 原input保持value／maxLength16／placeholder／autocomplete／focus key／aria-label，增加aria-describedby指向feedback ID及aria-invalid=String(!checked.ok)。不改正在輸入的值、caret／selection，也不自動trim回輸入。
3. renderScreen showCreate時以當前nameDraft驗證，填入feedback與aria狀態；最終「確認建立角色／確認取代並建立」disabled依!ok，title拒絕時原message，成功可空字串。**第一階段「我了解，繼續確認」沿原enabled／流程**，不能因名稱無效跳過或更換雙重確認。兩階段皆顯示同一名稱回饋。
4. 原character-name onInput分支更新nameDraft及lastScreenSignature後，就地同步input aria、既有feedback文字／class與最終確認鈕disabled／title，沿原(!currentView.saveData || replaceConfirmed) gate；不呼renderScreen／focus、不重建input，不干擾輸入法composition或keydown。可用createUi內一個小局部presenter共用文字／屬性更新，勿另造validation model或框架。
5. create-confirm保留clearTransientViewState及第一階段分支原順序。只有最終步驟呼validatePlayerName(nameDraft)；錯誤即return，保持createRequested／replaceConfirmed與draft，不dispatch、不focusGameCanvas；成功才沿原狀態清除與newGame dispatch，但name直接用checked.value，與app normalization一致。取消／title／其他screen及真正新遊戲資料寫入仍原路徑。

## 明確分工與最小驗收

主代理保存UI基線、審閱與交接；實作／修復全新gpt-6-luna／max／fork none，不派模糊探索任務。

### W01・名稱UI與送出guard（Luna A）

唯一可寫src/ui/index.ts的validator import、上述createUi局部presenter（如需）、captureNameInput、showCreate卡、create-confirm及character-name onInput分支，新plan/reports/plan28-name-ui.md；其他helpers／handlers／CSS／tests／app／domain／metadata唯讀。共享dirty保留。讀原測試但不新增鏡像測試。

只精選既有tests/progression.test.ts的`validates plain player names and creates the specified starting character`一次，驗共用validator核心；之後一次tsc。這兩者不證明UI互動。若失敗只處理與本批直接相關問題，不跑其他progression／app／suite、DOM／browser／build，不為低風險畫面文字例行重試0x6D。回報實際命令exit、剩餘略過數及未驗。

### W02・新候選（全新Luna B）

W01通過主代理審閱後，指定高於beta34且未用的新版本／目錄，不預占beta35。只改package／lock根版本與public manifest版本、本批新候選／tmp logs、新plan/reports/plan28-candidate.md。一次Node24.22.1系build／固定pack／完整ZIP validate／前批audit路徑副本；記source／dist SHA清單、六處metadata一致、ZIP識別、有限文字scan／未掃範圍。不覆寫舊成品、不重跑W01、不browser／server／commit／push／tag／發布或排程。

### W03・主代理整合

讀局部diff，核雙重確認／取消保留、invalid最終不派送不清draft、success原命令且checked.value；確認feedback只有一份、輸入就地更新與文字安全。新增plan/reports/plan28-handoff.md，更新Plan／status／README，僅一次本批文件引用檢查。精選名稱案例／tsc／新完整ZIP驗證通過完成source／ZIP交付；真輸入法、caret、tooltip、click、讀屏與layout列未驗，不稱平台通過。完成本批交接後再開下一批。
