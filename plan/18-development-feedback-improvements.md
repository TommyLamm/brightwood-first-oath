# 18・子代理回饋與開發流程改進計畫

建立：2026-10-28（Asia/Hong_Kong）。狀態：**PLAN_READY；只完成規劃，尚未實作**。規劃者為使用者指定的全新 GPT 6.1 Sol Extra High（`gpt-6.1-sol`／`xhigh`／`fork none`）。已完成來源、範圍、依賴與本地引用自查，交主代理審閱／派工；本文件不代表啟動下一階段、完成改善或新增發布授權。

本計畫先依主代理實際詢問三名可恢復子代理所得的[回饋 F01–F07](reports/plan18-agent-feedback.md)，再對照現行文件、工具與具體符號。來源、行號及推論界線見[規劃證據](reports/plan18-planning-evidence.md)。沒有查到尚未解決、應立即改遊戲的確定玩家缺陷；本期收益主要是減少重複排障、錯誤清理及狀態誤讀，並保護下一次有需要的局部 QA。

## 1. 目標、基線與明確不做範圍

### 1.1 目前結果不得倒退或擴大

- Plan17 最新為 **beta24 SOURCE_DELIVERED／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL**，未發布。以[集中交接](reports/base-experience-handoff.md)及[啟動恢復／局部視審](reports/base-experience-browser-recovery.md)為既有證據。
- beta24 的 **640×360** portal hint／toast／profile／actions／quickbar／footer 同畫面已實畫 PASS（所見）。toast rect 為 `(12,172,616,26)`，與 hint 相距約 2.05px、與 actions 約 2.5px；這些正間距本身不是 bug，也不是本期調整理由。
- 該 case 採空 canonical origin、validator 接受的合成 format5 `camp/right` fixture，再正常 Continue／按一次 Space。它不證正常 NPC→portal 行走、任務通關或完成傳送。
- beta23 動作／排隊的 960×540、640×360，以及 640 冷卻與小紅切大紅已限定視審；beta22 NPC／合成恢復卡呈現證據沿用。原 **4 檔 27 focused** 及最後相關 `tsc` 結果沿用，本輪沒有重測。
- 同 Node24.22.1／快取 CLI／Chrome，在一般桌面權限啟動成功、`use_default` sandbox 重現 crashpad pipe `0x6D`；證據支持執行環境差異，沒有證明底層 Windows 權限／IPC 機制，也不支持歸因 Node 或遊戲。
- 自有 QA session／Chrome／daemon／server 已清理；profiles、raw、完整日誌、截圖與 beta19–24 凍結成品全部保留。不要為確認已清理再開一次 browser。

### 1.2 本期想得到的具體結果

1. 新續作者從一個最新狀態入口即可找到目前候選、已驗／未驗、來源及清理結果，不再讀到 beta20 或 beta24 舊 UNVERIFIED 就重開工作。
2. 只有需要 browser 時才用有界啟動流程，能辨認環境失敗、記錄一次並安全停止；可重建執行上下文，不承諾自動修復 OS。
3. QA 的 session、profile、daemon、Chrome、server 與 ports 有明確 owner；清理命令依本輪證據，不能複製舊 PID。
4. 下一次相關 overlay 有變更時，以完整文字與直接鄰居為同一局部範圍，避免「避開 hint 後蓋 actions」再次發生。
5. 將已驗合成 fixture 做成小型不可變 QA 資料包，保留來源與 hash；未來必要 QA 不必隱性依賴 beta22 工作目錄。

### 1.3 不做

不重做已修 state／焦點／buffer／圖示快取，不再調 beta24 CSS 間距；不新增玩法、地圖、任務、素材、套件或測試框架；不改存檔、SDK、Manifest 或裝置宣告。固定 ID `brightwood-first-oath`、desktop、Lv30、讀格式 1–5／寫 5 與既有進度不變。

不深挖 crashpad 底層、不重裝 Chrome、不換 Node 排障、不修改安全政策／關閉安全功能／自動升權；不建立通用 QA 平台或發布框架。不清理歷史 QA 資料、候選或 dirty。無 runtime 變更就不升遊戲版、不 build／pack／validate；不 commit／push／tag／Release／平台確認／上架，不建排程。

本輪授權僅規劃。以下為主代理取得後續實作指示時可直接使用的有界工作包；沒有新增人工 approval gate，也不以等待批准取代已授權工作。

