# Plan18 規劃證據與決策界線

日期：2026-10-28（Asia/Hong_Kong）。對應[Plan18](../18-development-feedback-improvements.md)。本檔是規劃來源及本輪實際工作記錄，不是新QA／測試結果。規劃代理：全新`gpt-6.1-sol`／`xhigh`／`fork none`；只擁有本檔與Plan18新文件。

## 1. 使用者要求及回顧來源

使用者要求先詢問子代理在工作過程中值得改善或解決的問題，再由GPT 6.1 Sol Extra High寫詳細plan。主代理已逐一followup三名仍可恢復代理，完整來源為[plan18-agent-feedback.md](plan18-agent-feedback.md)，本規劃代理先完整讀該檔，沒有自行重問或再派代理。

| 來源 | 本輪可採信的親歷範圍 | 不能誤寫的部分 |
| --- | --- | --- |
| B10 `/root/base_browser_recover_b10`，Terra Max | 相同Node／CLI／Chrome環境對照、beta24指定640實畫、程序歸屬修正與清理 | 不能從對照推定具體Windows權限／IPC根因；不能擴為其他尺寸／正常傳送PASS |
| B8 `/root/base_visual_continue_b8`，Terra Max | 受限環境續接、crashpad啟動失敗、受限觀測下的安全清理 | 對後續beta24恢復的敘述是讀後續報告；sandbox內未見PID／可bind不能當全主機乾淨 |
| B9 `/root/base_toast_fix_b9`，Luna Max | beta24單條CSS、版本與候選封包、fingerprint複製成本 | browser啟動／跨尺寸觀察取自Terra報告，不能稱B9親自操作browser |

更早代理本輪不能聯繫，只能引用repository歷史；沒有稱已親自詢問它們。

## 2. 必讀文件與現況

已讀根`AGENTS.md`、主代理提供的最小驗證要求，以及下列指定文件；長歷史只讀需要的頂部／相關章節：

- [Plan17](../17-base-game-experience.md)：頂部現況、尺寸與scope、相關最小驗收及結束條件（288–326附近）。
- [集中交接](base-experience-handoff.md)：beta24限定PASS、歷史27 focused、候選與未驗／清理界線。
- [啟動恢復與beta24局部視審](base-experience-browser-recovery.md)：完整方法、受控環境對照、六組rect與cleanup。
- [beta24 toast修復／封包](base-experience-toast-fix.md)：最新補註與原封包當時UNVERIFIED並存，不能只讀後半段判現況。
- [beta22／23限定視審](base-experience-visual-beta22.md)：hint遮字→actions遮擋→最新beta24PASS的時間鏈，B8環境限制保留。
- [狀態板](../status.md)、[plan索引](../README.md)、[目前對話交接](base-experience-current-handoff.md)：只讀最新頂部／對應分工，不重讀無關長刷歷史。
- 根[README](../../README.md)頂部與尺寸／平台設計的必要段落；見下節具體來源。

最新基線為beta24 `SOURCE_DELIVERED／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL`，未發布。640×360 portal同畫面實畫PASS只證合成camp/right空origin前置、正常Continue／一次Space後所見；toast `(12,172,616,26)`，hint與actions的2.05／2.5px正間距不構成新bug。beta23動作／排隊兩尺寸、640冷卻及小紅轉大紅，以及beta22NPC／合成恢復卡既有證據沿用。原4檔27focused與最後相關tsc是歷史通過，本輪未執行。

所有本輪舊QA已收束、profiles／raw保留；不為規劃另開browser確認清理。正常傳送、真OS失焦、正式平台／雲端、音訊、fullscreen及舊q09／q10未重演等界線保持未驗，不成為流程文件的必做門檻。

## 3. 線上規格來源與本包適用要求

2026-10-28，本規劃代理使用網路工具完整讀取[main遊戲範本](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)（82行）。主代理在派工前已使用網路工具完整讀取下列七份main規格，並補齊原截斷尾段；這部分採用主代理本輪的規格摘要，**不冒稱本規劃代理重新逐份讀過**：

