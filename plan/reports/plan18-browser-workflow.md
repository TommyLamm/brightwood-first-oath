# Plan18 W01：browser 生命週期、owner 與安全收束

2026-10-28（Asia/Hong_Kong）。狀態：**PROCESS_DOCS_DELIVERED**。本包完成純 Markdown browser 流程與記錄模板，處理 F01／F02；未啟動 browser，沒有本輪 QA 資源。

## 交付

- [Browser QA 生命週期與安全收束指引](../../tools/qa/browser-lifecycle.md)
- [Browser QA run record 模板](../../tools/qa/templates/run-record.md)

全局現在狀態只連 [plan/status.md#current-state](../status.md#current-state)。W00 已建立並維護該 anchor；本報告不建立第二份全局狀態或修改狀態板。

本包未更改遊戲：固定 ID `brightwood-first-oath`、`desktop` 宣告、讀格式 1–5／寫格式 5 與既有 beta24 候選保持不變；dirty、profile、raw、`artifacts/**` 均保全。

## 證據與結論界線

已靜態對照 [Plan18 W01 與證據契約](../18-development-feedback-improvements.md)、[F01／F02 回饋](plan18-agent-feedback.md)、[完整 beta24 browser recovery 報告](base-experience-browser-recovery.md)，以及原 [daemon／server ownership JSON](../../output/playwright/base-experience-visual-beta24/ownership-before.json)、[Chrome ownership JSON](../../output/playwright/base-experience-visual-beta24/chrome-ownership-before.json)、[cleanup log](../../output/playwright/base-experience-visual-beta24/cleanup.log)及[收束後 session log](../../output/playwright/base-experience-visual-beta24/sessions-after-close.log)。原日誌只讀必要摘要，沒有複製到本報告。

- **歷史觀察：** B10 ownership JSON 記錄 `node.exe` PID 19856（CLI daemon）、其 parent 30500，以及 Chrome 主程序 PID 4876 的 parent 為 19856；server PID 32692 另列為自有程序。完整 recovery 報告另記 CLI session、server 專屬 exec session 23183、ports、正常 close／Ctrl+C 及收束後結果。這些 ID 只解釋角色關係，不能作為新 run 的 PID、session 或執行範例。
- **歷史觀察：** 相同 Node 24.22.1、CLI、Chrome、啟動參數及 `about:blank`，一般桌面權限成功；`use_default` 下出現 crashpad pipe `0x6D` 並退出。
- **推論限制：** 對照支持失敗與執行環境差異相關；未證明是哪項 Windows 權限／IPC 機制造成，也不支持歸因 Node 或遊戲。歷史清理結果不能替代未來 run 的 owner 證據。
- **模板欄位對照：** W01 要求的時間／時區、agent、權限上下文、工具／config 版本與路徑、candidate 識別、session／profile／output、daemon／Chrome／server 命令列／PID／啟動時間／parent、server exec ID、ports／origins／prefix、sandbox／allow、fixture provenance／canonical-null guard、before／after raw、遊戲狀態與清理狀態均已納入模板。B10 JSON 有程序名、PID、parent、路徑及命令列欄位，但沒有明確啟動時間欄；模板要求按本輪可觀測性記錄，否則填未知。

## 本包實際工作與檢查

- 新增上列兩份文件及本交接報告；三個目標路徑在寫入前均不存在。
- 一次靜態逐欄對照 W01 要求與 B10 ownership／cleanup 證據；沒有執行 cleanup。
- 新增來源連結指向既有 Plan18、feedback、recovery 與 B10 記錄；`plan/status.md#current-state` anchor 已存在。最終路徑檢查時 W02／W03 的 [overlay-review 配方](../../tools/qa/overlay-review.md)與[fixture README](../../tools/qa/fixtures/README.md)也已存在；本包只檢查路徑，不讀或修改其內容，內容仍由各 owner 維護，留主代理整合核對。
- 此輪未執行 browser、loopback、tests、tsc、build、pack、validator；未重跑已通過檢查，沒有更動遊戲、候選、profile、raw、存檔或歷史資料。

## 後續與限制

沿用 W00 已建立的唯一狀態入口；主代理整合 W00–W03 文件並最後建立 `tools/qa/README.md`。下一次確有必要的 browser QA 由當次 owner 讀取適用 browser 技能與 approval 要求，使用全新隔離 run 及 record 模板。此文件不解決 Windows 底層機制；權限不足或 owner 無法辨識時，停止程序操作並標未知。既有 beta24 合成 640×360 所見 PASS 維持原範圍，不外推為完整遊戲或發布驗收。
