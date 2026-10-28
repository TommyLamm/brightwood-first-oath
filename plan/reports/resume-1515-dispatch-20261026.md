# 2026-10-26 15:13 續作分工

收尾：q07／q08已正常手動領獎、第一章結算完成；最終raw／root獨立核對／所有owner清理結果見 [完成交接](resume-1515-handoff-20261026.md)。額外遺跡fixture載入受自動審查拒絕，未繞過、未新增視覺PASS；下方分工為開始時規劃，不表示每個預定驗收均已執行。

使用者再次授權接續未完成內容；這是白天續作，不新增排程，不套用已結束的 09:00 排程期限。開始時 ordinaryUsageAllowed=true，五小時／週用量均顯示 0%；未兌換任何重置信用。

## 範圍與所有權

- root：讀規格、判斷、審查及維護 status／README／Plan15／集中交接。保留既有未提交變更，不 commit、push、tag、Release 或上架。
- 全新 `gpt-6-luna`／max／無歷史 fork，`q07_q08_1515`：唯一 browser／service owner。以新專用 origin 載入完整未修改的 q07 2/6、0/6 raw，正常 UI 完成剩餘四魔像／六哨兵、手動領 q07、接 q08、守衛／核心及手動領獎到 chapterComplete。新證據與 helper 放 `output/playwright/resume-1515/`，專有報告 `resume-q07-q08-1515-20261026.md`。
- 全新同模型／推理設定 `plan15_gap_review_1515`：僅靜態整理已完成／本機剩餘／外部未驗／目標未達的證據界線，專有報告 `plan15-remaining-review-20261026.md`；無 browser、service 或遊戲 source 寫入權。
- 靜態 owner 完成後，另派全新同設定 `boss_visual_1515`：獨立 boss fixture／origin／context／service，只補預警、半血轉場及結果／重試的可觀察畫面；不重測已有時長。專有 `output/playwright/boss-visual-1515/` 及 `resume-boss-visual-1515-20261026.md`。
- `maps_visual_1515`：獨立 origin／context／service，僅補營站、苔石道、內殿的短移動／地面／背景觀察，不重跑已驗長廊；專有 `output/playwright/maps-visual-1515/` 及 `resume-maps-visual-1515-20261026.md`。既有完整 fixture 不改值，跨圖只正常 UI。
- 同時最多三個子代理；靜態 review 已完成，三個 browser owner 的存檔／origin／服務明確分開。root 已轉述適用規格，子代理不必重讀線上規範。

SUT 固定 `artifacts/overnight-20261026/portal-labels/dist`，ID `brightwood-first-oath`、`1.0.0-beta.18`、schema2／SDK1.1.0／protocol1／tools1.2.0、desktop、存檔讀1–4寫4。bundle SHA `1c26346100c38d09beee5b7cc331210e29274ba1dc757c67021d9b3c302e6cab`。開始 raw：`artifacts/resume-20261026-1154/q07-q08/checkpoint-q07-active.json`，1303B／SHA `8cae43f3050b228a55182c4c6cf55710edda5566e54628bda942caefeb2acf98`。不得回滾補血、改數值、私有 runtime 移動或把分段角色稱為 beta18 從零通關。

## 本次規格來源

root 在香港時間 15:13–15:15 以網路工具完整讀取，下列文件的截尾／中段亦逐段補齊：

1. https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md
2. https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md
3. https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md
4. https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json
5. https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml
6. https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js
7. https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md
8. https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md

適用要求：保留遊戲 ID／舊存檔及使用者改動；跨來源 sandbox iframe／版本子目錄實測；失敗不當空檔、不碰真實玩家 origin；只有實際證據才寫通過；本機 harness 不代替正式平台／雲端或可聽音訊。沒有 source 變動時不重跑已通過 build／tests／pack。首領既有約18秒樣本仍是45–80秒目標未達，依原計畫凍結數值，需設計決策另提。

root／browser owner 使用已讀的 Playwright skill，已確認 npx 存在，沿用已知 Node24.22.1 與 CLI。必要影像只用小型局部 JPEG，完整圖與日誌留工作區。所有 batch 結尾放開按鍵並暫停；服務／port／context 各自記錄，只清理自己建立的資源。