## 2. 回饋判定與本期取捨

優先序是本期執行順序與風險，並非宣稱有同級玩家 bug。確認程度分為「直接經歷／歷史實證」「靜態來源確認」「假設」。

| 回饋／來源 | 確認程度、已解／未解 | 玩家或工程影響 | 決策／優先序 |
| --- | --- | --- | --- |
| F01：B10、B8 親歷 browser 啟動失敗；B9 間接引用 | 失敗與環境對照有實證；可用恢復已找到。底層原因未證，重複排障方法仍可改善 | 工程：浪費 profile／排障時間；不能直接算玩家故障 | **納入 W01，P1**。寫有界 runbook；不為驗文件重做對照 |
| F02：B10、B8 親歷歸屬及清理限制 | B10 曾把 daemon PID 誤稱 Chrome，後用 parent／命令列更正；目前已清理。流程追溯仍欠共用模板 | 工程：誤關他人瀏覽器／服務的實質風險 | **納入 W01，P1**。記 owner、權限上下文與安全停止；不寫自動 kill 工具 |
| F03：三名代理的交接回顧 | 多份頂部已有新 PASS，但仍疊放舊狀態；根 README 頂部還稱 beta20 是最新，屬確認的文件落差 | 工程：續作者重測、混候選，或把局部 PASS 誇為完整通過 | **納入 W00，P1**。沿用 `plan/status.md` 作唯一全局最新入口，不另造第二份 current-status |
| F04：B8／B9 回顧舊視審，B10 提供 beta24 實畫 | beta22 hint、beta23 actions 遮擋均已修且 beta24 限定 PASS。欠的是下次驗收範圍約定 | 玩家影響已解；工程：局部修正可能移轉遮擋 | **納入 W02，P2**。鄰接 UI 配方；現在不改 CSS、不重拍 |
| F05：B9 依 CSS／報告假設，B10 建議不改碼 | `<=720×<=520` 規則與更窄 breakpoint 存在；只有 640 case 已驗。未有更窄失敗或明確支援契約 | 尚未知玩家影響；不可把未知當故障 | **延後，P3／條件 C01**。現有設計明列 960×540／640×360；320 body 最小寬不是遊戲 UI 支援承諾，不安排新尺寸矩陣 |
| F06：B10 親歷、B8 補充前置保全 | 靜態確認 beta24 harness 第11行讀 beta22 fixture。當時可用，沒有玩家故障；未來移除舊 QA 目錄會斷重放鏈 | 工程：隱性路徑依賴與前置來源誤認 | **納入 W03，P2**，只做 616-byte 不可變副本／來源；真正 harness 接入等下次必要 QA（C02） |
| F07：B9 親自封包 | beta23／24 各有候選內 fingerprint 腳本；beta24 ZIP/dist 一致，未發現封包錯誤 | 工程：複製腳本／手抄摘要有成本，當前沒有新候選需求 | **延後，P3／條件 C03**。此期不抽象工具；摘要直接連結既有 JSON／逐檔清單，不手抄第二份 hash |

不可聯繫的更早代理只引用 repository 歷史，不稱本輪詢問過。B9 親歷範圍為 CSS／版本／封包，不能把它讀到的 crashpad 與跨尺寸現象寫成它的 browser 操作。

## 3. 共用契約、所有權與最小驗證

### 3.1 狀態與證據契約

- 全局「現在正在做什麼」只維護 `plan/status.md` 的新 `current-state` 錨點區塊；其他入口連過去。工作包 report 可記自身有日期的結果與限制，不自稱另一份全局權威。
- 最新狀態列：更新時間／時區、Plan18 階段、目前遊戲候選、`SOURCE_DELIVERED`／`ZIP_VALIDATED`／`LOCAL_ACCEPTANCE_PARTIAL`、表面／尺寸／前置／方法、已驗／未驗、來源連結、QA cleanup、下一個有界工作。證據主體保留原檔，不在每個入口手抄 hash 或長表。
- `PLAN_READY` 只表示計畫可派工；文件改善完成用 `PROCESS_DOCS_DELIVERED`，fixture 資料包完成用 `QA_FIXTURE_PREPARED`。不能因此提高遊戲驗收等級或標 `CANDIDATE_READY`。
- 每份新 report 要分清：本包實際執行、沿用歷史、略過／未驗、失敗及下一步。未執行的 browser、validator、測試不能寫 PASS。

### 3.2 所有權與分工

