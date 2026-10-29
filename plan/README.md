# 經典劍士冒險：多代理實作交接索引

唯一當前入口：[狀態、候選與已驗／未驗界線](status.md#current-state)。[Plan49：手帳 NPC 地圖與收尾修補](49-journal-contact-map.md)完成後依使用者最新要求停止新增 Plan，收尾簡單驗證並建立 Release；續作先讀[本批交接](reports/plan49-handoff.md)。先前各 Plan、交接及候選由狀態板對應列進入；此索引不另維護版本或驗收摘要。

## 階段歷史（以下「最新」均指記錄當時）

**2026-10-28最新：[Plan18子代理回饋改進計畫](18-development-feedback-improvements.md)，PLAN_READY／尚未實作。** 三名子代理已回報，指定GPT6.1 Sol Extra High已完成詳細plan，主代理已審閱；來源見[回饋](reports/plan18-agent-feedback.md)與[規劃證據](reports/plan18-planning-evidence.md)。本輪只規劃、不重測已過內容、不改遊戲或凍結候選，W00–W03尚未執行。詳[本對話交接](reports/base-experience-current-handoff.md)，下方Plan17為已完成基線。

**2026-10-28新增內容限定視審收束：[Plan17最新beta24交接](reports/base-experience-handoff.md)。** NPC／合成恢復卡及beta23動作／排隊／冷卻已有視覺證據；beta24通知避讓在恢復Chrome後640實畫PASS。啟動對照支持受限環境權限／IPC差異，一般桌面權限成功；詳[恢復報告](reports/base-experience-browser-recovery.md)。沒有全回歸、沒有再改候選，保留profiles/raw/舊候選；未發布、不新增plan或排程。下方為先前階段。

**2026-10-28最終交付：[Plan17 beta22交接](reports/base-experience-handoff.md)。** 基礎體驗四項與恢復guard已實作；27 focused／tsc／新候選完整ZIP驗證通過，LOCAL_ACCEPTANCE_PARTIAL。beta21局部NPC／同頁焦點觀察可沿用，其他browser／視覺與beta22直接實測未驗。QA自有資源已清，04:05一次性排程已執行刪除，未發布；本輪停止，不新plan／排程。以下為先前階段。

**2026-10-28 04:05續作：[Plan17基礎遊戲體驗](17-base-game-experience.md) IN_PROGRESS。** 詳細plan／證據已保存，排程已觸發刪除；主代理已按[派工](reports/base-experience-dispatch.md)啟動三名Luna Max核心實作，後續單owner整合UI、Terra Max做必要browser／視覺短段。只優化既有基礎體驗，不新增遊玩內容，不發布。以下PLAN_IN_PROGRESS為規劃時記錄。

**2026-10-28最新入口：[基礎體驗本對話交接](reports/base-experience-current-handoff.md)。** 全新Sol6.1 Extra High已開始詳細plan；本對話一次性04:05（香港）將完成plan並按分工實作，Luna Max最多3名、Terra Max視覺與browser最多1名。這取代下方歷史「只寫計畫即停」及舊Sol High審圖分工；只優化基礎遊戲體驗，不新增遊玩內容。目前PLAN_IN_PROGRESS，未啟動實作。

本輪已收束：beta20來源／ZIP交付，Sand正常閉環完成，Frost舊q09實測3/6／q10未重演保持PARTIAL；QA服務已清，未發布。**04:05新規劃須全新Sol6.1 Extra High寫入項目，完成即停，只規劃基礎體驗、不新增遊玩內容。** 唯一當前摘要見[狀態板](status.md)，證據與限制見[集中交付](reports/world-completion-handoff.md)。下方IN_PROGRESS均為先前階段。

目前 **IN_PROGRESS**：beta20航標修正已封裝、正常調查及同Sol單點視覺PASS；fresh Luna b12已領q12／q13，q22＋q14active，fresh b15從正常q08原件副本補出航／q09q10缺步。q21／q11不重做。原Sol沿用，不新增plan／排程；先讀[狀態板](status.md)與[最新交接](reports/world-completion-live-handoff.md)。

## 歷史入口（依日期保留，不覆蓋上方當前狀態）

2026-10-27 06:30最後一輪入口：[Plan16逐圖交付與驗收邊界](reports/world-completion-handoff.md)。beta.19來源／ZIP已交付，local browser仍PARTIAL；兩個一次性排程已刪除，本輪收尾後停止，不建立新plan或排程。當前操作／所有權見[即時交接](reports/world-completion-live-handoff.md)，下方排程已設／尚未啟動等均為歷史。

2026-10-27目前入口：[Plan16即時交接](reports/world-completion-live-handoff.md)。已獲實作授權並交付beta.19候選（SOURCE_READY／ZIP_VALIDATED，實際browser仍PARTIAL）；q21／q22、format5明確備份升級、四區手帳／q19回顧及導航已實作。每批全新Luna Max、最多3名；同一Sol High接近300K才換。01:25／06:30一次性續作已設，06:30最後一輪完成當時計畫後停止新增plan。下方Plan16尚未啟動等為前輪歷史，不重做已交付來源或已過checks。

目前總目標（2026-10-26）：[16・當前世界全區域完成開發計畫](16-world-completion-roadmap.md) **PLAN_READY／尚未啟動實作**。涵蓋四區18圖、既有19主線／1支線、兩個新增支線提案、Lv30後進展、首領節奏、世界結局、存檔與最小驗收；拆為W00–W09及五個本機／設計里程碑與獨立平台階段。現有beta.18仍SOURCE_READY／ZIP_VALIDATED／LOCAL_BROWSER_PARTIAL。後續開工先讀本計畫與status，不按下方歷史q05／q07狀態重做已完成任務。

2026-10-26 20:20排程續作：[額外遺跡視覺驗收最新交接](reports/ruins-visual-handoff-20261026.md)。已補成真正勝利→正常再次挑戰：入口沒有舊矩形／青綠圈可見殘留，首領滿綠血條重生，戰後HP／MP及q18進度保留；[專項證據](reports/ruins-retry-2020-20261026.md)。先前三張地圖限定短段、兩種預警與可見半血轉場沿用。beta.18 source／ZIP未改，未重build/tests/pack或發布；正常角色q08claimed 1492B檢查點保留。精確瞬時／音訊／正式平台／雲端仍未驗，Plan15維持LOCAL_BROWSER_PARTIAL。下方為歷史。

本輪最新：[2026-10-26 11:51續作](reports/resume-1154-dispatch-20261026.md)，使用者已重新授權接續q05–q08與必要未驗內容。沿用beta.18／q05 6/8原始raw，不重跑舊段落；下方08:31為前一輪歷史收尾。

最終（2026-10-26 08:31）：用量98%而提前收尾，未持續至09:00。先讀[集中交接](reports/overnight-optimization-handoff-20261026.md)：beta.18 ZIP已驗證，正常新玩家分版本完成q01–q04，q05 partial6/8有完整raw；所有child／自有服務已收尾，goal未標complete。後續用新對話讀交接續作，保留未驗界線，不重跑已完成段落。下方為階段快照。

接續本次工作先讀[2026-10-26自主優化集中交接](reports/overnight-optimization-handoff-20261026.md)（08:18收尾），包含**beta.18已驗ZIP**、對話／匯入回饋／傳點標示三個改善、beta.15分段browser完成範圍及原始新玩家存檔。beta.17 q01–q03、接beta.18 q04已手動領獎，q05停6/8／未claimed，q06–q08未驗；下一次正常補血後從該raw續作，不重跑已完成段落。用量90%後已停止新scope並完成child／服務cleanup，保留版本／恢復與未驗界線。下方為歷史快照。

2026-10-26 06:12最新候選：**beta.17 SOURCE_READY／ZIP_VALIDATED；local browser PARTIAL**。[對話鍵盤改善](reports/overnight-dialogue-focus-20261026.md)與[本機匯入競爭訊息／diagnostic](reports/overnight-import-feedback-20261026.md)已完成相關精簡驗證；[beta.17封包](reports/overnight-beta17-package-20261026.md)已完成固定工具pack／完整validate，原beta.15成品保留。主線q19／R2收尾、beta.17空白新玩家流程與背景抖動必要觀察持續至09:00前；[06:00交接](reports/morning-0600-dispatch-20261026.md)記錄用量中斷及恢復，兩個一次性排程均已觸發刪除。未發布，未宣稱全遊戲／正式雲端通過。以下為階段快照，以最新狀態板與專項報告為準。

夜間最新完成：[beta.16 NPC鍵盤焦點／點按說明](reports/overnight-dialogue-focus-20261026.md)，已做真browser針對驗收、typecheck及獨立build，無封包／發布。原beta.15成品／ZIP與其gameplay驗收持續保留；beta.17匯入取消說明處理中。整個09:00自主目標仍active，未宣稱全遊戲／正式雲端通過。

夜間續作（2026-10-26）：自主目標持續至香港09:00前，先完成beta.15實際browser及必要改善。已恢復可用CLI／隔離Chrome並補完[namespace browser報告](reports/ruins-d-browser-namespace-retry.md)；整體local browser仍PARTIAL，主線後半與枝線未全驗。beta.15成品／ZIP保留；新source優化另由owner分配，規格／分工／授權邊界見[夜間派工](reports/overnight-optimization-dispatch-20261026.md)。以下beta.15初次UNVERIFIED為歷史快照。

最新交付：[Plan15 D](15-ruins-acceptance-and-package.md) **SOURCE_READY／ZIP_VALIDATED；LOCAL_BROWSER_UNVERIFIED**。beta.15已修正正式本機ID並提供保全舊進度的明確匯入／暫不匯入；27個聚焦案例、型別、219引用、獨立build及固定工具pack／完整validate通過。ZIP `artifacts/ruins-d/game-beta15.zip`。瀏覽器工具無法啟動，沒有實際iframe／聲畫／路線證據；正式雲端與發布未執行，未commit／push。全新Luna Max最多三名並行，主對話未插圖。完整交接及續作見 [D handoff](reports/ruins-d-handoff.md)。下方D規劃與C交付為歷史快照。

下一輪計畫：[15 遺跡 D・存檔名稱空間、實際驗收與候選封包](15-ruins-acceptance-and-package.md) **PLANNED／尚未實作**。先修正生產入口仍使用`maplewood-swordsman`本機key的接線，以明確確認後的保全匯入接到正式ID；另先處理Node24.19.0低於規格24.22.1的前置條件。預計另立beta.15、格式仍讀1–4寫4，再做有範圍iframe、聲畫／進度及固定工具ZIP驗收；正式雲端與發布分階段另依範圍／授權處理。本輪只規劃，未改程式／版本或重新跑遊戲檢查。

最新交付：[14 遺跡 C・誓鐘內殿](14-ruins-bell-sanctum.md)的程式、素材與獨立候選已完成，版本 `1.0.0-beta.14`、產物 `artifacts/ruins-c/dist/`。包含司鐘者兩招／一次1200ms延後轉場、q18／q19與旅冠、22姿勢單圖集、讀1–4寫4及舊封套備份。全新Luna Max最多三名並行，主對話未載入生成圖；17個不同聚焦測試檔共127項、型別／內容／218引用檢查與build通過。C新增11個runtime檔7.21 MiB，全章20.85 MiB。正式瀏覽器／雲端／ZIP與發布未驗證，沒有commit／push／發布；來源、結果與下一步見 [C 整合交接](reports/ruins-c-handoff.md)。

先前交付：[13 遺跡 B・回聲探索](13-ruins-echo-exploration.md)的程式、素材與獨立候選已完成，版本 `1.0.0-beta.13`、產物 `artifacts/ruins-b/dist/`。新增長廊、q17／q20、兩碑inspect、兩種敵人與完整單姿勢圖集、格式3相容保全。92項分批聚焦測試、型別／內容／資產引用／build通過；實際瀏覽器、正式雲端、ZIP與發布未驗證。歷史結果見 [B 整合交接](reports/ruins-b-handoff.md)；A／B成品保留，C最新狀態以上段為準。

章節設計（2026-10-25）：[遠古遺跡・失聲的誓鐘](12-next-chapter-ancient-ruins.md)。完整規劃為4張地圖、3種普通怪、1名首領、q15–q19主線與q20支線；A／B／C候選已完成，D正式驗收與發布未完成。A／B的歷史檢查、素材來源及存檔限制保留於各自交接，最新讀1–4寫4決策以C交接為準。

更新：2026-10-18（香港時間）。T00 基礎與 G0 已完成；四包 canonical assets 已齊。T14 app、T07 renderer、T08 UI 已合入；`dist/` 與官方驗證的候選 ZIP 已產出，封面與 package evidence 已交付。T16 目前 PARTIAL：有限真實路線到 q01 2/3、read-load、Esc、icons、跨 origin `/dist/` iframe／sandbox／960/640 有限驗證完成；完整 q01–q08、45–60 分鐘、真實音訊、cloud、fullscreen、FPS 與平台發布未驗證。最新細節見[狀態板](status.md)、[T14 報告](reports/T14.md)、[T16 報告](reports/T16.md)與[封裝證據](../artifacts/T15-package-evidence.json)。

## 下一位主 Agent 從這裡開始

1. 讀根目錄 AGENTS.md，完整讀取當時最新 Playroom 指定線上規格。
2. 讀 [00-START-HERE.md](00-START-HERE.md) 與 [狀態板](status.md)，再讀 [01 定案範圍](01-game-design.md)、[07 共用契約](07-shared-contracts.md)、[08 內容與數值](08-content-spec.md)。
3. T00 G0 與 T00-09 已完成。T07/T08 source、T14 app、T15 official pack/validate 已交付；接著只處理 T16 明列的必要未驗收項目。完整 q01–q08 及 45–60 分鐘時長未驗證前，不標完整主線驗收通過。不要重新生成已入庫素材。
4. 不要對所有 17 包重新派工；先讀各 package report 和實際檔案，只補缺口。每包有細步驟、檔案所有權、介面、依賴與完成條件。
5. 主 Agent 只派工協調、不直接改程式碼；所有子代理依本包 ownership 修改，發現契約缺口時向主 Agent回報，不自行繞過。
6. 依 [11 整合驗收](11-integration-and-validation.md) 做有限驗收與交付，由主 Agent 維護 [狀態板](status.md)。

## 已定方向

台港大改版前風格、劍士、單機單角色、桌面鍵盤滑鼠、45–60 分鐘主線、自行生成素材、加快經驗／掉落／跑圖，以 Playroom 公開上架為目標。未來多人只保留模組接點，首版不做網路服務。公開上架是目標，不等於現在已授權建立 Release 或平台發布。

首版固定七張地圖、六種普通怪物、一名兩階段首領、五名 NPC、八個主線任務及 24 種物品。數值採經典機制的專案近似，不宣稱逐公式復刻。四職業、手機、二轉、多角色、交易及公會不在首版。

## 文件分工

| 文件 | 職責 |
| --- | --- |
| [00 交接入口](00-START-HERE.md) | 下一位主 Agent 的完整指令、開工及恢復 |
| [01 遊戲設計](01-game-design.md) | 已定範圍與行為 |
| [02 技術架構](02-technical-design.md) | 依賴方向、時間與部署 |
| [03 里程碑](03-implementation-roadmap.md) | 工作包與階段對照 |
| [04 素材原則](04-art-and-content.md) | 自行生成流程及紀錄 |
| [05 Playroom](05-playroom-and-acceptance.md) | 線上來源、平台約束及發布邊界 |
| [06 決策](06-decisions-and-risks.md) | 使用者答案與執行預設 |
| [07 共用契約](07-shared-contracts.md) | 型別、函式、資料流及所有權 |
| [08 內容規格](08-content-spec.md) | 所有內容 ID、任務與初始數值 |
| [09 並行調度](09-parallel-dispatch.md) | 依賴、波次、衝突及共用工具 |
| [10 資產規格](10-asset-spec.md) | 圖片、動畫、音訊及 manifest |
| [11 整合驗收](11-integration-and-validation.md) | 接線順序、有限驗證及交付 |
| [16 全世界完成計畫](16-world-completion-roadmap.md) | 四區18圖完成定義、逐圖內容、W00–W09實作順序與最小驗收 |
| [工作包索引](tasks/README.md) | T00–T16 的派工入口 |
| [狀態板](status.md) | 唯一全局進度，由主 Agent 維護 |

優先順序：使用者最新要求 → 根目錄 AGENTS → 當時線上 Playroom 規格 → 06 決策 → 07 介面 → 08 內容 → 工作包。發現矛盾由主 Agent 修正單一來源，子代理不能各自解讀。

本輪文件檢查：32份Markdown、17工作包、208個不重複步驟；本地連結無缺檔，步驟ID無重複。只驗收文件，不代表遊戲功能、素材、雲端保存或發布已通過。

