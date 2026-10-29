# 20・基礎體驗：裝卸與單筆出售前的明確回饋

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。使用者後續要求「繼續優化實作」，已完成裝卸／單筆出售回饋及beta27新候選，作者同步為 `TommyLamm`。結果見[實作交接](reports/plan20-handoff.md)。W05沒有具體新環境，依原條件未啟動browser。下文只交計畫／尚未實作描述規劃當時，已由本次指令接續。

唯一現況見 [status](status.md#current-state)，來源與取捨見[規劃證據](reports/plan20-planning-evidence.md)，前批結果見[Plan19 交接](reports/plan19-handoff.md)。

## 1. 目標與基線

讓玩家在按下「卸下」或單筆「出售」之前，能看見既有 domain 會拒絕的原因。沿用 Plan19 購買預覽的只讀方法，不新增交易、裝備或存檔規則。

| 場景 | 目前 source 可確認的行為 | 本批目標 |
| --- | --- | --- |
| 32格滿，嘗試卸下已穿裝備 | 裝備卡有通用「需要空位」說明，但卸下按鈕無容量判定；domain 安全拒絕 BAG_FULL | 對該裝備顯示原因並停用卸下；有空位時正常可卸。 |
| 32格滿，從背包換裝 | domain 先取出背包裝備，再放回舊裝備，通常仍可交換；不能只看 bag.length 判定不能換裝 | 與 domain 同源，滿格但合法的交換仍可用；等級不足使用原錯誤回饋。 |
| 在商人處，單筆出售將超過金幣上限 | 背包／商店單筆出售只預先判 merchant；domain 在扣物品前安全拒絕超限 | 數量、收入、按鈕和可見原因一致；合法出售仍只送一次原 sell 命令。 |

這是靜態路徑確認，沒有本輪 browser 重現，不宣稱目前有扣款、物品遺失或資產漏洞。

基線：

- `brightwood-first-oath`／`1.0.0-beta.26`、desktop、四區18圖、Lv30、格式讀1–5／寫5。前批候選與 logs 見 [beta26 封包報告](reports/plan19-polish-candidate.md)。ID、SDK1.1.0／protocol1／schema2與固定工具1.2.0不變。
- HEAD仍為 `a20f4ac`，Plan19及本次修整在共享工作區，尚未commit；不得 reset、restore、clean 或覆寫其 dirty。beta24／25／26與QA profiles均保留。
- Plan19未變 helper 的4檔35 focused結果沿用；本次輸入修整後一次tsc、新候選build／pack／full ZIP validate通過。不把舊327項或上述檢查稱為本Plan20通過。
- 原唯一Terra於beta25的 `about:blank` 啟動重現 crashpad `0x6D` 即停止；beta26未重開browser。鍵位／數量單擊／背包焦點及新增面板視覺仍未驗。已知相同環境不反覆重試。

## 2. 排除與不變契約

不改價格、金幣上限9,999,999、背包32格、stackLimit、裝備需求、技能、戰鬥、藥水效果／冷卻、任務、地圖、掉落或任何 SaveData／Settings 欄位。不改SDK、雲端接入、Manifest裝置或存檔格式；不清資料。

沒有自動減少出售數量、最大出售、分批售出、二次確認、交易撤銷、排序、搜尋或新教學。**「出售全部素材」保持現有逐命令流程，不在本批改為原子交易、改順序或新增跳過政策；本批只承諾單筆出售。** 藥水的可用性涉及 app 的 `potionReadyAtMs` 與替代小／大藥路徑，不能僅靠 progression 結果宣稱同源，故延後。

保留 Plan19 數量草稿 clamp／blur 不重建路徑、重綁 repeat guard、背包 reconciliation與局部focus保護。不得重構全域panel signature、focus、HUD或鍵盤；不新增DOM框架或套件。

## 3. 共用行為契約

### 3.1 裝卸預覽

新增純 `previewEquipmentAction`，只接受 `equip {bagIndex}` 或 `unequip {slot}` 的窄 union、player、rules；直接調用 `applyProgressAction`，輸出 `{disabled, reason, code}`。不暴露／儲存成功的 result.value，不修改入參或派命令。不另寫滿格／換裝容量公式。

按鈕與點擊當下都用同一 helper；成功才 dispatch 原命令，不將預覽 player 套回。空裝備欄沿用不顯示卸下鈕，不新增空槽操作。裝備比較文字維持既有計算，這個包不改攻防比較政策。

### 3.2 單筆出售預覽

新增純 `previewSale`，輸入 player、rules、bagIndex、有效整數quantity及 `atMerchant`。先判既有UI merchant前置，再以原 `applyProgressAction(...,{type:'sell',bagIndex,quantity},...)` 取得domain結果。回傳 `{quantity,total,disabled,reason,code}`；total僅為該商品sellPrice×同一數量，不建立自己的金幣上限或可售數量算法。

UI數量沿用現有clamp到1..當前stack.quantity；不得套用購買的99上限或偷偷調到「剛好可售」。無效／過時bagIndex須安全回拒絕結果，不讀取不存在stack的欄位。merchant拒絕優先，其他錯誤保留domain code/message。helper不包含nearNpc判斷，真正app的商人距離與交易檢查仍是最終權威。

背包詳細區及商店出售列共用同一model，顯示收入與可見拒絕原因；點擊用最新view重新預覽，可用才派原sell。拒絕時不要刪除出售草稿；成功路徑沿用既有草稿清理與reconciliation。兩個面板同quantity的結果應相同。

## 4. 明確工作包與所有權

主代理負責定位、契約決策、審閱與唯一全局狀態，不把「改善物品體驗」泛指令交給Luna。所有實作／修復包使用**全新 `gpt-6-luna`／`max`／`fork none`**。真正browser／截圖／圖審使用**唯一全新 `gpt-6.1-terra`／`max`／`fork none`**；主代理加最多三個活動代理。

規劃時下列新增helper/test路徑不存在，實作開始仍查碰撞。不得覆蓋他人增量，報告僅寫本包真實結果。三條順序為：兩個獨立model→單owner UI→新候選；browser需符合W05前提。

### W00・主代理鎖基線

讀當前status／本plan／evidence、Git dirty、候選與前批交接。確認來源仍相容，指派下列檔案owner。不得為確認乾淨重跑35或327項，也不先開browser。若有source變動，只重新定位受影響符號。

### W01・裝卸純model（Luna A）

唯一可寫：新 `src/ui/equipment-preview.ts`、新 `tests/equipment-preview.test.ts`、新 `plan/reports/plan20-equipment-preview.md`。domain、UI及其他tests唯讀。

實作§3.1，公開輸入窄union與回傳type給W03。測試只涵蓋：有位卸下成功、滿格卸下BAG_FULL、滿格從背包單件裝備交換成功、未達裝備等級、空槽／過時index拒絕，以及成功／失敗均不改輸入player。用合法小fixture並比對真正domain結果；不開遊戲生成存檔。只跑此新test，domain未改不重跑progression全檔。

如果必須修改domain才可得到預期，不擴scope，回主代理確認；不自造容量公式或自動丟裝備。

### W02・單筆出售純model（Luna B，與W01並行）

唯一可寫：新 `src/ui/sale-preview.ts`、新 `tests/sale-preview.test.ts`、新 `plan/reports/plan20-sale-preview.md`。`trade-preview.ts`及其既有測試唯讀，保持buy API穩定。

實作§3.2。最小測試：merchant前置優先、正常收入、恰好到金幣上限可售／多一件拒絕、過時index、數量不足或不可售物、入參深比較不變。共用合法player，不建立完整遊戲或雲端mock。只跑此新test。total／quantity必須與回傳成功或失敗的同一action一致，不縮量重試。

不得將批次素材出售、計價平衡、存檔或新金幣常數加入包；若看到既有domain缺陷先交主代理。

### W03・單owner UI整合（兩helper釋放後，全新Luna C）

唯一可寫：`src/ui/index.ts`、`src/ui/journal.css`（僅必要面板內原因樣式）、新 `plan/reports/plan20-ui-integration.md`。helper／tests唯讀，不足由主代理重新分owner。

明確接線：

1. `buildInventoryPanel` 的裝備按鈕、`buildEquipmentPanel` 的卸下按鈕接W01；顯示同源disabled／title／可見原因；保留滿格合法交換及原空槽呈現。
2. 背包詳細及 `buildShopPanel` 單筆出售列接W02；數量、收入與原因同源。禁止改「出售全部素材」分支。
3. `handleAction` 的 `equip-bag`、`unequip`、`sell-bag` 用當前view重判後才dispatch原命令；blocked sale不刪草稿。不直改saveData，也不套用預覽player。
4. 保留這輪input/change/pendingBinding與Plan19焦點路徑；不以本包名義重構數量輸入、不碰buy、藥水快捷欄或HUD布局。

靜態核對這三條接線後跑一次typecheck；只有source再變或失敗才重跑相關檢查。helper未變，不重跑其已過test。不裝DOM框架、不寫只鏡像DOM結構的test。實際click/focus、可讀性、換行未驗要明寫。

### W04・新候選（全新Luna D）

source定案及必要focused／typecheck過後，主代理核對並指定一個高於beta26且未使用的版本與新候選目錄，**本plan不預占beta27**。只改package／lock根版本及public manifest版本，ID／devices／cloudSave不變。

一次build、既有固定tools1.2.0 pack、官方完整ZIP validate；Node24.22.1+且24系、現有lock。source／dist／ZIP識別與logs保存；有限文字掃描範圍照實記，不加fingerprint框架。舊beta25／26只讀、不發布、不commit。schema不能替代ZIP驗證。

### W05・必要局部QA（條件包，唯一Terra）

既有 `0x6D` 為已知啟動限制。**只有當次出現具體且可用的新執行上下文、或使用者明確要求有界環境對照時，才啟動browser**；不是每輪換profile重試。未符合前提，寫browser未驗並交付source／候選，不把它當需要刷舊任務或重跑自動檢查的門檻。

可啟動時由主代理指定新run／profile／不同game-host loopback ports、來源與候選。先讀Playroom iframe要求、[browser lifecycle](../tools/qa/browser-lifecycle.md)、[run record](../tools/qa/templates/run-record.md)、當次browser技能。以960×540單一短route驗：滿格卸下原因／滿格換裝允許，及一筆超上限出售拒絕／一筆正常單擊出售，before/after raw核對一次交易。不要測完整裝備矩陣。

合成前置仍需獨立有界Luna包、當前validator接受與provenance、空canonical guard；可引用Plan19生成方式，不能覆寫舊fixture或將town滿包前置冒充金幣上限前置。不得讀真profile、改private app state或把synthetic當正常通關。若有新增原因換行風險，最多追加640×360一個最擁擠面板，不做尺寸矩陣。

完整圖／raw／log存workspace，審圖每次1–2張、長邊≤1280 JPEG60–75。環境相同錯誤一次log即停；問題先交主代理判source／QA／env，確認source才開全新Luna修復。正常只關自己可核owner的session／server，保全profile；權限不可觀測明寫未知，不批次關閉／kill。

### W06・主代理交付

新 `plan/reports/plan20-handoff.md`、status唯一入口與plan索引，列實際source／候選、checks、沿用與未驗、owner／資源收束。不因model通過稱正式平台或CANDIDATE_READY。不自動開Plan21、排程、commit／push／tag／Release或平台上架。

## 5. 驗收與回退

W01／02各跑自己的focused；W03一次typecheck；W04一次build／pack／fullvalidate；W05僅條件成立的短route。不重跑未變buy／keyboard／bag helper或全327項；失敗先判與本次變動的關係，不擴大排障。

回退只撤本包可辨認的增量；原dirty、玩家存檔／Settings、profiles、raw、凍結候選不回退、不刪。預覽永遠不構成已完成交易的證據，真正app/domain與保存回應仍各守其契約。