主代理分析、定案、協調與維護全局入口；每個實作／修復包使用**全新 `gpt-6-luna`／`max`／`fork none`**。所有 browser 操作、截圖及視覺審核使用**全新 `gpt-6.1-terra`／`max`／`fork none`**，最多一名，profile／鍵盤／CLI session 單一 owner。不能把 QA 腳本失效、焦點不正確或等待不足判成遊戲 bug。

最多三名 Luna 並行；含主代理總共四槽。Terra 活動時最多兩名 Luna。文件包可以並行，不為填滿槽位另外開工作。所有新檔寫前確認不存在；若碰撞，回主代理重分所有權，不能覆寫。共享 `tools/qa/README.md` 不列入任何子包，統一由主代理最後建立索引，避免三包競寫。

各代理只改自己的增量，不 restore/reset/clean 整檔。凍結 `artifacts/**`、既有 `output/playwright/**`、原存檔／profile／raw、本期回饋及舊報告內文均唯讀；有條件的新 QA 只用新 run 目錄。已過且未改的 focused／tsc／browser 不重跑。

### 3.3 規格分配

主代理本輪已完整網路讀 main 範本及七份 main 規格；本規劃代理另完整讀 main 範本。來源與日期見 evidence。W00–W03 接受固定 ID／desktop／存檔保全／未驗不冒稱等適用摘要；不要求每個文件包固定重讀八份。C02 涉及 iframe harness 時指定 iframe／子目錄原文及 browser 技能；若觸及 SDK／存檔／Manifest／封包，才指定對應原文，跨規格需要時再完整讀。

## 4. 預設工作包

以下 W00–W03 是本計畫後續的預設執行範圍。W01、W02 都是文件，不新增 executable preflight／cleanup／DOM tester；W03 是既有合成資料的不可變副本。預設範圍沒有遊戲 runtime 改動。

### W00・統一最新狀態入口與歷史標示（P1，主代理）

**背景／證據：** F03；`plan/status.md:3–9` 最新 Plan18／beta24 與下方舊階段混放；`README.md:3–5` 還指 beta20 最新；`plan/README.md:3–15`、`base-experience-current-handoff.md:5–23` 有多個歷史「最新」。

**可寫：** 僅主代理擁有根 `README.md` 頂部、`plan/status.md` 頂部、`plan/README.md` 頂部／索引、`plan/reports/base-experience-current-handoff.md` 頂部，以及新 `plan/reports/plan18-process-handoff.md`；完成子包後建立 `tools/qa/README.md` 薄索引。規劃代理不寫這些檔。

**設計／預期行為：**

1. `plan/status.md` 建一個明確 `<a id="current-state"></a>` 區塊。維持「Plan18 文件／流程階段」與「遊戲仍 beta24 部分本機驗收」兩個維度；精確來源連舊集中交接及恢復報告。
2. 根 README 不再說 beta20 為目前來源。用短句連最新入口與既有候選報告，不重抄 ZIP 指紋；保留原 beta20 細節但加有日期的歷史標示。
3. `plan/README.md` 只留一段當前入口，舊 Plan17／16「最新」段落置於明確歷史區。current-handoff 頂部保留本輪授權、agent owner、下一步及狀態連結；下方舊階段不改成假完成。
4. 不全面重寫歷史。舊 `base-experience-handoff.md`、toast-fix、visual-beta22 內「當時未驗」仍是證據；由新入口清楚說明它們的時間與 beta24 後續結論即可，不把舊 FAIL／UNVERIFIED 逐條刪除。

**取捨：** 沿用已約定的 `plan/status.md`，不新增狀態 JSON 或自動產生器；降低多份同步成本。新 process-handoff 記此次流程交付，連 status，不能再成全局 latest 權威。

**依賴：** 先鎖基線與其餘包路徑；W01–03 完成後只整合一次結果／索引。

**成果／驗收：** 從根 README 或 plan README 一次點擊到當前摘要，再直接到 beta24 特定畫面證據；可辨 beta23 actions 遮擋已修、beta24 指定 640 PASS，以及正常傳送／正式平台等未驗。兩個入口不重複維護一份遊戲版本敘述。

**最小檢查／停止：** 僅核對本次新增／修改的連結與當前區塊；不爬全 repo、不跑測試或 browser。來源若衝突，保留較窄、可直接引用的結論並記差異；不能藉整理文件重新裁定遊戲通過。更新完當前入口即停，不繼續翻修長歷史。

