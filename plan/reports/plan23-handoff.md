# Plan23 背包分類與格位說明・實作交接

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。依使用者持續指令，於 [Plan22完成交接](plan22-handoff.md)後完成 [Plan23](../23-inventory-category-clarity.md)。唯一現況為 [status](../status.md#current-state)。

本批重新完整網讀Playroom範本與七份main指定規格，尾段補讀、沒有失敗；保留ID brightwood-first-oath、作者TommyLamm、desktop、格式讀1–5寫5及SDK1.1.0／protocol1／schema2／固定tools1.2.0。根無.codegraph，目標式定位。HEAD a20f4ac及Plan19–22共享dirty、舊候選、玩家資料／QA profiles保留，未還原。

## 分工與實作

| 包 | Owner | 實際狀態 |
| --- | --- | --- |
| W01 背包呈現 | 全新Luna Max `/root/plan23_inventory_ui`，[報告](plan23-inventory-ui.md) | 完成；只改buildInventoryPanel及報告，一次tsc exit0。 |
| W02 新候選 | 全新Luna Max `/root/plan23_candidate`，[報告](plan23-candidate.md) | 完成；beta30 build／固定pack／完整ZIP validate各一次exit0。 |
| W03 主代理 | `/root` | 已讀全部局部diff及候選報告，完成來源／未驗界線交接。 |

已加入背包分類群組與aria-pressed、現分類／stack組數和容量提醒；grid及分類空位描述有區別，物品aria-label使用原bagIndex+1。未選取細節區區分真空背包、空分類及有物品尚未選取，已選取詳細區保留。

主代理對照 `.playroom/tmp/plan23-integration-review/ui-before.ts`，確認原filter predicate、32格loop、data-bag-index、focus key、交易與選取命令均無增量；CSS、其他函式、app／domain／helper未改。沒有新重置鈕、鍵盤模式、live region或持久化狀態。

## 實際檢查與未驗

W01一次typecheck exit0，候選build／pack／完整ZIP驗證各一次過；未新增／執行tests，未啟動browser或截圖，前批focused與大suite不重跑。PowerShell FileSystem provider啟動警告為既有環境訊息，tsc無診斷。

局部diff只能確認程式及文字／屬性範圍，不能代表真實keyboard、screen reader、click／focus或640排版通過。這是低風險呈現改善，依使用者最小驗證指令略過browser，不重試既有0x6D。無本批browser／server或QA新資源；未commit／push／tag／Release／發布或建立排程。本批完成後再規劃實作下一批。

## 已凍結候選

[dist](../../artifacts/plan23-1.0.0-beta.30/dist/)／[game.zip](../../artifacts/plan23-1.0.0-beta.30/game.zip)：`brightwood-first-oath`／`1.0.0-beta.30`，author TommyLamm，source／dist／ZIP metadata一致。ZIP 131,525,605 bytes／274 entries，SHA-256 `d4d31635a3f0575e4f766fa6956f8b8d2cc631d51ac76553d09e7227f11eb5fc`。source419檔與dist274檔SHA清單及logs見候選報告。

8類有限文字掃描14 entries／1,761,319 bytes零命中，260個其他entries未掃，不等於binary／完整機密稽核。原beta29與更早成品不改。兩個全新Luna包均已回報完成；無本批持續操作，依指令接續下一批。

本批一次文件引用檢查：6份文件／當前入口、54個本地連結、7個Markdown錨點均可解析；未掃歷史全repo。此補記無新引用，不重跑。
