# 有界 QA 指引與資料索引

這裡保存 Plan18 的流程文件與合成資料，不是自動執行工具。只有獨立必要的 QA 才使用，不因這些文件存在而啟動 browser 或重測已過項目。

唯一全局現在狀態：[plan/status.md#current-state](../../plan/status.md#current-state)。本輪分工、實際檢查與延後條件見 [Plan18 流程交接](../../plan/reports/plan18-process-handoff.md)；工作包原設計見 [Plan18](../../plan/18-development-feedback-improvements.md)。

| 需要 | 文件／資料 | 使用界線 |
| --- | --- | --- |
| browser 啟動、owner、收束 | [Browser lifecycle](browser-lifecycle.md) | 實際操作前讀適用技能與工具要求；同類環境錯誤有界停止，只有本輪歸屬證據可支持資源收束。 |
| 記錄一個必要的新 run | [Run record 模板](templates/run-record.md) | 複製到新 run 目錄；未知如實寫，不帶歷史 PID 或假填 PASS。 |
| overlay 的全文與直接鄰居 | [Overlay review](overlay-review.md) | 只驗受影響表面和直接周邊；無新理由沿用舊結果，不擴尺寸矩陣。 |
| 合成 camp/right portal 前置 | [Fixture README](fixtures/README.md)、[fixture](fixtures/portal-camp-right-format5.json)、[provenance](fixtures/portal-camp-right-format5.provenance.json) | 不可變副本，僅隔離 QA；新空 origin／profile、候選與 canonical-null guard、一次 seed、before/after raw 保全；新 harness 接入仍待 C02 觸發。 |

實際 browser／圖審由單一指定 Terra owner 執行；Luna 的文件／資料包不開 browser。完整圖、raw、profile 與長 log 留在該 run 的工作區，審圖縮圖依根 AGENTS.md。

各包交付紀錄：[W01](../../plan/reports/plan18-browser-workflow.md)、[W02](../../plan/reports/plan18-overlay-contract.md)、[W03](../../plan/reports/plan18-fixture-bundle.md)。本索引不另維護候選版本或遊戲驗收摘要。

provenance 與報告中的歷史 `output/playwright/`、`artifacts/` 路徑指向保留的本機證據，這些目錄不隨 Git 提交；全新 checkout 可能沒有原始日誌或候選。fixture 副本本身獨立保存在本目錄，可按 provenance 的 bytes／hash 核對；歷史來源缺席不代表重新驗證通過。