### W01・browser 啟動、QA 所有權與清理 runbook（P1，全新 Luna Max）

**背景／證據：** F01／F02；恢復報告、`blank-open.log`／`control-open.log` 及 ownership／cleanup。CLI 曾列 daemon PID19856，真正 Chrome 主程序4876是 child；舊 PID 只作歷史，不能作可執行範例。

**可寫：** 新 `tools/qa/browser-lifecycle.md`、`tools/qa/templates/run-record.md`、`plan/reports/plan18-browser-workflow.md`。唯讀舊 QA 腳本、日誌、skills；不可修改 source、候選、既有 profiles、tools/playroom、入口文件或實作自動 kill／升權功能。

**依賴／契約：** 使用 W00 定的入口與新 run ID；與 W02／W03 可並行。讀主代理適用摘要。runbook 要求真正 browser 執行者按當次任務讀 browser 技能及獲工具所需的 approval；文件本身不啟動 session。

**主要設計：**

1. **只在 browser 確有必要時開始。** 一般文字、流程文件、簡單樣式不預設 browser。需要時解析當前實際 Node／CLI／Chrome 路徑，記版本、config、執行環境；恢復報告的 cache 路徑是歷史範例，不能假設永久存在或為找舊 cache 重新下載依賴。
2. **新隔離上下文。** 唯一 run ID、新 profile、新 output 目錄、明確且相異的 loopback game／host ports，專屬 server exec session。先確認 candidate ID／version 與配置；不對舊 origin 重新 seed，不碰真使用者 profile。
3. **有界啟動。** 若要試啟動，只先開該次 session 的 `about:blank`。已知可用上下文可按當次授權直接沿用，不規定每次先重演 sandbox 失敗。相同 `0x6D`／crashpad 錯誤留一次完整 log 後停止換 profile；已有環境對照可引用，不重做。只有新的、具體未解環境差異且當次授權／tool approval 允許時，最多一個對照；不自動以 `require_escalated` 重試、不隱藏安全錯誤、不關安全功能。
4. **記 owner，分程序角色。** run-record 欄位至少有：時間／時區、agent、執行權限上下文、runtime/CLI/Chrome/config、candidate path/ID/version/既有指紋來源、session name、profile 絕對路徑、daemon／Chrome/server 的本輪 command line、PID及可觀測的啟動時間／parent、server exec session ID、ports／origins／preview prefix、sandbox/allow、fixture/provenance、空 canonical guard、before／after raw、目前遊戲狀態與 cleanup 狀態。不能印 token、全環境變數或整份使用者資料。
5. **正常收束。** 放鍵→正常暫停→保存本輪 before/after raw／必要日誌→指定 CLI session close→專屬 server exec session Ctrl+C。關閉前以本輪 profile／session／完整命令列及 parent 關係核 owner；CLI 顯示的 PID 不能直接當 Chrome PID。
6. **失敗收束。** 無法查 CIM／ports／HTTP時記「該權限上下文未觀測到／查詢受限」，不能聲稱全主機乾淨。無歸屬證據不按舊 PID kill、不 close-all；保留 profile/raw及未知資源線索，回報主代理。raw 匯出失敗不得寫成已保存，先保全現存 profile，處理範圍不擴到玩家存檔修復。

**替代方案取捨：** 採手動 runbook＋純 Markdown record，足以解決目前具體錯誤；不寫 daemon manager、程序掃描器或權限探測 executable，避免為簡單流程引入新錯關風險。已完成的 B10 record 不重建、不改歷史歸屬。

**成果／驗收：** 一名新 Terra 可只憑 runbook 和必要 evidence 知道該填什麼、錯誤何時停止、哪些資源可正常 close；模板能表示「未啟動」「已啟動待收束」「已清理」「觀測受限」而不假填 PID／PASS。報告對 daemon／Chrome、觀察／推論有清楚例子。

**最小檢查／停止：** 文件與模板逐欄靜態對照 B10 證據一次，確認不包含可直接執行的舊 PID、close-all或隱性升權。不要跑模板、開 browser、測 loopback 或重現 crashpad。此包不解決 Windows 底層機制；文件不足以判 owner 時，以未知表示即達停止條件。

### W02・overlay 直接鄰居的有界驗收配方（P2，全新 Luna Max）

