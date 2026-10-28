# Plan18 W03：合成 portal fixture 資料包

日期：2026-10-28（Asia/Hong_Kong）。狀態：**QA_FIXTURE_PREPARED**。本報告只記錄 W03 的合成 QA 資料副本，不提升遊戲候選的驗收狀態。

## 交付

- 新增不可變、QA 專用的 [camp/right format 5 fixture](../../tools/qa/fixtures/portal-camp-right-format5.json)、[provenance](../../tools/qa/fixtures/portal-camp-right-format5.provenance.json) 與[使用界線](../../tools/qa/fixtures/README.md)。
- fixture 以位元組方式複製自 beta22 原件；616 bytes，SHA-256 `4e55c8c1a8ef4c1078c46be6de7ff28b19cb10b132278761dfe3fe82e7c6fb00`。不解析、重序列化或修改內容。
- 原件的[歷史 validator log](../../output/playwright/base-experience-visual-beta22/portal-fixture-validator.log)記錄 `ready`、format 5、canonical key、616 bytes、此 SHA 與 camp/right。這是歷史接受結果，不是本輪重跑。

## 沿用的歷史證據

- [beta22 首次使用報告](base-experience-visual-beta22.md)與[portal seed log](../../output/playwright/base-experience-visual-beta22/portal-seed.log)記錄新 game origin 的 canonical key 初始為 null，並一次 seed 合成前置。報告明確限定為 QA 前置，並非從 NPC 正常行走或完成 portal 傳送。
- [beta24 恢復／局部視審報告](base-experience-browser-recovery.md)與[seed log](../../output/playwright/base-experience-visual-beta24/seed.log)記錄候選 `brightwood-first-oath`／`1.0.0-beta.24`、新 origin 的 key 初始為 null，以及 camp/right 一次 seed。beta24 [harness 第11行](../../output/playwright/base-experience-visual-beta24/serve-beta24-portal.mjs#L11)仍直接讀取 beta22 QA 目錄，故本包保全可明確引用的副本。
- beta24 後續正常 Continue／Space 操作只觀察合成前置後的提示與門檻訊息；不代表正常 NPC 路線、portal 傳送、正式帳號或雲端驗收。

## 本輪檢查與界線

- 已執行一次原件／副本 byte、長度及 SHA-256 比對：通過，兩者均為616 bytes、雜湊一致且逐位元組相同。
- 已解析 provenance JSON，核對 `synthetic: true`、format 5、`validationStatus: historical_acceptance` 與 `revalidatedThisWork: false`；七個明列的 repository-relative 來源路徑均存在。
- 本包沒有執行 validator、browser、seed、tests、tsc、build 或 pack；沒有新增遊戲進度，也沒有改舊 harness、原 fixture、既有 QA 輸出、source、候選或 `public/`／dist。
- 只有下一次有獨立 browser QA 理由且需要此 portal 前置時，才依 Plan18 C02 由新 harness 明確傳入此 fixture 並於 listen／seed 前驗 hash；不得 fallback beta22 路徑，必須保留新 origin/profile、candidate ID/version guard、canonical-null 一次 seed 與 before/after raw 保全。

W03 資料包已備妥；C02 接入不在本包範圍，至此停止。
