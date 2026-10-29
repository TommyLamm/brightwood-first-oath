# Plan20 裝卸與單筆出售回饋・實作交接

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。使用者要求作者改為 `TommyLamm` 及「繼續優化實作」，已完成 [Plan20](../20-item-action-feedback.md) 與beta27候選。唯一全局入口仍為 [status](../status.md#current-state)。

## 基線與適用要求

HEAD `a20f4ac`，Plan19／20文件與Plan19實作仍在共享dirty，保留不覆寫。原候選beta26與更早成品、玩家資料／profiles保留。本輪主代理完整網讀Playroom template及七份main規格，game-development尾段補讀；適用固定ID、相對資源、desktop iframe、相容存檔、固定工具與新版本候選要求。根無.codegraph，使用目標式rg／讀檔。

ID `brightwood-first-oath`、desktop、讀格式1–5／寫5、SDK1.1.0／protocol1／schema2／tools1.2.0維持。作者已在 `public/game.json` 改為 `TommyLamm`，新source／dist／ZIP manifest均已核對一致；不修改凍結beta26。

## 分工與實際結果

實作包使用全新Luna Max、fork none，主代理分析／審閱與文件整合；只派明確檔案範圍。

| 工作包 | Owner | 目前結果 |
| --- | --- | --- |
| W01 裝卸純model | `/root/plan20_equipment` | [equipment preview](plan20-equipment-preview.md)完成，1檔6項focused通過 |
| W02 單筆出售純model | `/root/plan20_sale` | [sale preview](plan20-sale-preview.md)完成，1檔5項focused通過 |
| W03 UI整合 | `/root/plan20_ui` | [單owner接線](plan20-ui-integration.md)完成，tsc一次exit0，沿用既有reason樣式 |
| W04 新候選 | `/root/plan20_candidate` | [beta27](plan20-candidate.md)完成並凍結，build／固定工具pack／完整ZIP validate各一次過 |
| W05 Browser | 條件未成立，不啟動 | 沒有具體新執行環境，沿用已知0x6D限制，不換profile重試 |

本批不改domain、價格、金幣／容量上限、藥水冷卻、批次素材出售、存檔或焦點／數量生命週期。預覽只讀原domain Result，不套回player，真正操作仍dispatch原命令。

## 檢查與界線

兩新helper focused合計2檔11項通過，UI typecheck一次exit0；beta27 build／pack／完整ZIP validate各一次過。未變35項／327項與content不重跑。

主代理對照本輪W00保留的UI原檔，靜態確認 `sell-materials`、`onInput`、`onChange`、重綁`onKeyDown`、`renderPanel`背包focus／reconciliation、buy六段逐字相同；局部diff僅兩helper import、三操作guard及相關面板回饋。不是DOM或click測試。`.ms-sell-row`既有flex-wrap及reason文字overflow-wrap可承接新原因，實際換行／可讀性仍未驗。

沒有browser／server或新的QA資源；實際click／focus／面板可讀性仍未驗，不以model或ZIP代替。未commit、push、tag、Release、平台上架或排程，不自動新增Plan21。

## 玩家行為與候選

- 背包裝備／裝備面板卸下鈕使用同一domain預覽；滿格卸下顯示原因並停用，滿格但可取出一件交換的裝備維持可用。等級與其他拒絕沿原Result，不另建規則。
- 背包詳細區與商店單筆出售列同源顯示數量、收入與拒絕原因；接近金幣上限的失敗可在操作前看見。點擊再讀當前view重判，被拒絕保留數量草稿；成功才送原sell，不自動縮量。
- 「出售全部素材」與藥水、經濟、存檔、原input／focus流程維持；本批不宣稱批次交易也已有新預覽。

候選 [dist](../../artifacts/plan20-1.0.0-beta.27/dist/)／[game.zip](../../artifacts/plan20-1.0.0-beta.27/game.zip)：`brightwood-first-oath`／`1.0.0-beta.27`、author `TommyLamm`。ZIP 131,524,728 bytes／274 entries，SHA-256 `b5e2fe4dd3f6438ee07d3041873b72f6fed3c82f6a9910bcf5fda98e326fc8ae`。source／dist清單、Node24.22.1、固定tools1.2.0與實際logs詳見候選報告。有限文字掃描14 entries最終0命中，初始JWT-like誤報及規則修正有保留；260個其他entries未掃，不等於完整機密稽核。

沒有具體新環境，W05條件未成立，本次沒有啟動Terra／browser重試0x6D。原beta25失敗及受限程序觀測留在原報告，不冒稱beta27已清查全主機或完成局部UI驗收。所有四個實作工作包已回報，沒有持續操作或新server。

最後一次文件檢查涵蓋本批8份文件／入口：51個本地連結、7個Markdown錨點均可解析。未掃全repo歷史；此補記不新增引用、不重跑檢查。