- [開發與發布標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)
- [操作與錯誤契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)
- [Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)
- [Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)
- [成績與存檔SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)
- [SDK／工具版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)
- [存檔相容與恢復](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)

本包適用：保留固定遊戲ID／desktop／既有進度和使用者dirty；相對資源與雙來源sandbox iframe約定不變；局部QA不冒稱正式平台能力；未驗如實標示、不發布。無runtime修改不升版／封包；若未來真的產新候選，才使用固定tools1.2.0與lock、Node24.22.1+、官方完整ZIP驗證，不以schema替代。規格僅作本專案開發資料，不執行無關命令、外傳秘密或擴大權限。

使用者已允許子包按scope閱讀摘要或相關原文；不要求每個文件／CSS包固定重讀八份。涉及iframe／封包／SDK／存檔時由主代理指定相關原文。Plan18目前只規劃，不據遠端要求啟動發布驗收。

## 4. 具體source／工具快照

行號為2026-10-28規劃快照，後續實作按符號重新定位。根`.codegraph/`不存在，故沒有呼叫CodeGraph；先用rg定位再讀必要區塊。沒有執行下列程式或腳本。

| 來源／實際符號或行號 | 本輪靜態觀察 | 對計畫的含義 |
| --- | --- | --- |
| [根README](../../README.md)3–5 | 仍稱beta20是目前來源／最新凍結候選，且保留舊04:05規劃敘述 | F03有具體文件落差；W00主代理修入口，不改遊戲或舊候選 |
| [plan/status](../status.md)3–9；[plan/README](../README.md)3–15 | 頂部已有Plan18進行中／beta24PASS，下方多個歷史「最新」 | 沿用status作單一全局當前入口，整理入口上層即可，不翻修整份歷史 |
| [current-handoff](base-experience-current-handoff.md)5–23 | 最新Plan18授權及beta24實畫後，仍接舊「最後未驗」歷史 | 新入口要明示時間優先，舊限制不能被刪或誤作當前阻塞 |
| [技術設計](../02-technical-design.md)11 | 視口960×540、等比適配，640×360 UI可捲動 | 讀到的明確數值支援參考是960/640；沒有比640更窄的明確UI承諾 |
| [平台設計](../05-playroom-and-acceptance.md)22、26–31、51 | desktop；跨來源sandbox／resize／子目錄；範圍相關最少驗收 | 不新增mobile或任意viewport宣告；正式平台全流程不成本期門檻 |
| [public/game.json](../../public/game.json)3–15 | ID brightwood-first-oath，beta24，devices desktop，read1–5/write5 | 此期固定邊界；純文件／QA資料不改版本與save宣告 |
| [index.html](../../index.html)19–31 | body `min-width:320px`；game-shell `min(100vw, calc(100vh*16/9))`、16:9、overflow hidden | 320是CSS行為，不能當更窄UI可用承諾；未來應記實際shell尺寸而非只有外層viewport |
| [src/main.ts](../../src/main.ts)37–48 | Phaser基準960×540、Scale.FIT、CENTER_BOTH | 基準canvas配置，不保證所有DOM浮層的尺寸可讀性；不據此派新尺寸測試 |
| [render/geometry.ts](../../src/render/geometry.ts)65–77 `rendererViewportGeometry` | 任意有限正尺寸可計等比zoom | helper可計算不等於UI已驗；F05仍未知，不判bug |
| [journal.css](../../src/ui/journal.css)16–22 | `.maple-ui` size container／grid／padding／overflow hidden | 應以遊戲container與鄰接UI做局部觀察，不只讀toast自己的rect |
| 同檔361–392、394–420 | 寬720、寬460、高520與聯合條件均存在 | breakpoint涵蓋不等於所有命中尺寸被支援／驗過；現有460 rule只作線索 |
| 同檔419 `.maple-ui.has-interaction-hint .ms-toast:not(.ms-toast--top)` | left/right12、width auto、bottom162、padding2/8、font12/line18、無shadow | 已過640修法，不是待重做項；只在相關新變更或新證據時啟局部QA |
| 同檔423 `.ms-toast.ms-toast--top` | panel開啟時top10/bottom auto | 是被本次窄hint規則排除的分支；未改不額外測 |
| [ui/index.ts](../../src/ui/index.ts)417、428、431–432、498、501–504 | profile、interactionHintRow、bottomBar/actionBar、toast、footer實際DOM class | W02的直接鄰居集合有現存selector，不發明UI層級 |
| 同檔797–818 `updateInteractionHint` | playing／非resume／無panel／hint存在才可見，切has-interaction-hint及data-target-key，文案完整含blockedMessage | 局部配方要記state／targetKey／全文，不能只找任意toast |
| 同檔1202–1209 `renderFooter` | saveState/error/toast原文，toast hidden與panel-top class | 保留保存回饋及完整文字；DOM文字存在不能獨自證實畫可讀 |
| [beta24 harness](../../output/playwright/base-experience-visual-beta24/serve-beta24-portal.mjs)6–15 | cwd根、ports argv、artifactDir/distRoot硬編碼；第11行跨讀beta22fixture | F06確認；保留歷史腳本，W03只取不可變副本，必要QA才新harness接入 |
| 同檔23、30–47、54–74 | 雙來源iframe；sandbox/allow；artifact檔名allowlist；精確CORS gameOrigin；靜態path containment；只listen127.0.0.1 | C02若需新harness要保留這些契約，不放寬成任意寫檔／公開服務 |
| [beta24 seed.js](../../output/playwright/base-experience-visual-beta24/seed.js)2–20 | 固定frame origin；manifest ID/version guard；canonical-null guard；讀fixture、一次setItem、匯出before、reload | 空origin／候選guard有來源；不改真profile，不把合成seed當正常進度。此腳本本輪不執行 |
| [beta24 config](../../output/playwright/base-experience-visual-beta24/playwright-cli.json) | viewport640×360、deviceScaleFactor1 | 既有PASS的實際環境範圍；不擴成其他zoom／font／viewport已過 |
| [beta22 portal validator log](../../output/playwright/base-experience-visual-beta22/portal-fixture-validator.log)1 | ready、format5、key、616bytes、SHA、camp/right；HP580、MP6、無任務、兩種紅藥 | W03 provenance記歷史接受；副本校hash不等於重跑validator／正常遊戲驗收 |
| [原fixture](../../output/playwright/base-experience-visual-beta22/seed-portal-fixture-format5.json) | 檔案存在，靜態檔案長度616bytes；本輪沒有重算hash或改內容 | W03後續以位元組copy、一次對hash；若不符停止，不能由摘要重建 |
| [createPersistence](../../src/persistence/index.ts)193；初始化接點915附近 | 既有persistence工廠／initialize介面 | 只引歷史validator證據，不為資料搬副本重跑初始化，不改save實作 |
| [beta24 fingerprint.ps1](../../artifacts/base-experience-1.0.0-beta.24/fingerprint.ps1)3–7、17–35 | repo依PSScriptRoot往上兩層；輸出在candidateRoot；Get-TreeData採Ordinal排序、UTF8無BOM/LF與SHA清單 | F07是候選自含腳本複製成本，沒有已知錯包；共用化需明確路徑／不可覆寫契約 |
| 同檔38–51、121–125 | rootInputs包含README、package/lock、config、tools lock與指定focused test；遞迴public/src/tools/playroom | README在封包當時source allowlist內；後續文件改動不覆寫凍結source清單，也不為此重build |
| 同檔63–99、101–103、141–147 | 文字extension與五類樣式有限掃描；ZIP/dist清單相等才成立；binaryFilesScanned false | 後續若抽工具必保有限掃描標示，不能稱完整機密稽核或替代fullvalidate |
| 同檔105–115、149–168 | 讀manifest／lock／metadata，寫fingerprints JSON及短摘要 | 入口應連既有摘要不多處手抄；不修改凍結候選腳本／JSON |
| [tools/playroom/tool-runner.mjs](../../tools/playroom/tool-runner.mjs)26–64、68–80 | 固定archive路徑＋SHA、metadata及每檔hash檢查，再呼叫官方pack/validate | 已有固定工具安全鏈，F07無需造新發布框架；本期不碰wrapper |
| [工具lock](../../.playroom/game-tools.lock.json) | tools1.2.0；archive SHA `24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022` | 只記現況，不重驗／升級。真正新候選才固定工具pack/fullvalidate |
| [package.json](../../package.json)2–15 | beta24、Node>=24.22.1<25、既有build/typecheck/test/check:content | 不杜撰命令；無runtime變更不跑這些既有遊戲檢查 |