**背景／證據：** F04／F05；beta22→23→24 顯示只看原遮擋物會把問題移到 actions。`journal.css:410–423` 僅針對窄短容器、有 hint、非 top toast；`updateInteractionHint`、`renderFooter` 提供對應 state／class。

**可寫：** 新 `tools/qa/overlay-review.md`、`plan/reports/plan18-overlay-contract.md`。source／CSS／舊圖／raw／候選唯讀；不新增 test、不開 browser、不改字級、bottom、z-index 或 class。

**依賴：** W00 基線；與 W01／W03 並行。配方連 W01、fixture provenance 的預定路徑；不把可選 QA 變成每次 CSS 的硬門檻。

**設計／預期行為：**

- 列出觸發：使用者明確要求局部視審，或後續已修改這組浮層的定位／換行／顯示狀態且主代理具體判定遮擋風險。無相關修改就引用 beta24 現有結果。
- 定義同一局部集合：`.ms-profile`、`.ms-interaction-hint`、`.ms-toast`、`.ms-action-bar`／可見 Z、Space 按鈕、`.ms-quickbar`、`.ms-footer`。必要時同一張圖＋一組 rect 即可；不要為每個節點各拍圖。
- 記錄 candidate、實際 iframe 尺寸、deviceScale／zoom、字型環境、hint target key、完整 hint/toast 文案、panel 是否開啟、合成前置與正常操作的界線。主要觀察是全文可讀、無裁切／省略、可見文字和操作控制沒有相交；DOM 的 scroll/client／rect 只輔助視覺，不能單獨宣稱實畫 PASS。
- 寫入 beta24 的已過數值為有日期的**參考證據**，不變成通用 pixel golden。不設定新 8px 等最小間距；正間距約2px不等同失敗。
- `.ms-toast--top`、無 hint、一般尺寸是規則排除條件，先靜態確認是否被本次修改影響；沒有影響就不加 browser cases。只在改到該分支時追加一個直接 case。
- 支援尺寸判定寫清：設計明列 960×540／640×360；`index.html min-width:320`、460 container rule與任意正尺寸 renderer helper 不證 UI 在更小尺寸已承諾支援。**此期沒有新尺寸 case**；C01 的新證據門檻見下節。
- 新可見缺陷先交主代理判它屬遊戲 source、QA harness、尺寸契約或錯誤前置；QA error 不直接派遊戲修復。

**成果／驗收：** 配方可直接讓 Terra 在下一次必要修改只觀察「該表面＋直接周邊」，並用一張全畫面縮圖／必要局部交付完整性。完整圖／長 log 存 workspace；每次載入1–2張、長邊≤1280、JPEG60–75，裁圖才放大必要區。

**最小檢查／停止：** 靜態核對 selector／state／rule及既有 report；確認沒有把 beta24 PASS 撤回、沒有自動加入更小 viewport或全回歸。文檔交付即停，不安排 browser 驗文件。

### W03・合成 portal fixture 不可變資料包（P2，全新 Luna Max）

**背景／證據：** F06；beta24 `serve-beta24-portal.mjs:11` 跨讀 beta22。原檔616 bytes；歷史 validator 接受 format5、camp/right，hash `4e55c8c1a8ef4c1078c46be6de7ff28b19cb10b132278761dfe3fe82e7c6fb00`。現在不刪舊目錄，但應使未來必要 QA 的輸入顯式且可保留。

**可寫：** 僅新增 `tools/qa/fixtures/portal-camp-right-format5.json`、`tools/qa/fixtures/portal-camp-right-format5.provenance.json`、`tools/qa/fixtures/README.md`、`plan/reports/plan18-fixture-bundle.md`。原 fixture、validator log、所有既有 `output/`／artifacts 以及 persistence source 唯讀。不改 beta24 harness 的已完成歷史。

**依賴／契約：** W00 固定基線；與 W01／W02 可並行。資料只用於隔離 QA，不納入 `public/`、dist、玩家進度或雲端。`brightwood-first-oath:save:v1` 不變。沒有當前 save 格式變動，也不為副本重跑 `createPersistence.initialize()`。

**設計：**

