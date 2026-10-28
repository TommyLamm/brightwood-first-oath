# Plan18：子代理回顧收集與規劃輸入

日期：2026-10-28（Asia/Hong_Kong）。使用者要求先詢問子代理過程中值得改善或解決的問題，再讓 GPT 6.1 Sol Extra High 撰寫詳細改進計畫。**本輪僅規劃，沒有實作、browser、build、pack或測試。**

## 收集方式與基線

主代理對仍可恢復的三名完成代理逐一 followup，要求只讀必要證據、回顧自身工作，回報問題／已解未解／影響／有界建議／優先序／最小驗收，不寫程式或重新檢查。三名均已回覆。更早Plan17代理本輪不在可聯繫清單，其工作只能以repository報告作為間接來源，不能稱已向它們詢問。

- `/root/base_browser_recover_b10`：GPT6.1 Terra Max，實際負責權限對照、beta24局部視審與資源清理。
- `/root/base_visual_continue_b8`：GPT6.1 Terra Max，實際負責受限環境的失敗續接及當時安全清理；其回顧也閱讀後續恢復報告。
- `/root/base_toast_fix_b9`：GPT6 Luna Max，實際負責beta24單條CSS、版本及候選封裝；瀏覽器錯誤／跨尺寸觀察屬其閱讀Terra報告的間接證據，不能歸為它親自操作browser。

最新基線為[集中交接](base-experience-handoff.md)、[恢復與視審](base-experience-browser-recovery.md)及[beta24封包](base-experience-toast-fix.md)。beta24指定640×360 portal同畫面已由Terra實畫PASS（所見），不得把舊封包時UNVERIFIED當現況。原27 focused與相關typecheck已通過；beta24來源／dist／ZIP沒有在恢復測試時改變。未做全回歸、未發布。

## 回顧歸納（保留原始來源及證據界線）

### F01：啟動失敗要先區分執行環境，避免反覆換profile

- 來源：B10及B8直接經歷；B9引述同一份恢復證據。
- 證據：[恢復報告](base-experience-browser-recovery.md)，`output/playwright/base-experience-visual-beta24/blank-open.log`、`control-open.log`；B8失敗紀錄在beta22 QA目錄。
- 現況：相同bundled Node24.22.1、快取CLI與Chrome在一般桌面權限成功，受限sandbox重現crashpad pipe ended 0x6D；具體Windows權限／IPC機制尚未證實，已有可用恢復方式。
- 影響：視審中斷、反覆換新profile，容易誤判Node或遊戲問題。
- 建議：只在確實需要browser的工作，沿用已記錄的隔離啟動方法；同類錯誤留一次日誌，按當次授權／審批最多做一次有依據環境對照，訂出停止條件。不是所有CSS工作都預設啟browser，也不自動升權或修改全域政策。
- 代理優先序：B10/B8 P1，B9 P2；由規劃代理按成本與必要性統整。
- 最小驗收：可重建一個隔離session的啟動上下文，清楚區分觀察與推論；實際執行只隨後續必要QA，不為寫文件重開已通過遊戲。

### F02：QA程序所有權及清理上下文必須可追溯

- 來源：B10/B8直接經歷。
- 證據：beta24 QA的`ownership-before.json`、`chrome-ownership-before.json`、`cleanup.log`、`sessions-after-close.log`；beta22 QA的`beta23-b8-cleanup.log`。
- 現況：B10曾把CLI列出的PID19856誤稱Chrome，後經CIM證實它是daemon，真正Chrome主程序4876是其child；已更正並正常清理。B8的CIM／HTTP受限，不能以sandbox內結果聲稱全主機乾淨，也沒有操作舊PID。
- 影響：過期PID或跨權限查詢結果可能導致誤關其他瀏覽器／服務；單看opened PID不足判owner。
- 建議：每次新QA保留時間、執行環境／權限、CLI session、profile、server專屬exec session、精確命令列／parent關係與ports，標明存檔及清理狀態。正常放鍵／pause／存raw後，優先指定session close和自有exec session Ctrl+C；無歸屬證據不按舊PID終止。
- 代理優先序：P1。
- 最小驗收：文件足以區分可安全關閉的本輪資源與未知舊資源；不可用的觀測手段與限制明列。本次已清理，計畫不得把再開browser當必做驗收。

### F03：最新結果與階段歷史需要更清楚的入口

- 來源：B10/B8直接交接，B9從封包報告角度補充。
- 證據：`base-experience-visual-beta22.md`、`base-experience-toast-fix.md`、`base-experience-current-handoff.md`、`base-experience-browser-recovery.md`及status／README。
- 現況：頂部已補最新PASS及後續連結，內文保留當時FAIL／UNVERIFIED；這些歷史不是當前失敗，但多處重述容易誤讀。
- 影響：續作者可能重測已過內容、誤以為未驗仍阻塞，或把單一畫面PASS誇大成全遊戲通過。
- 建議：用單一明確入口列結果時間、候選版本、表面／尺寸／前置／測試方式、已驗未驗、證據及cleanup，其他報告只指向入口並保留歷史。不要全repo歷史重寫或刪除證據。
- 代理優先序：P2。
- 最小驗收：從頂部即可追到beta23遮擋→beta24指定640PASS及未驗界線，不需讀長歷史，也不產生第二份衝突權威。

