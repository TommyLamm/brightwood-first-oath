# Plan18 流程改善交接

日期：2026-10-28（Asia/Hong_Kong）。本檔記本輪執行與所有權；唯一全局現在狀態為 [plan/status.md#current-state](../status.md#current-state)。

## 授權、範圍與基線

使用者在本輪明確要求「你是主代理，開始實作」，並要求主代理只派清楚任務給 Luna。這取代前次只規劃即停的階段限制。執行 [Plan18](../18-development-feedback-improvements.md) 預設 W00–W03；C01–C04 未觸發。來源為[回饋 F01–F07](plan18-agent-feedback.md)、[規劃證據](plan18-planning-evidence.md)、[Plan17 集中交接](base-experience-handoff.md)及[恢復報告](base-experience-browser-recovery.md)。

本輪結果：**PROCESS_DOCS_DELIVERED／QA_FIXTURE_PREPARED**，預設 W00–W03 均已交付。遊戲基線不因文件工作提升，詳唯一狀態入口。所有既有 dirty、候選、原 fixture、profiles、raw、完整圖片與日誌保留；舊報告內文與原指紋不改寫。根目錄本輪查無 `.codegraph/`，按需直接讀指定文件。

## 任務與檔案所有權

三名全新 `gpt-6-luna`／`max`／`fork none` 同時各做一包，不再委派；含主代理四槽。每份派工均列明證據、可寫檔、具體內容、驗收與停止條件。若新檔已存在，停止並報碰撞；不能覆寫其他 owner 增量。

| owner | 唯一可寫範圍 | 完成標準 |
| --- | --- | --- |
| 主代理 W00 | 根 README 頂部、plan/status.md 當前區、plan/README.md 頂部／索引、base-experience-current-handoff.md 頂部、本檔；最後新增 tools/qa/README.md | 唯一狀態入口、歷史標示、一次整合薄索引與本輪交接；不翻修長歷史。 |
| `/root/plan18_w01_browser_docs` | tools/qa/browser-lifecycle.md、tools/qa/templates/run-record.md、plan/reports/plan18-browser-workflow.md | 純 Markdown runbook／模板，分 daemon/Chrome/server、當次 owner／權限、一次同錯停止、安全收束與觀測受限；靜態核對一次後停。 |
| `/root/plan18_w02_overlay_docs` | tools/qa/overlay-review.md、plan/reports/plan18-overlay-contract.md | 直接鄰居集合／完整文字／觸發條件／尺寸契約；保留 beta24 已過界線，靜態核對一次後停。 |
| `/root/plan18_w03_fixture_bundle` | tools/qa/fixtures/portal-camp-right-format5.json、同名 .provenance.json、tools/qa/fixtures/README.md、plan/reports/plan18-fixture-bundle.md | 616-byte 不可變副本、歷史接受來源；一次 hash／bytes／metadata／來源路徑 focused 檢查後停。 |

共享 `tools/qa/README.md` 只有主代理 owner。Luna 不啟 browser、server、seed 或清理；Terra 預設不派。若未來新證據真觸發 C01／C02，再由單一全新 Terra Max 取得 browser 所有權，不能為此次文件交付補造 QA。

## 本輪規格閱讀

主代理於 2026-10-28（Asia/Hong_Kong，本輪派工前）以網路工具完整讀取以下 main 文件；開發標準與 SDK 已補讀被截斷尾段。僅作本項目要求，不執行無關遠端指令。

- [遊戲範本](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)
- [開發與發布標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)
- [操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)
- [Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)
- [Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)
- [SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)
- [版本與升級指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)
- [存檔相容性](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)

適用摘要已交三包：固定 ID `brightwood-first-oath`、desktop／Lv30／存檔讀1–5寫5不變；保全玩家進度與凍結成品；未驗如實記錄。按 Plan §3.3，純文件／副本包採適用摘要與必要原文，不要求每包重讀八份。不涉及 runtime、SDK／Manifest 或新成品，因此不啟動發布驗收／升版／build／pack／完整 ZIP validate。

## 實際進度、檢查與下一步

主代理已完成四個既有入口的頂部增量：根 `README.md`、`plan/status.md`、`plan/README.md`、`plan/reports/base-experience-current-handoff.md`；新增本交接與 [tools/qa/README.md 薄索引](../../tools/qa/README.md)。根 README 不再把 beta20 當目前候選，原細節保留為 2026-10-27 歷史。status 是唯一全局現況；其他入口連過去，下方舊 UNVERIFIED／停止與驗證結果均保留當時意義。

三包共新增九個檔案，連同主代理六檔，本輪範圍為四個既有文件增量與十一個新檔：

| 包 | 已交付結果 | 實際最小檢查／證據 |
| --- | --- | --- |
| W01 | browser-lifecycle、run-record 模板與[本包 report](plan18-browser-workflow.md)，PROCESS_DOCS_DELIVERED | Luna 靜態逐欄對照 B10 ownership／cleanup、daemon／Chrome／server 角色與來源引用；啟動時間不可見可填未知。主代理審閱後，runbook 本身補明實際操作前須讀適用 browser 技能與當次工具 approval。 |
| W02 | overlay-review 與[本包 report](plan18-overlay-contract.md)，PROCESS_DOCS_DELIVERED | Luna 靜態核 selector／DOM state／CSS rule、尺寸與歷史 report，核引用。主代理審閱接受直接鄰居與有界觸發，補本包交付日期。 |
| W03 | 不可變 fixture、provenance、fixture README 與[本包 report](plan18-fixture-bundle.md)，QA_FIXTURE_PREPARED | Luna 一次原件／副本逐位元組、616 bytes 與 SHA-256 比對一致；解析 provenance、核七個 repo-relative 來源存在。歷史 validator 接受，不是本輪重新驗證；指紋直接看 [provenance](../../tools/qa/fixtures/portal-camp-right-format5.provenance.json)，不再手抄一份。 |
| W00 | 唯一狀態入口、歷史標示、QA 薄索引與本交接 | 主代理讀三份 report 與交付文件核範圍；最終只檢查本輪入口／索引新增本地連結和錨點，不重跑各包已過檢查、fixture hash 或遊戲檢查。 |

三名 Luna 都只操作自己的授權檔案；沒有派 Terra，沒有跨包 source 修正。跨包連結已由薄索引串接，歷史來源留原路徑，不再要求讀舊 output 才能取得 fixture bytes。

主代理最終 focused 文件檢查已通過：只讀四個入口的新當前區塊、本交接及 QA 索引，39 個本地連結目標與 10 個 Markdown 錨點均可解析。這不是全 repository 連結檢查；沒有重算 fixture／ZIP hash 或重跑子包已過檢查。本結果補記未變更引用或實作範圍，不再重複檢查。

本輪未啟動 browser／server，無本輪 QA 資源；不稱重新清理通過。未執行 tests／tsc／content／validator／build／pack／ZIP validate，未發布、commit／push／tag 或建排程。既有驗證僅沿用有來源的歷史，不能算成本輪 PASS。

下一步：**本輪完成即停，無剩餘預設工作。** C01 更窄尺寸、C02 新 harness 接入、C03 fingerprint 共用工具仍延後，C04 無確認 source 缺陷而未啟動。需要下一次獨立必要 QA 時，先按 Plan18 條件確定候選／run ID／scope，再交新 owner；W03 複製副本本身不構成 browser 理由。正常路線／傳送、正式平台、帳號雲端、真 OS 焦點等原未驗限制沿用，不補造驗收。

## 回退與保全

後續使用者已明確授權「開始測試，完成後如果沒問題就 commit，包括工作區的所有文件，分開 commit」。這取代先前僅提交 Plan18 的限制；主代理已測試完整主工作區，並按素材原稿、遊戲來源與測試、歷史文件、Plan18 流程及開發設定分組提交全部可追蹤變更。詳[本次工作區測試與提交紀錄](workspace-commit-validation-20261028.md)。既有 ignore 的候選／profiles／快取保留在本機；`.worktrees` 為獨立 Git 工作樹，新增 ignore 避免誤成 gitlink。原封包與其指紋不因 Git 提交而重新產生。

只撤本輪新檔或可辨認的文件增量，不能 restore/reset/clean 既有 dirty 整檔，不刪 output/profiles/artifacts。README 後續文件修改不影響凍結候選當時的 source 清單意義，不重算或覆寫原指紋。後續需要不同合成前置時另起新 fixture/provenance，不改此不可變副本。