1. 直接以**位元組副本**保存原 fixture；不 parse/stringify、改時間戳、HP、位置或加註解。副本 immutable，若日後真的要不同前置，以新檔命名與新 provenance，不覆寫。
2. provenance 記：用途／`synthetic:true`、format5、camp/right、616 bytes、SHA-256、原 repository-relative 路徑、既有 validator log 與實際接受結果來源、首次使用與 beta24 重用證據、建立副本日期及「本包沒有重新執行 validator／browser」。可用欄位 `validationStatus: historical_acceptance`、`revalidatedThisWork:false`，不能把複製當新 validator PASS。
3. README 清楚說空新 origin／新 profile、canonical 必須 null才可一次 seed、先確認 candidate ID/version、保存before/after raw，且正常 Continue／Space 只是合成前置後的操作。對真玩家原件與既有 profile 禁止 seed。
4. 下一次必要 QA 的新 harness 用明確 fixture 參數指到這個副本並驗 hash；接入依 C02，不為接入再開 beta24或改歷史腳本。

**取捨：** 616-byte副本＋provenance足以去掉資料保全對舊輸出目錄的依賴；本期不抽象通用 server、seed framework、CLI parser或狀態注入 API。原 log 路徑作歷史證據連結而不是 runtime 必需輸入；即使日後證據被移轉，也不能靜默宣稱重新驗過。

**成果／驗收：** 新副本與原件 hash／bytes一致，metadata可解析、每個來源存在且標歷史；不依賴讀舊目錄才能取得fixture bytes。舊檔不變，beta24成品不變，無新遊戲進度。

**最小檢查／失敗與停止：** 一次比較原件／副本 SHA-256及byte長度、一次讀取 provenance JSON／引用路徑即可；這是資料副本的必要 focused 檢查，不跑遊戲tests／validator／tsc／browser／build。若原件缺失、hash不符或現有provenance矛盾，停止此包的資料交付、保留原因交主代理；不得由 log 重建／猜造 fixture。其他文件包仍可完成。

## 5. 有條件工作：新證據才啟動

以下均**不是完成 W00–03 的硬門檻**。主代理按當次已授權工作及證據決定是否啟動，不額外發明使用者確認流程。若不在當次授權範圍，只留下觸發條件與未驗界線。

### C01・較窄尺寸的新單例

**目前決策：延後。** 已讀設計／Manifest／shell／CSS／renderer；沒有比640×360更小的明確遊戲 UI 支援契約，沒有新失敗證據。平台要求適應 iframe不等於本計畫可自行宣告任意尺寸或 mobile支援。

**啟動條件：** 使用者明確指定一個更小尺寸；或後續讀到適用且明確的最小 iframe 尺寸／平台實際 viewport；或收到可重現且屬既有 desktop支援環境的裁切證據。先記來源、實際遊戲 shell尺寸（不是只記外層 viewport）、zoom／font及期待，不能只因 CSS命中就啟動。

**工作與最小驗收：** 指定新 Terra Max只觀察**一個最小新增 case**，沿W01／02／03；640 PASS不重跑，無關表面不測。可讀且無相交即記該case結果後停；失敗先排除harness／契約。只有確認 source缺陷才交全新Luna Max修 `src/ui/journal.css` 對應rule（必要時精確縮小selector），保持全文與直接操作可見，不改desktop宣告／SaveData。沒有失敗就不改碼；字型／縮放沒有新證據時也不加矩陣。

### C02・下一次必要 QA 的 fixture 接入／局部視審

**啟動條件：** 已有獨立理由需要browser（使用者要求或確認相關變更），並且需要同portal合成前置。僅W03建立副本不是理由。

**Luna所有權：** 一名全新Luna先在全新 `output/playwright/<run-id>/` 建 `serve-candidate.mjs`、`seed.js`、config；主代理先分配不可重用run-id、candidate、兩ports與輸出檔，然後放行給Terra。舊beta24 harness／seed不可改。新harness只把fixture輸入顯式參數化並驗預期hash，候選/輸出根路徑明確；既有loopback、雙來源子目錄、path containment、artifact檔名allowlist、CORS精確game origin及sandbox/allow契約沿用。不能把此包擴為通用服務器重構。

**關鍵行為：** fixture不存在／hash不同在listen／seed前失敗；manifest ID/version guard及canonical-null guard保留，不能fallback到舊目錄或覆寫已有存檔。harness仍只供QA，不進遊戲dist。不把seed當正常路線或正式雲端測試。

**最小工具檢查：** 若只是路徑與參數接線，以Node語法檢查及三個隔離小fixture案例涵蓋正常解析、缺檔、hash不符；不啟動Chrome、不拿真profile測負例。純文件無須此檢查。若該執行環境使工具檢查無法開始，先判與修改關聯；無關則記限制，不擴大整修。

