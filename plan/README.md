# 經典劍士冒險：多代理實作交接索引

更新：2026-10-18（香港時間）。T00 基礎與 G0 已完成；T00-09 隨四包 canonical manifests 收尾。多個 domain、UI、app、音訊及 Playroom adapter 工作包已有局部報告；T10–T12正式素材交付詳[本次素材交付](reports/asset-recovery-20261018.md)。T07/T14 視聽接合與瀏覽器驗收仍待完成，目前沒有經驗收的可玩候選、封面或ZIP。最新狀態見 [狀態板](status.md) 與各包報告。

## 下一位主 Agent 從這裡開始

1. 讀根目錄 AGENTS.md，完整讀取當時最新 Playroom 指定線上規格。
2. 讀 [00-START-HERE.md](00-START-HERE.md) 與 [狀態板](status.md)，再讀 [01 定案範圍](01-game-design.md)、[07 共用契約](07-shared-contracts.md)、[08 內容與數值](08-content-spec.md)。
3. T00 G0 與 T00-09 已完成。依 [09 並行調度](09-parallel-dispatch.md) 接續未完成包：T07/T14 實際視覺接合、T14-22 瀏覽器音訊與接合驗收、T14-25 完整路線，再完成 T15-08/11 與 T16。不要重新生成已入庫素材；畫面接合及路線時間未驗收前不標候選完成。
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

