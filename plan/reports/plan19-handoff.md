# Plan19 實作交接

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。使用者要求「開始實作」及「繼續」，主代理依 [Plan19](../19-base-experience-next-batch.md) 分派並完成 source／候選收束，唯一全局現況仍在 [status](../status.md#current-state)。

## 後續輸入修整與beta26

使用者再要求「持續優化，完成後就寫下一個Plan」。主代理重新完整網讀Playroom範本與七份main規格後，確認兩個有界事件路徑問題，交全新 `/root/plan19_quantity_polish`（Luna Max、fork none）僅改UI：

- 交易數量輸入不再略過空白／小數／負值等草稿，UI map在input當下就按既有clamp規則更新；change與點擊沿用同一有效數量。保留active input原草稿，不另外重構blur／focus；移除因草稿未更新而在change強制重建的條件。
- 重綁模式取消事件預設行為與傳播後，忽略repeat；首次按鍵、Esc及成功派送維持原規則，長按衝突鍵不反覆重畫提示。

[修整報告](plan19-input-polish.md)記錄一次 `tsc --noEmit` exit0；沒有新增只鏡像實作的test，沒有重跑未變helper35項／全327項或content，也沒有DOM／click實測。原35項仍是先前邏輯證據，不把它算作本次輸入事件測試。

全新 `/root/plan19_polish_candidate`（Luna Max、fork none）僅升metadata及建立新候選：`brightwood-first-oath`／`1.0.0-beta.26`。一次build、既有pinned tools1.2.0 pack及完整ZIP validate均通過。候選 [dist](../../artifacts/plan19-1.0.0-beta.26/dist/)／[game.zip](../../artifacts/plan19-1.0.0-beta.26/game.zip)，131,524,359 bytes／274 entries，ZIP SHA-256 `ffbc45ef7143eed6ae1c5a2a93321f5e5c38cb7aed57659e7525d339c3330580`。source／dist指紋與14個文字entry有限掃描0命中（binary未掃）見[beta26封包報告](plan19-polish-candidate.md)。beta25原件保留。

本次**未重啟browser或server，無新的QA資源**。beta25既有0x6D及其受限收束觀測保留，沒有新環境證據就不重試；beta26的實際單擊／焦點／repeat與畫面均未驗。這不阻止交付已完成source與候選，也不構成browser PASS。

修整及必要封包完成後，主代理寫 [Plan20](../20-item-action-feedback.md)及[規劃證據](plan20-planning-evidence.md)：下一批為裝卸／單筆出售前回饋，兩獨立純model包後接單owner UI。Plan20 **PLAN_READY／尚未實作**，文件完成即停；沒有自動啟動後續工作、commit、push、發布或排程。下方保留原beta25的工作包與驗證歷史。

本輪最後一次文件檢查：8份新／修改文件及入口的72個本地連結、8個Markdown錨點均可解析；未掃全repo歷史，補記不加新引用、不重跑。

## 範圍與來源

三項改進：按鍵有效映射／左右別名衝突、同源購買容量預覽、背包結構變更後選取／數量與局部焦點保護。不新增遊玩內容、不改經濟與容量、不遷移 Settings 或存檔。固定 ID、desktop、格式讀1–5／寫5維持。

主代理於本輪透過網路完整讀取 Playroom [template](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md) 及其七份 main 規格：game-development、command-contracts、game.schema、game-release workflow、playroom-sdk、sdk-versioning、save-compatibility；截斷的 game-development 尾段已補讀。SDK1.1.0／protocol1／schema2／固定工具1.2.0 沿用。後續源碼與 ZIP、瀏覽器驗收分層記錄，不因 helper 通過稱遊戲完整驗收。

基線 HEAD `a20f4ac`，開工時僅 Plan19 兩新文件與兩入口 dirty。根無 `.codegraph/`，故使用目標式 rg／讀檔。原 beta24 成品、玩家資料及 QA profiles 保留。

## Owner 與進度

實作工作包使用全新 `gpt-6-luna`／`max`／`fork none`，各包僅寫指派檔；主代理做分析、審閱、整合紀錄。

| 包 | Owner | 進度 |
| --- | --- | --- |
| W01 | `/root/plan19_keyboard` | [有效映射、實收鍵與雙向衝突](plan19-key-bindings.md)，新檔＋foundation共17項通過；review fix另見下文 |
| W02 | `/root/plan19_trade` | [只讀 trade-preview](plan19-trade-preview.md)，7項通過；不採用預覽 player |
| W03 | `/root/plan19_bag` | [純 reconciliation](plan19-bag-state.md)，11項通過 |
| QA 前置 | `/root/plan19_qa_fixture` | [新合成商人／32格背包前置](plan19-qa-fixture.md)及 validator／provenance完成；不操作 browser |
| W04 | `/root/plan19_ui` | [單 owner UI 整合](plan19-ui-integration.md)完成；型別錯誤修正後最終 tsc exit0，沒有重跑已過 focused |
| W05 | `/root/plan19_candidate` | [beta25 候選已凍結](plan19-candidate.md)，build／固定工具 pack／完整 ZIP validate 各一次通過 |
| W06 | `/root/plan19_local_review`（全新 Terra6.1 Max、fork none） | [about:blank 啟動遭 crashpad 0x6D](plan19-local-review.md)，一次即停；遊戲 route／圖審均未驗 |

## 檢查與限制

主代理靜態審閱發現 legacy `moveLeft=ControlRight` 時，held movement 仍直接使用該鍵，而 alias command 會派送 attack；初版實收鍵 helper 錯誤將 movement 標成無鍵。全新 `/root/plan19_keyboard_review_fix`（Luna Max、fork none）僅修 helper 的四種 held movement 分支與錯誤測試，保留 runtime／存檔。改到的新鍵位測試5項重過，foundation未重跑。三包不同測試合計仍為4檔35項，不能把這5項重查算成額外案例。

不重跑先前327項或未變 content；僅本批 helper focused／keyboard foundation、UI typecheck、新 build／固定工具 pack 與完整 ZIP validate，再必要局部 browser。尚未執行的項目維持未驗。

beta25 [game.zip](../../artifacts/plan19-1.0.0-beta.25/game.zip)：131,524,372 bytes／274 entries，SHA-256 `6d163dd87986f99336123f7c579c93084b433fc8288983f65e6857c0d3fc8731`。候選 [dist](../../artifacts/plan19-1.0.0-beta.25/dist/) 與 source／dist manifests 由 W05 保存；封包與有限文字掃描的精確範圍見候選報告。沒有覆寫 beta24。

## 玩家行為與驗證界線

- 設定新按鍵時共用 runtime 的有效映射，左右 Ctrl／Alt 別名兩向衝突會指出動作並拒絕；設定、指南及快捷說明顯示實收按鍵。既有衝突設定保留其原解讀，不自動改存檔。
- 商品卡與購買點擊使用同一 domain 預覽，先顯示商人／金幣／容量原因；32格滿但同品堆疊能容納仍允許。真正交易仍派送 buy 命令，預覽不套回 player。
- 背包有序 itemId／長度變更後，清除選取與出售草稿並在受影響面板提示重新選取；同堆疊只減量時保留合理選取、夾限數量。僅受影響的 bag-index 焦點回穩定標題，避免舊索引／值落到其他物品。

以上是 source 行為與 focused／型別證據，不能作 browser 操作通過聲明。W06 最初因用量限制未開始；使用者要求繼續後，同一 Terra 接續並於14:36香港時間在新 profile 一次開 `about:blank`，重現 `0x6D`／`crash server failed to launch`，依既定 runbook 停止。沒有成功遊戲頁面、server、iframe、canonical-null guard、seed、交易 raw、截圖或 console／資源檢查。960×540 route 與640×360新面板視審均未驗，不換 profile、不自動升權或反覆排障。

完整 [run record](../../output/playwright/plan19-local-beta25-20261028-01/run-record.md) 與 [open.log](../../output/playwright/plan19-local-beta25-20261028-01/open.log) 保留。啟動 log 自報 daemon／Chrome 退出；CIM及事後ports查詢受限，parent與殘留session狀態未知。沒有server需關閉，未按PID終止／批次關閉，也不外推全主機乾淨。所有工作包已回報，沒有本批持續操作的代理。

未 commit、push、tag、Release、平台發布或建立排程；原玩家資料／profiles／歷史候選保留。正式平台／真帳號雲端、音訊、OS失焦及完整遊戲流程仍未由本批驗證，不稱 CANDIDATE_READY。後續如補 browser，應先有具體可用環境與明確的有界操作範圍，不重做本批已過自動檢查。

收束時一次文件檢查：12份本批文件／入口範圍，73個本地連結、9個Markdown錨點均可解析。未掃描全repo歷史；此補記不改引用，沒有重跑已過檢查。
