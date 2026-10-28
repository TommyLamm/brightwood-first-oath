# Browser QA 生命週期、owner 與安全收束

本文件只定義必要 browser QA 的手動流程；不啟動 session、不授予升權、不提供自動掃描或終止程序功能。每次實際執行都從新的 run ID 開始，並填寫[run record 模板](templates/run-record.md)。

全局現在狀態只以 [plan/status.md#current-state](../../plan/status.md#current-state) 為入口。該錨點由 W00 維護；本文件不複製或建立另一份狀態摘要。

本流程不改遊戲宣告：固定 ID 為 `brightwood-first-oath`、裝置為 `desktop`、雲端存檔讀格式 1–5／寫格式 5。既有 beta24 候選與 dirty、profile、raw、`artifacts/**` 都要保全；beta24 合成 640×360 視審 PASS 僅維持原先所見範圍，不因本流程重測或外推為完整遊戲驗收。

## 1. 何時啟動

- 只有待回答的問題確實需要真實瀏覽器、畫面、iframe 或瀏覽器輸入行為時才啟動。文字、流程文件或簡單樣式變更本身不構成理由。
- 已有相同候選、前置、尺寸與方法的明確證據，且相關內容未改時，沿用該證據，不重測已過項目。記錄本次沿用來源及仍未驗的範圍。
- 先確認當次候選 ID、版本與路徑。既有 `artifacts/**`、profile、存檔、raw 和歷史 output 只讀；新測試不得覆寫它們。
- 不因撰寫文件、確認已清理或想知道未知的作業系統根因而另開 browser。
- 任何真正 browser 操作前，當次執行者須閱讀適用的 browser 技能與工具說明，並遵循當次工具要求的 approval。此文件本身不啟動 session，也不代替技能中的操作規則。

## 2. 建立一個隔離 run

1. 產生本輪唯一 run ID，建立只供這次工作使用的新 profile 絕對路徑、新 output 目錄與唯一 CLI session name。不要重用歷史 run ID、真實使用者 profile 或舊 output 目錄。
2. 從實際執行環境解析並記錄 Node、CLI、Chrome 的版本及實際檔案路徑，也記錄當次 config 的路徑、版本或可追溯指紋。舊報告中的 cache 路徑只是一段歷史，不是固定契約；不要為尋找舊 cache 下載或更新依賴。
3. 記錄遊戲候選的絕對路徑、ID、版本，以及指紋／來源證據。確認本次 harness、預覽子目錄和候選指向同一目標；不要將歷史 beta24 指紋抄成當前值。
4. 若需要本機 server，為 game 與 host 各選一個明確且相異的 loopback port，記錄 game origin、host origin、preview prefix，以及 server 專屬 exec session。port 是否可用只記實際觀測結果；未查就寫未知。
5. 記錄 iframe `sandbox` 與 `allow`。若使用合成 fixture，記錄來源、版本／格式與既有接受證據；只在新、專屬的空 origin 使用，先確認 canonical save 為 null，並留存 guard 證據。不得把合成資料當玩家存檔或正式保存證明。
6. 不要把 token、完整環境變數、Cookie 或無關使用者資料放進 record 或日誌。命令列記錄須保留辨識本輪 owner 所需內容；如原始字串含秘密，遮除秘密並記錄遮除情況。

## 3. 有界啟動與停止條件

- 未知或未驗證的啟動上下文先開 `about:blank`。已知可用且當次授權的上下文可直接使用，不必重演已知失敗。
- 一旦相同的 crashpad pipe `0x6D`／`crash server failed to launch` 再現，保存本次完整相關 log 一次，標記失敗並停止；不要反覆換 profile。
- 只有出現新的、具體且尚未解決的環境差異，並且當次授權及工具 approval 明確允許時，才可做最多一個有依據的對照。不要自動升權、重試 `require_escalated`、關閉安全功能、改全域政策或重裝瀏覽器。
- 環境對照是觀察，不是根因證明。分開寫實際觀察與推論；無法證明的 Windows 權限／IPC 機制標為未證實。

## 4. 記錄 owner，分開程序角色

run record 必須分別記 CLI daemon、Chrome browser 與 server，不可把 CLI 顯示的 PID 直接稱為 Chrome PID。

| 角色 | 本輪 owner 識別依據 | 可以正常收束的範圍 |
| --- | --- | --- |
| CLI／daemon | 本輪 CLI session name、實際 CLI 路徑、profile／run ID，以及可觀測的完整命令列、啟動時間與 parent 關係 | 只對本輪指定 CLI session 執行其正常 close 操作 |
| Chrome | 本輪 profile 絕對路徑、CLI session 關聯及可觀測的命令列、啟動時間、parent PID／程序關係 | 由所屬 CLI session 正常 close；不按 PID 或批次關閉 |
| Server | 本輪 server 命令列、game／host ports、可觀測的啟動時間／parent，以及專屬 exec session ID | 只在本輪自有 server exec session 使用 Ctrl+C 正常停止 |

關閉前以本輪 profile、session、完整命令列與 parent 關係交叉核對 owner；啟動時間也要記錄，若權限或資料來源看不到就明寫未知。PID 只供追溯本輪觀察，不可從舊報告複製成現行 PID，也不可單靠 PID 判斷歸屬。若 owner 無法確認，停止程序操作並回報主代理；禁止 `close-all`、按舊 PID kill 或以程序名稱批次終止。

## 5. 正常收束順序

1. 放開鍵盤、滑鼠及遊戲輸入。
2. 若遊戲提供正常暫停操作，先將遊戲停在可辨識狀態並記錄該狀態。
3. 保存本輪 before／after raw 及必要 log；記錄各檔案的確切位置和保存結果。raw 匯出失敗時，明寫失敗並保全現有 profile；不得假填已保存。
4. 對本輪指定 CLI session 執行正常 close。
5. 對本輪專屬 server exec session 傳送 Ctrl+C。
6. 僅在當次權限可觀測的範圍內確認 session、程序與 ports 的收束結果，並記錄查詢方式、執行環境及限制。跨權限、CIM、HTTP 或 ports 查詢受限時，標「未知／未觀測」，不可宣稱全主機乾淨。
7. 保留 profile、raw、log、截圖及其他證據，不清理歷史 QA 資料或候選。

如果本次沒有啟動 browser，record 填「未啟動、無本輪 QA 資源」；不宣稱清理通過。若本輪仍有活動資源，填「待收束」並把可觀測與未知項目分開列明。

## 6. 證據界線與歷史例子

B10 的[程序 ownership 記錄](../../output/playwright/base-experience-visual-beta24/ownership-before.json)與[Chrome ownership 記錄](../../output/playwright/base-experience-visual-beta24/chrome-ownership-before.json)顯示 CLI daemon 是 `node.exe` PID 19856，Chrome 主程序 PID 4876 的 parent 是 19856；另有 server PID 32692。這些是歷史識別例子，只能說明如何區分程序角色，不能複製到新 run。歷史[恢復報告](../../plan/reports/base-experience-browser-recovery.md)記錄 CLI session 與 server exec session 的正常收束；[cleanup log](../../output/playwright/base-experience-visual-beta24/cleanup.log)及[收束後 session 記錄](../../output/playwright/base-experience-visual-beta24/sessions-after-close.log)是該次結果，不是本輪操作證據。

同一 Node／CLI／Chrome 與啟動參數在一般桌面權限下成功、在 `use_default` 下以相同 `0x6D` 失敗，支持「失敗與執行環境差異相關」這項推論；沒有證明特定 Windows 權限或 IPC 機制，也沒有證明 Node 或遊戲有缺陷。觀察值、推論、未知必須分欄記錄。只有本次可追溯的正式證據能支持其明確涵蓋範圍的 PASS；未實際執行的尺寸、流程或能力維持未驗。

## 7. 相關來源

- [Plan18 工作包與證據契約](../../plan/18-development-feedback-improvements.md)
- [F01／F02 回饋](../../plan/reports/plan18-agent-feedback.md)
- [beta24 瀏覽器恢復與局部視審](../../plan/reports/base-experience-browser-recovery.md)
- [全局現在狀態入口](../../plan/status.md#current-state)（W00 維護）
- [overlay 局部驗收配方](overlay-review.md)（W02 owner 維護）
- [合成 fixture 來源索引](fixtures/README.md)（W03 owner 維護）