**Terra所有權：** Luna釋放harness後，唯一Terra操作該run的profile／session／server、`run-record.md`、before/after raw、必要截圖及新 `plan/reports/plan18-<run-id>-review.md`。按W01環境停止條件、W02局部範圍。無UI變更時不為harness移植再拍整套舊表面；實際case結果按所見記。清理與受限觀測照實，完整raw／profile保留。

### C03・fingerprint 共用工具（本期延後）

**目前理由：** 既有候選內腳本約7KB，已有明確source allowlist、tree對比與有限文字掃描；`tools/playroom/tool-runner.mjs`已有固定ZIP／metadata校驗。沒有新候選需求，立刻共用化會增加路徑參數、輸出保全及相容驗收成本，收益有限。

**再考慮條件：** 下一次實際封包仍需複製腳本且主代理確認成本反覆出現，或出現可定位的手抄／候選混用錯誤，或使用者明確要求。先比較現有腳本差異與輸入scope，不因「有兩份」就自動開工。

**若納入，給全新Luna的有界輪廓：** 新 `tools/qa/fingerprint-candidate.ps1` 與單獨輸入scope檔；明確參數repoRoot／candidateRoot／dist／zip／outputRoot，保留Ordinal排序、UTF-8無BOM/LF、`hash  relativePath`清單格式、source allowlist、ZIP/dist逐檔對等與scan extensions／patterns／binary未掃標示。只寫新輸出目錄、不覆寫凍結候選；不能取代official pack/full ZIP validate。以一個小型隔離dist/zip證一致／不一致，及越界或既有輸出拒絕；不重packbeta23／24。工具版本hash取既有lock，不改tools1.2.0或其wrapper。真正新候選時才接入一次必要流程。

### C04・確認 source缺陷後的新候選

只有C01／C02或後續授權工作得到可定位source缺陷才啟動。主代理先分析證據／scope，交新Luna Max最小修復，不讓Terra邊改source邊驗。純文字、流程及簡單樣式不預設加測試；有邏輯／資料／權限變更才選覆蓋核心的focused檢查，不重跑原27項。

若真的產生遊戲runtime／成品變更，新版由主代理確認未用版本及獨立候選目錄；Luna只在來源定案後執行**一次必要build、固定tools1.2.0 pack及完整ZIPvalidate**，使用Node24.22.1+／24系與lock中的archive SHA-256，schema檢查不能替代完整ZIPvalidate。只有相關程式又改或失敗才重做對應步驟。原beta19–24不覆寫。Terra只補新受影響case及直接周邊；不是正式發布或全遊戲驗收。

## 6. 執行順序、互斥與派工

| 階段 | owner與槽位 | 依賴／完成即往下 |
| --- | --- | --- |
| A・鎖基線與檔案 | 主代理 | 閱讀本plan／evidence／F01–07；確認下一階段授權；W00建立唯一入口及W01–03所有權，不開browser |
| B・平行文件／資料包 | 主代理＋最多3個全新Luna Max | W01 lifecycle、W02 overlay、W03 fixture各自檔案；不共寫QA索引、不互改報告 |
| C・整合交付 | 主代理 | 讀三份短report，核來源／適用範圍；W00只整合本期結果與QA薄索引，不重做各包passing檢查 |
| D・條件性新QA | 主代理＋最多1Terra Max＋最多2Luna Max | 只有C01/C02真觸發；Luna先完成且釋放新harness，Terra才取得browser／run所有權 |
| E・條件性修復 | 主代理→全新Luna Max→單一Terra Max | Terra停輸入先交證據；主代理分類source/QA/env，Luna只修確認缺陷；僅必要新候選依C04 |
| F・收束 | 主代理 | 交付process-handoff、更新唯一入口；沒有條件性工作就直接完成，不為填驗收欄另開QA |

W01不可改W02配方，W02不可改fixture，W03不可改runbook。需要跨包變更由主代理先收回／重分該檔owner，再以新Luna的單包增量處理。所有browser與圖審均交Terra；Luna只寫工具或資料，不自行啟動browser。主代理負責原因分析，不能只把各包留言原封不動當缺陷指令。

## 7. 風險、回退與保全

