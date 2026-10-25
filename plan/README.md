# 經典劍士冒險：多代理實作交接索引

最新交付：[13 遺跡 B・回聲探索](13-ruins-echo-exploration.md)的程式、素材與獨立候選已完成，版本 `1.0.0-beta.13`、產物 `artifacts/ruins-b/dist/`。新增長廊、q17／q20、兩碑inspect、兩種敵人與完整單姿勢圖集、格式3相容保全。全新GPT-6 Luna Max最多三名並行，來源／原稿留工作區。92項分批聚焦測試、型別／內容／資產引用／build通過；實際瀏覽器、正式格式3雲端橋接、ZIP與發布未驗證。完整結果見 [B 整合交接](reports/ruins-b-handoff.md)；保留A beta.12成品，本批完成即停。

章節設計（2026-10-25）：[遠古遺跡・失聲的誓鐘](12-next-chapter-ancient-ruins.md)。完整規劃為4張地圖、3種普通怪、1名首領、q15–q19主線與q20支線；A（營站／石道、苔陶蟲、q15／q16）及B候選已完成，C／D尚未完成。A的檢查、素材來源與存檔限制見 [A 整合交接](reports/ruins-a-handoff.md)，B讀1／2／3寫3的新決策以上方B交接為準。

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
| [工作包索引](tasks/README.md) | T00–T16 的派工入口 |
| [狀態板](status.md) | 唯一全局進度，由主 Agent 維護 |

優先順序：使用者最新要求 → 根目錄 AGENTS → 當時線上 Playroom 規格 → 06 決策 → 07 介面 → 08 內容 → 工作包。發現矛盾由主 Agent 修正單一來源，子代理不能各自解讀。

本輪文件檢查：32份Markdown、17工作包、208個不重複步驟；本地連結無缺檔，步驟ID無重複。只驗收文件，不代表遊戲功能、素材、雲端保存或發布已通過。

