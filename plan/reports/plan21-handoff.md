# Plan21 批次素材出售回饋・實作交接

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。依使用者「持續建立新Plan並實作，直到我讓你停下」完成 [Plan21](../21-material-sale-feedback.md)，本批已交接，可接續規劃並實作下一批。唯一現況為 [status](../status.md#current-state)。

## 基線與規範

HEAD `a20f4ac`，共享工作區的Plan19／20未提交增量均保留。上一個候選beta27與更早成品、玩家資料／QA profiles不改。本輪主代理重新完整網讀Playroom範本及七份main規格，development／SDK／workflow尾段補讀，沒有讀取失敗；適用固定ID、相對資源、desktop iframe、相容存檔、新版本候選及固定工具要求。根無.codegraph，目標式讀檔。

作者 `TommyLamm`、ID `brightwood-first-oath`、desktop、讀格式1–5／寫5、SDK1.1.0／protocol1／schema2／tools1.2.0保留。主代理備份本批UI基線到 `.playroom/tmp/plan21-integration-review/ui-before.ts`，只供局部diff審閱，不是遊戲候選。

## 分工與實際進度

| 工作包 | Owner與報告 | 實際結果 |
| --- | --- | --- |
| W01 純預覽 | 全新Luna Max `/root/plan21_material_model`，[報告](plan21-material-sale-preview.md) | 完成；新helper與六組focused一次通過；主代理已讀helper／全部六組案例。 |
| W02 商店UI | 全新Luna Max `/root/plan21_material_ui`，[報告](plan21-ui-integration.md) | 完成；tsc一次exit0，CSS未改，主代理已讀三段局部diff。 |
| W03 候選 | 全新Luna Max `/root/plan21_candidate`，[報告](plan21-candidate.md) | 完成；beta28 build／固定工具pack／完整ZIP validate各一次exit0。 |
| W04 Browser | 條件未成立 | 未啟動，不例行重試既有0x6D。 |

## 本批語義

純收集器保留高至低原index、正售價material整組候選；預覽逐筆真正domain，成功接狀態、失敗維持狀態續行。收入以最終coins差值計算，不把全素材標價總和當成預期收入；部分拒絕仍保留首個原因。預覽不回傳player，不改domain或存檔。

UI已使用同一model顯示及最新view點擊防線；部分可成交仍派完整候選，包括預覽拒絕者，不改原逐命令政策。原app的距離／queue時狀態仍為權威，不以預覽宣稱已售／已保存。

## 檢查與未驗界線

W01一檔6項focused、W02一次typecheck及W03一次build／pack／完整ZIP驗證實際通過，命令見各包報告。前批11／35／327項不重跑、不稱本批結果。主代理對照UI基線，diff只有import、批次click及批次render三處；單筆交易、裝卸、input／change、focus／rebind與其他panel沒有本批增量。這是靜態審閱，不是DOM／click驗收。

沒有browser／server或新QA資源；真實點擊、focus、面板可讀性與640換行未驗。既有0x6D限制照原歷史保留，不用舊PID清理。未commit／push／tag／Release／平台發布或建立排程。

## 已凍結候選

[dist](../../artifacts/plan21-1.0.0-beta.28/dist/)／[game.zip](../../artifacts/plan21-1.0.0-beta.28/game.zip)：`brightwood-first-oath`／`1.0.0-beta.28`，作者TommyLamm，source／dist／ZIP metadata一致。ZIP 131,525,250 bytes／274 entries，SHA-256 `37d9749d6b5c60b7fbb7f9435869c8f347e9a5b8e6d90f8cdb8e4640cc545540`；source417檔與dist274檔雜湊清單、logs均見候選報告。

有限文字掃描14 entries／1,760,081 bytes、8類pattern零命中；260個其他entries未掃，不等於binary或完整機密稽核。原beta27與更早候選不改。三個實作工作包均已回報完成，沒有本批持續操作或新QA資源。

本批一次文件檢查涵蓋8份文件／當前入口，65個本地連結、7個Markdown錨點均可解析。未掃歷史全repo；此補記無新引用，不重跑。