| 風險 | 控制／回退 |
| --- | --- |
| runbook被誤認自動升權許可 | 明示上下文、當次授權與tool approval；同錯留一次log後停，不關安全設定。文件可撤自己的增量，無OS變更需還原 |
| PID／ports跨權限看不到被誤當乾淨 | record分daemon/Chrome/server並記parent；觀測受限即記未知。只能正常close自己的session/exec，不用舊PID |
| 「單一入口」又長出第二份狀態 | status唯一current-state；README/交接只連入口，report保留時間與自身scope；主代理單owner |
| 新fixture被當玩家進度或正式保存證明 | QA目錄外的專用tools/qa資料、synthetic標記、空origin guard與既有validator來源；不進public/dist，不替換真save |
| 複製時換行／編碼改bytes | 位元組副本、hash/bytes一次比較；不符停止，不以重新格式化假裝同fixture |
| overlay規則命中範圍大被當既有bug | 只明列已驗case及契約；無更小尺寸證據延後。保持beta24所見PASS，不以空白邊距主觀撤回 |
| 改文件污染既有source指紋理解 | 記README後續修改日期；凍結candidate的source清單只代表當時來源，不重算／覆寫它。無runtime改動不造beta25 |
| 工具抽象失控／大驗收拖慢 | W01/02純文件，W03小資料；C02/C03按觸發才做小工具focused fixture，不裝框架、不全矩陣 |

回退只撤本包新增檔或本包可辨認的文件增量，不能對dirty檔整體restore，不git clean/reset、不刪output／profiles／artifacts。若交付的fixture來源不符，標該包未完成而非清掉原件；其餘文件仍可交。條件性遊戲修復若需撤回，保留新候選與失敗報告、回到原凍結候選作參考，不改玩家存檔或舊版成品。

## 8. 交付與結束標準

預設工作完成要有W00唯一入口、W01runbook／record模板、W02overlay配方、W03可追溯fixture副本與各短report。主代理在 `plan/reports/plan18-process-handoff.md` 寫：完成項、實際修改檔、來源、實際檢查、沿用歷史、未驗／延後、回退與下一步；沒有browser則記「未啟動，無本輪QA資源」，不能稱重新清理通過。

必要檢查僅文件新增連結／範圍／所有權，以及W03副本hash/bytes/metadata。W01、W02不跑tests／tsc／browser；W00不掃全repo歷史；無runtime修改不升版／build／pack。若使用者說「不用檢查，我會自己檢查」，立刻停止可選驗證，完成實作並如實列略過。

C01／C02／C03延後不阻擋預設工作收束。正式平台、真帳號雲端、實際音訊、真OS失焦、原生／沉浸fullscreen、灰畫面根因、舊q09／q10未重演及其他原未驗項保留，不列成本plan硬門檻。完成後停止，不開全回歸、不長刷、不逐擊截圖、不另建plan或排程、不發布。

### 可直接派工的精簡摘要

- **主代理先做W00：** status唯一當前入口；修根README仍稱beta20的文件落差；分配下列不重疊檔，最後一次整合。不改遊戲與凍結證據。
- **新Luna Max／fork none，W01：** 讀F01/F02、恢復報告與evidence；只寫browser-lifecycle、run-record模板與本包report。分清daemon/Chrome、一次同錯停止與當次權限，不開browser、不執行清理。
- **新Luna Max／fork none，W02：** 讀F04/F05與既有640PASS；只寫overlay-review與本包report。列profile/hint/toast/actions/quickbar/footer局部完整性及條件觸發；不改CSS、不測新尺寸。
- **新Luna Max／fork none，W03：** 讀F06、fixture來源/validator證據；只新增616-byte fixture位元組副本、provenance、README與report。一次hash/bytes/metadata檢查；不改舊harness、不seed、不重跑validator。
- **Terra Max／fork none：** 預設不派。只有C01/C02真觸發才取得唯一browser所有權，按W01/02局部記錄與收束；source問題先交主代理分析，再交新Luna修復。
- **F07：** 本期延後；有實際下一候選重複成本／錯誤或新指令再評估，不建通用發布工具。

## 9. 本規劃輪實際工作

本代理只讀指定回饋／報告、必要source／tools與main範本；確認root沒有`.codegraph/`，使用rg定位，兩個新輸出路徑原先不存在。只寫本plan與evidence，沒有派其他代理或修改source、入口、舊report、版本、save或候選。

沒有執行遊戲tests、typecheck、content、browser、server、build、pack、validate，沒有重算beta24ZIP或fixturehash。舊passing結果均明示沿用。本plan最終ready與文件自查結果以evidence末節為準。