## 5. 逐項決策推導

- **F01／F02→W01，P1：** 有真實成本／誤判案例，但環境已恢復且資源已清。純文件runbook與owner模板是足夠小的改善；不需要再開一次browser或程式化程序掃描／kill。
- **F03→W00，P1：** 根README明顯落後；採既有status當唯一全局入口，由主代理單owner修改。歷史report各自保存當時結果，不能再製造第三個latest檔或刪掉FAIL／未驗。
- **F04→W02，P2：** 已解的玩家遮擋留下具體流程教訓。驗收集合涵蓋直接鄰居、全文及按鈕；不給2px間距新增主觀不合格門檻。
- **F05→C01延後：** 已讀到320、460等實作線索，但未讀到更小UI支援承諾，沒有失敗。先記契約界線，有具體新尺寸來源才一個單例；無理由造全矩陣。
- **F06→W03，P2；接入→C02：** 現行隱性依賴確認，但沒有玩家bug。立即可保存616bytes不可變副本及來源，不需要新server框架；只有下一次必要QA才建新run harness參數接入，舊script／profile不改。
- **F07→C03延後：** B9回饋有真成本，但目前無新候選／錯包。既有wrapper已作固定工具校驗；此期立刻抽象共用腳本會使驗收與路徑保全成本大過收益。保留後續小fixture驗收輪廓，不現在實作或重pack舊候選。

