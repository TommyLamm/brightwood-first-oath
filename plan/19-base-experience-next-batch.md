# 19・基礎體驗第二批：鍵位可信、購買前回饋與背包操作穩定

建立：2026-10-28（Asia/Hong_Kong）。實作結果：**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。已依工作包完成三項改善，後續「持續優化」再修交易數量草稿及重綁repeat，最新候選beta26；beta25唯一Terra的有界啟動遭crashpad `0x6D`，後續不在相同環境重試，局部route仍未驗。實際交付見[交接](reports/plan19-handoff.md)，下一批 [Plan20](20-item-action-feedback.md)已寫好、尚未實作。下文「只交計畫」描述本Plan原規劃階段，規劃來源見[證據](reports/plan19-planning-evidence.md)，唯一當前狀態見[狀態入口](status.md#current-state)。

## 1. 目標與基線

這一批集中改善玩家已在做的三件事：設定一個實際能用的新按鍵、買東西前知道背包是否放得下，以及背包內容變動後不沿用另一件物品的選取／出售數量。不新增玩法、內容、素材或大型 UI 系統。

| 場景 | 目前靜態確認／缺口 | 預期玩家行為 |
| --- | --- | --- |
| 預設普攻仍用左 Ctrl，把背包改綁右 Ctrl | 設定 UI 只比對完整鍵碼；runtime 在一般查表前把右 Ctrl 視為普攻。設定可能接受一個不會開背包的鍵位；右 Alt／跳躍同類 | 設定與實際解析共用規則；若按鍵已被別名佔用，明確指出動作並拒絕該次變更。既有可用鍵不變。 |
| 在商人處、金幣足夠，但購買數量超過背包剩餘容量 | 購買按鈕只預先判商人／金幣；domain 已會安全拒絕 BAG_FULL，並無確認扣款或遺失缺陷 | 購買前就在該商品卡看見原因；32 格滿但同物品堆疊仍能容納時仍可買。 |
| 已選物品或填了出售數量，接著出售／裝備使背包 splice | UI 選取與數量以 bagIndex 保存；沒有跨 render 的背包結構 reconciliation | 槽位結構變了就清除可能指向另一件物品的暫存狀態；只改同一堆疊數量時保留合理選取並夾限數量。 |

以上是 source 路徑與狀態模型的靜態確認，**不是本輪 browser 重現**。第一項有直接解析優先序矛盾；後兩項是回饋／UI 狀態改善，不宣稱當前有經濟漏洞或已發生誤售。

基線固定：

- HEAD `a20f4ac`；Plan18 與前期全部可追蹤工作已分組提交。規劃前 `git status --short` 無輸出，根無 `.codegraph/`。
- 遊戲仍 `brightwood-first-oath`／`1.0.0-beta.24`／desktop／Lv30／四區18圖／讀格式1–5寫5。沿用 [beta24 候選與限定視審](reports/base-experience-handoff.md)，不重新裁定已過項。
- 上一輪 [45 檔327項、typecheck、content、隔離 build](reports/workspace-commit-validation-20261028.md) 是已保存的歷史結果；本規劃未重跑。
- Plan18 的 [browser lifecycle](../tools/qa/browser-lifecycle.md)、[run record](../tools/qa/templates/run-record.md)、[overlay 配方](../tools/qa/overlay-review.md)已可用；fixture 只在真正需要相同 portal 前置時使用，本批不為使用它而重開 portal case。

## 2. 明確排除

不改傷害、技能／600ms buffer、掉落、價格、金幣上限、堆疊上限、32 格容量、任務進度或地圖。沒有自動購買、最大購買快捷鍵、背包排序／搜尋、售出確認系統、批次隊列、撤銷交易或新教學流程。

不改 SaveData、存檔格式、SDK、Manifest 裝置宣告或雲端契約；不自動修正／遷移舊玩家的衝突綁定，不清除玩家資料。保留 Esc、焦點恢復閘門、對話按鈕防 repeat、快捷欄圖示身份及 beta24 toast 已過版面。

不重構整個 `src/ui/index.ts`、全域 focus 系統或 panel signature，不加套件／DOM 測試框架，不擴尺寸矩陣。正式平台、真帳號雲端、音訊、真 OS 焦點、正常 portal 行走及舊 q09/q10 未重演仍保留原界線，並非本批硬門檻。

本輪**只交計畫**，不修改遊戲／版本、執行 QA、commit、push、tag、發布或建排程。下列為收到後續實作指示後的工作包，不是已啟動工作。

## 3. 三項共用契約

### 3.1 按鍵解析與衝突

沿用 `KeyboardInputState.setBindings` 的 defaults＋override 解讀、合法 code 篩選及既有優先序；不要用另一套散落的 `{...defaults,...overrides}` 猜有效綁定。可把現有純步驟抽成 `resolveEffectiveBindings(overrides)`，再讓 keyboard 與 UI 共用。

保留現有非對稱別名：普攻綁 ControlLeft 時也接受 ControlRight；跳躍綁 AltLeft 時也接受 AltRight。改綁成右鍵單鍵時，不自行新增反向左鍵別名。共享 helper 提供「此動作實際接收哪些 code」與「此候選會與哪個其他動作衝突」，衝突要考慮雙向影響：

1. 現有 attack=ControlLeft，候選 inventory=ControlRight：拒絕，指出普通攻擊。
2. 已把 attack 移到 KeyX、inventory=ControlRight，候選 attack=ControlLeft：拒絕，指出背包；不能藉新增右 Ctrl 別名搶走它。
3. attack=KeyX，候選 inventory=ControlRight：允許；Alt／jump 同原則。
4. 同動作改用自己目前的右側別名可允許，其他動作不可被奪走；Esc 仍由既有 UI 保留規則拒絕。

設定 UI 顯示此共享判定的實際動作中文名。既有存檔的解析結果保持相容；載入舊衝突資料時不靜默改存檔，新增指派走新檢查即可。按鍵提示要忠於有效 code：預設雙側別名可寫「左／右 Ctrl」，只綁右側時顯「右 Ctrl」；設定內技能快捷說明改由實際 skill1–3 鍵位產生，不固定寫 1／2／3。無角色時仍顯預設鍵。

### 3.2 購買預覽與真正交易

新增 UI 純 model，對商品／數量呼叫既有 `applyProgressAction(player,{type:'buy',itemId,quantity},rules)` 取得可否購買及原錯誤；該函式先驗證、clone player 後才改 draft。只讀取結果，**不能把預覽回傳的 player 寫回遊戲**。

預覽輸入使用當次商品卡相同的有效數量：可堆疊品1–99、非堆疊品1。先判是否正與 merchant 互動，再用 domain 的價格／容量判定；不再寫一份 stack 容量公式、不做1–99遍歷找最大值。可回傳 `{quantity,total,disabled,reason,code}` 給商品卡使用，禁止另存「預覽已成功」作交易憑證。

按鈕、總價、可見原因與真正 dispatch 的數量必須一致。點擊時用最新 view 再作同一預覽；可購買才 dispatch 既有 buy 命令。真正 app/domain 仍是最終權威，不能因 UI 預覽繞過商人、背包或金幣檢查，也不直接修改 bag/coins。

保留原數量輸入的正常打字與單擊購買行為；已有註解記錄 blur 重建會吃掉 click，禁止改回 change 時無條件 replaceChildren。若本包沒有證據要修改輸入生命週期，就不重構它。非法草稿需在提交邊界使用原有效整數規則，不讓 NaN／負數／超過99送進預覽或命令。

### 3.3 背包暫存狀態與槽位身份

新增純 `reconcileBagViewState`：比較前後 bag 的**有序 itemId 序列及長度**，不要用物件 reference 當結構證據，因 snapshot 可能 clone。輸入／輸出只含 bag、selectedBagIndex、sellQuantities；不更改 bag、不新增 stack UUID 或存檔欄位。

- 序列與長度相同：有效 index 的選取保留，出售數量夾至該 stack 現有數量，刪除無效 index；無內容改變的 render 不清草稿。
- 序列或長度改變：selectedBagIndex=null、清 sellQuantities；顯示「請重新選取物品」的面板內短提示（只在原先有受影響狀態時），不沿用舊槽號操作另一種物品。不猜測跨槽重映射，也不引入選取第一件的自動 fallback。
- 新角色／回標題／切換已載入進度／dispose 清 transient state；暫停、恢復或一般 panel 重畫不視為換角色。

UI 需在建立 panel signature／內容前 reconciliation。結構改變時，舊的 bag-index focus key 或數量 value 不能由 `preserveFocus` 還原到另一件物品；若受影響欄位原有 focus，就退到該面板穩定的 heading／選取區，不搶遊戲 canvas 或讓按住 Enter 觸發另一個出售鈕。不要因這個局部規則修改對話或恢復焦點系統。

## 4. 可直接派工的工作包

主代理負責分析與決策，不把「改善 UX」這類泛指令丟給 Luna。實作包一律**全新 `gpt-6-luna`／`max`／`fork none`**；所有 browser／截圖／圖審一律**全新 `gpt-6.1-terra`／`max`／`fork none`**，最多一名，browser 單 owner。

規劃時確認下列新增 helper/test 路徑不存在；實作當次仍須先查碰撞。各包只改自己的增量，不 reset／restore／clean 其他檔。report 只寫該包實際結果、來源、限制與下一步；全局狀態仍由主代理獨占。

### W00・鎖定實作基線（主代理）

讀本 plan、evidence、最新 status 與 Git dirty；分配各新檔 owner，確認基線仍相容。先將下列 helper 邊界交清，不預先改遊戲或分配三名代理共同編輯 UI。若 source 已有後續變更，僅重新定位相關符號，不重跑既有327項來「確認乾淨」。

### W01・鍵位有效映射與衝突 helper（P1，Luna A）

**唯一可寫：** `src/app/keyboard.ts`、新 `tests/key-bindings.test.ts`、新 `plan/reports/plan19-key-bindings.md`。`src/ui/index.ts` 唯讀，留 W04。不得改 persistence、Settings schema、預設鍵、app/main 或其他 keyboard tests。

**任務：** 抽取／公開 §3.1 所需的有效映射、實際 code 集合與候選衝突純 helper；`KeyboardInputState` 本身改用同一有效映射步驟，保持舊解析結果與別名優先序。明確寫出 helper export 與回傳型別供 W04 使用，結果不能包含 DOM、中文 UI 或 side effect。

**最小驗收：** 新檔測 exact duplicate、左右 alias 正反衝突、移開 attack/jump 後右側釋放、同 action、右側單鍵及原 defaults；另以實際 `KeyboardInputState.keyDown/consumeMovementFrame` 證明合法新鍵真的可用、原左右鍵／文字輸入規則不退化。只跑新檔與既有 `tests/integration/app-foundation.test.ts`；若沒有動 context/focus，原 focus 套件不重跑。

**停止：** 若要改讀檔／遷移舊 Settings 才能完成，停止並交主代理，不能自行重寫玩家 bindings。helper/test/report 完成即釋放 keyboard 檔。

### W02・購買前置純 model（P2，Luna B）

**唯一可寫：** 新 `src/ui/trade-preview.ts`、新 `tests/trade-preview.test.ts`、新 `plan/reports/plan19-trade-preview.md`。`src/domain/progression/index.ts`、UI、經濟／背包資料均唯讀。

**任務：** 實作 §3.2 的只讀預覽；重用 domain Result，不新增扣款、timer、dispatch 或 preview cache。給 W04 明確 import/type、merchant/quantity/reason 優先序及輸入契約。

**最小驗收：** 非商人、金幣不足、32 格已滿且無空間、滿格但同品未滿堆疊可放、數量剛好放得下與多1放不下、1件裝備需1空位，以及輸入 player 深比較不變。用同一合法小 fixture 覆蓋這些核心分支，不開遊戲生成進度。只跑此新檔；domain 沒改就不重跑整份 progression。

**停止：** 若 domain 本身有確認缺陷，回主代理分析，不把修 domain 包進來；不得靠新容量常數或複製完整 buy 分支繞過。

### W03・背包選取／數量 reconciliation（P2，Luna C）

**唯一可寫：** 新 `src/ui/bag-view-state.ts`、新 `tests/bag-view-state.test.ts`、新 `plan/reports/plan19-bag-state.md`。UI 與 gameplay/progression 唯讀。

**任務：** 實作 §3.3 純狀態轉換，回傳下一選取、數量 map 及 `structureChanged`／受影響狀態標記。map 與 bag 原輸入不可被 mutate；明確告訴 W04 何時 reset、何時可 preserve focus/value。無個人 profile／存檔操作。

**最小驗收：** 新物件但同內容不 reset；同 itemId 只減量夾限；移除前槽、選取槽、最後槽；新增／變更 itemId；重複 itemId 堆疊仍以結構而非想像的唯一ID處理；清空 bag。用少量表格案例共享 fixture，不為每個 render 建測試。只跑新檔。

**停止：** 不寫排序、stable item UUID、跨槽推測或資料遷移；需要超出 UI 暫存狀態時交主代理。

### W04・單一 UI 整合（P1，三 helper 定案後的全新 Luna D）

**唯一可寫：** `src/ui/index.ts`、`src/ui/journal.css`（僅必要面板內原因／提示樣式）、新 `plan/reports/plan19-ui-integration.md`。W01–03 helper/test 唯讀；若 API 不足由主代理重分 owner，不在此包偷改。

**明確改點：**

1. `onKeyDown` 重綁使用 W01 的衝突 helper，保留 pendingBinding 的取消／成功與面板離開清理；`getKeyBadgeText`、設定技能說明顯真鍵位與左右限制。Esc、default reset 與 focusResume/save blocker 不改。
2. `buildShopPanel` 用 W02 統一總價、disabled/title 與可見原因；`handleAction buy` 用最新 view 與相同有效數量再確認後才 dispatch 原命令。禁止把 preview player 套回遊戲。
3. `render` 在 signature 前接 W03；清理／保留選取與數量按契約；對受影響的 numeric focus key 局部抑制舊 value 還原，給穩定面板位置，不波及 dialogue／resume 的 focus。
4. 不碰 HUD profile/hint/toast/actions/quickbar/footer 定位、不重新設計商店，不新增排序／最大購買／二次確認或新的進度入口。

**最小驗收：** 靜態逐點核 helpers 真的接到這三條路徑，跑一次 `typecheck`；helper 檔未再改，不重跑三份已過測試。不安裝 jsdom 或新增只複述 DOM 實作的測試；實際 focus／單擊行為留 W06 的極短 route，未做不能寫 PASS。

**停止：** 發現原輸入 click 被吃掉、模型結果與 UI 不一致等，由主代理先判 scope；最多修受影響函式，不把 panel signature 整體換掉。報告列實際改點、樣式與未驗。

### W05・必要新候選（全新 Luna E）

W04 source 定案且必要 focused/typecheck 過後才開始。主代理在當次確認未使用的下一版本（預期在 beta24 之後，不預先占用），分配新候選目錄及 `plan/reports/plan19-candidate.md`。

只改 `package.json`／lock root metadata／`public/game.json` 的版本（ID、devices、cloudSave 不變），一次必要 build、固定 Playroom tools1.2.0 pack、官方完整 ZIP validate；使用 Node24.22.1+且24系、現有工具 lock。schema 不代替 ZIP validate，不改工具包或新增 fingerprint 平台。beta24與其他凍結成品不覆寫，不發布。

只有 source 又改或相關步驟失敗才重做對應檢查；沒有新候選就不能聲稱 source/ZIP/實畫一致。runtime 變更不沿用 beta24 ZIP 當本批成品。

### W06・一個必要的局部操作 route（唯一 Terra）

所有模型／UI／候選完成後，主代理指定新 run ID、candidate、不同 game/host loopback ports 與 report `plan/reports/plan19-local-review.md`。Terra 先讀 W01–04 短 report、Plan18 lifecycle/run-record及當次 browser 技能。只用新 profile/origin，新跨來源子目錄 sandbox iframe；有界啟動與 owner/cleanup 均沿 runbook。

主要尺寸960×540，僅一段 route：

1. 設定內一次右 Ctrl 衝突拒絕＋一次合法重綁，核提示／key guide／實際動作同源；預設或其他按鍵未變不全測。結束恢復該隔離前置，不改真玩家設定。
2. 商人前置下，觀察一個容量不足原因及一個「滿格但可補現有堆疊」可買 case；輸入數量後單擊一次購買，確認數量／總價一致，before/after raw 的 bag/coins 符合本次交易。合成前置需來源與 validator 接受證據，不能沿用 portal fixture 冒充商店進度。
3. 原選取後移除一個較前方 stack，確認選取／出售數量不轉移到別物；仍在數量輸入 focus 的相鄰操作不吃 click、不意外第二次出售。

fixture 不存在時，主代理先分配一個有界、獨立的新前置包：新 output run 內由 validator 接受的小型 synthetic格式5商人／背包前置、provenance與空 canonical guard，再釋放給 Terra。不得讓 Terra 臨場猜造存檔、改 private state 或使用真 profile。若自然短操作即可建立，不必 seed。這是後續 QA 依賴，不是本規劃已交付 fixture。

畫面檢查僅設定／商店／背包面板與其直接關閉鈕／原因文字；如 W04 改文字換行／新原因布局，在640×360追加一個最擁擠的新面板狀態，同一張圖看直接鄰居，不再重測 beta24 portal。1–2張必要縮圖、長邊≤1280、JPEG60–75；完整圖/raw/log保存在 workspace。不做 full regression／新尺寸矩陣。

啟動環境相同錯誤留一次log後停止，列實畫未驗，不換 profile 長排障、不自動升權。操作／raw不一致先交主代理分析source/QA/env，Terra停止輸入；確認source問題才交新Luna修。run結束放鍵／正常pause／保全raw／指定session close／server專屬session Ctrl+C，觀測受限記未知。

### W07・收束（主代理）

更新唯一狀態入口、plan索引及新 `plan/reports/plan19-handoff.md`；列玩家前後行為、source/candidate、實際測試／QA、沿用結果、未驗、owner與清理。工作包完成與遊戲驗收分層記錄，不因文件或helper過測就稱完整可發布。

## 5. 並行、依賴與檔案互斥

| 階段 | 配置 | 結束條件 |
| --- | --- | --- |
| A | 主代理 W00 | 基線／helper 契約／路徑 owner 鎖定。 |
| B | 主＋最多3名全新 Luna：W01／02／03 | 三包互不改共享 UI；各自 focused/test/report 完成並釋放檔案。 |
| C | 主＋全新 Luna D：W04 | 單 owner 整合 UI，不以填槽位為由並行改同檔。 |
| D | 主＋全新 Luna E：W05；必要時另一 Luna 做新 QA 前置 | source 凍結，candidate／新前置報告定案後釋放給 Terra。 |
| E | 主＋唯一 Terra：W06 | 如有修復需求，Terra停輸入→主分類→新Luna；同候選不可邊改邊驗。 |
| F | 主代理 W07 | 精簡交接與狀態完成後停，不自行新增下一批。 |

最多四槽含主代理；Terra活動時最多另兩Luna，但不因此建立多餘任務。每次派工重述可寫檔、禁止範圍、具體例子、依賴、最小檢查及停止條件，不只轉貼籠統目標。

## 6. 驗證與風險控制

這一輪規劃只做新文件／新引用存在性及分工範圍核對，不執行tests、browser、typecheck、build、pack或重算舊hash。

後續實作只跑受影響 helper 的 focused 測試；W01因改 keyboard 加既有foundation檔。UI整合後一次typecheck；候選定案後一次必要build/pack/fullvalidate，再一個局部route。正常情況不重跑全部327項；若使用者明確要求全測，再依當次範圍執行。`vitest.config.ts` 已排除 `.worktrees`，不可把舊工作樹失敗當本遊戲缺陷。

| 風險 | 有界控制／回退 |
| --- | --- |
| 重綁修正改掉舊玩家操作 | 保留既有runtime解析與別名，僅阻止新不可用指派；不遷移Settings。鍵碼集合測試＋實際KeyboardInputState接線驗證。 |
| 預覽自行模擬經濟導致漂移 | 直接調用現有純domain action且丟棄回傳player；不新增容量公式或最大值搜尋。真正buy仍走原命令。 |
| 選取reset過度干擾正常編輯 | 結構比較不用reference；只有數量變動保留selection並clamp；同內容render不清草稿。 |
| 舊focus/key或value落到不同物品 | reconciliation先於signature；只阻止受影響bag-index控制的restore，局部穩定fallback，不重構全focus。 |
| 合成前置被當正常玩法／雲端證明 | 新隔離origin、validator/provenance、candidate guard、raw與正常操作分開記；無證據即未驗。 |
| 多人同改UI／成品 | W01–03不碰UI；W04獨占；source定案再pack與Terra；只撤本包增量，不reset其他人或覆寫舊候選。 |

本批來源回退僅撤各包可辨識增量；玩家資料／Settings／profiles／raw／舊成品不回退、不刪除。未成功的局部QA保留報告，不能用重置遊戲、重刷任務或放寬通過標準來收束。

## 7. 本規劃交付與下一步

本 plan 及[證據文件](reports/plan19-planning-evidence.md)由主代理編寫；規劃階段未派子代理。後續獲實作指示，按上述 owner 範圍交全新 Luna Max 實作、單一 Terra Max 做必要 browser，結果見[實作交接](reports/plan19-handoff.md)。

本批 source 與新候選已交付，實際自動檢查及 browser 環境限制見交接；未 commit 或發布。先前327項與 beta24 視審仍是歷史結果，本批未重跑，亦不代替 beta25 的未驗操作。沒有新增下一批計畫或排程。