### F04：修overlay應同時檢視相鄰UI，不能只避開原遮擋物

- 來源：B8及B9回顧既有視審證據；B10提供最新實畫驗收。
- 證據：beta22視審的hint遮字，beta23左移toast遮Z／Space上方17.5px，beta24恢復報告及`visual.log`六組rect。
- 現況：beta24的640指定畫面已完整可讀且無互遮；不是待修bug。
- 建議：後續相關布局有變時，把profile／hint／toast／actions／quickbar／footer視為同一局部驗收範圍；保留既有證據，勿為增加形式而重測或建立全回歸矩陣。
- 代理優先序：P2的流程改善，並非立即再次改CSS。
- 最小驗收：工作包清楚列直接周邊，正常視審記錄能證全文及相鄰操作不相交；無相關修改則沿用已過結果。

### F05：規則適用範圍大於已驗尺寸，先釐清支援範圍而非推定缺陷

- 來源：B9依CSS／報告提出假設；B10明確不建議現在改碼。
- 證據：`src/ui/journal.css`窄短容器rule（目前419附近），適用max-width720／max-height520；實畫只核640×360。toast固定bottom162，實測高26，hint距2.05px、action距2.5px。
- 現況：更窄尺寸／字型／縮放可能換行，但尚無失敗證據；不能因2px間距小就宣稱beta24有bug。
- 建議：規劃代理先只讀確認現有最小尺寸與支援契約。若沒有更窄支援要求，列為觀察／延後；若證實需支援才規劃一個最小新尺寸單例，僅失敗時修CSS。禁止先重構浮層或任意擴張裝置宣告。
- 最小驗收：條件、啟動理由與停止條件清楚；不以未驗當失敗，不重測640PASS。

### F06：fixture跨舊QA目錄依賴，影響日後可續作性

- 來源：B10直接經歷，B8補充前置來源／存檔保全。
- 證據：`output/playwright/base-experience-visual-beta24/serve-beta24-portal.mjs`讀取beta22 QA目錄的`seed-portal-fixture-format5.json`。hash `4e55c8c1a8ef4c1078c46be6de7ff28b19cb10b132278761dfe3fe82e7c6fb00`；`seed.log`證空canonical一次seed且版本beta24。
- 現況：本次可用、無玩家故障；若未來清理舊目錄，可能破壞重放鏈。保留所有既有資料，不在本輪清理。
- 建議：下一個必要QA任務將已驗fixture作不可變副本並記來源／hash／validator證據，或明確以參數指定。仍須新隔離profile／origin、空存檔檢查、before／after raw；不能誇大為正常遊戲路徑測試。
- 代理優先序：B10 P3；B8強調證據標示P2。
- 最小驗收：靜態確認唯一fixture路徑、hash與來源、空origin guard；不為搬移fixture重跑遊戲或生成新進度。

### F07：候選指紋腳本與摘要手動複製有成本

- 來源：B9實際封包經歷。
- 證據：beta23／24候選各自的`fingerprint.ps1`、`fingerprints.json`、source／dist／zip逐檔清單與封包報告。
- 現況：beta24 ZIP/dist tree一致，14個文字entries有限掃描0命中，沒有封包錯誤的證據。
- 建議：評估以參數化共享工具取代每版複製，保留明確source allowlist、工具版本、逐檔清單、ZIP/dist一致性、有限掃描邊界；報告連結摘要而非多處手抄hash。不得改寫凍結候選的script或summary，也不擴大成新的發布框架。
- 代理優先序：P3，可按收益延後。
- 最小驗收：若日後實作，以小型隔離fixture證參數／清單輸出與對等性，實際新候選時才接入，不重新pack舊候選。

## 不應重開的已解項與範圍

- beta24指定portal畫面已PASS，不因間距小撤回結果或重改CSS。
- Quickbar動作／排隊／冷卻先前限定視審已過；不重做狀態架構、不重跑27 focused。
- 不深挖crashpad底層機制、重裝Chrome、修改全域安全設定、調OS焦點或任意升級依賴。
- 合成fixture不證正常NPC→portal行走／傳送；正式平台／帳號雲端／音訊／真OS失焦及其他原未驗項仍保留，但不是本計畫必做全回歸門檻。
- 不新增區域、任務、怪物、玩法、圖片素材、存檔格式／難度；不發布、commit／push、建排程或改既有dirty。

## 本輪規格閱讀與子代理範圍

主代理本輪已用網路工具完整讀取main範本，以及game-development（含末196行）、command-contracts、game.schema.json、game-release.yml、playroom-sdk.js（含末107行）、sdk-versioning、save-compatibility。規格僅作本repo要求。固定ID／desktop／相對資源／sandbox iframe／read1–5 write5／舊成品保全不變；規劃不升版或封包。後續實作子代理可按工作包選讀原文或摘要，涉及SDK／存檔／Manifest／iframe／封包時再指定相應原文；不要求每位代理固定重讀八份。