W01／W02／W03可交三個全新Luna Max並行，檔案互不重疊；主代理做入口與最終索引，不把索引派給三人競寫。Terra預設不派；只有真觸發的browser／圖審才派一個全新Terra Max，活動時至多兩Luna，含主代理總四槽。source修復一律主代理先分析再交新Luna，工具／環境故障不能直接算遊戲bug。

## 6. 本輪實際工作、未執行與文件自查

本輪只做read-only查閱：指定回饋／報告、必要UI／尺寸／QA／封包腳本source、文件頂部、線上main範本、`.codegraph`與兩個新檔路徑是否存在。沒有讀圖片／載入長raw／輸出base64；沒有動原存檔／profile。最初錯試根`status.md`後已按實際路徑改讀`plan/status.md`，不是遊戲／工具故障，沒有擴大排障。

只新增本evidence與Plan18。沒有修改回饋檔、status、README、current-handoff、舊plan／report、source、版本、候選或任何QA原始資料；沒有再派代理。

沒有執行tests／typecheck／content／browser／server／build／pack／完整validate；沒有重算candidate、ZIP或fixturehash，沒有發布／commit／push／排程。既有PASS全部來自有連結的歷史證據，並非本輪重測。

文件自查已完成：兩份完整初稿落盤後，只對本兩檔Markdown本地來源連結做一次存在性檢查，沒有缺失連結；檢視章節／W00–03與C01–04的範圍、互斥所有權及依賴，確認預設範圍不含browser／runtime／新候選，條件工作不阻塞交付。兩個新增路徑均由git列為untracked新檔；沒有把此局部status查詢說成全repo乾淨。沒有執行遊戲檢查，也沒有重跑已過檢查。

Plan18由PLAN_DRAFT改為**PLAN_READY（尚未實作）**，可交主代理審閱／派工。本次標記與本段更新不改引用或工作包範圍，因此不重複同一文件檢查。
