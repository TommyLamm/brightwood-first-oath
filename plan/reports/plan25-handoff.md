# Plan25 背包藥水使用前回饋・實作交接

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。依使用者持續建立Plan並實作、直到要求停止的指令，在 [Plan24完成交接](plan24-handoff.md)後完成 [Plan25](../25-inventory-item-use-feedback.md)。唯一現況見 [status](../status.md#current-state)。

主代理本新批次完整網讀Playroom範本及七份main指定文件，尾段補讀、沒有失敗；ID brightwood-first-oath／作者TommyLamm／desktop／格式讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0保留。HEAD a20f4ac與Plan19–24共享dirty、所有歷史候選／玩家資料／QA profiles不還原、不覆寫。根無.codegraph，目標式定位；app／UI基線副本存 `.playroom/tmp/plan25-integration-review/` 供局部diff。

## 分工與實際進度

| 包 | Owner | 狀態 |
| --- | --- | --- |
| W01 共用判定／app | 全新Luna Max `/root/plan25_item_use_app`，[報告](plan25-item-use.md) | 完成；新6 focused與精選1 app案例各一次過，主代理已讀helper／新tests／appdiff。 |
| W02 背包UI | 全新Luna Max `/root/plan25_inventory_ui`，[報告](plan25-ui-integration.md) | 完成；一次tsc exit0，主代理已讀四處局部diff。 |
| W03 新候選 | 全新Luna Max `/root/plan25_candidate`，續作為全新Luna Max `/root/plan25_candidate_resume` | 前代理用量中斷，僅升版與準備腳本；新代理從空候選目錄接續，[beta32報告](plan25-candidate.md)已交付。build／pack／完整ZIP validate／audit各一次exit0。 |
| W04 Browser | 條件未成立 | 未啟動，不例行重試0x6D。 |

共用resolveItemUse保留原cooldown優先、有限小藥轉大藥、缺貨補貨訊息及domain useItem順序；app成功後才在原位置設nowMs+1000及採用player。新helper只計算，不設deadline／派命令，輸入不變。主代理對照app原檔，增量只有import與原useItem分支共用化。

UI已只在帶inventoryUse marker的背包鈕作預覽／最新view guard，丟棄成功player；原requestedId仍由app正式處理。快捷列無marker路徑保留；signature只一個庫存面板cooling布林，不用每幀時間／timer。原數量、focus、reconciliation與其他panel無本批增量，主代理已讀全部四處UI diff。

## 實際檢查與界線

新tests/item-use一檔6組focused過，既有app-gameplay只精選原fallback／補貨一例過、25例略過；合計兩檔7個不同案例，各命令一次。UI一次tsc過；新候選build／固定pack／完整ZIP驗證／audit各一次exit0，主代理讀候選報告、validator與build log。沒有重跑前批領獎、交易、鍵盤或全suite。

## 凍結候選

`brightwood-first-oath`／`1.0.0-beta.32`，[Dist](../../artifacts/plan25-1.0.0-beta.32/dist/)／[game.zip](../../artifacts/plan25-1.0.0-beta.32/game.zip)。ZIP 131,525,888 bytes／274 entries，SHA-256 `0e4686a2533a37cd8e50139f89d7a897accfe6deb674c2984419ba6e72b8a932`。source清單421 files／135,729,599 bytes，dist274／135,744,678 bytes；完整清單hash及六處版本一致性見候選報告。有限8-pattern文字掃描14 entries／1,762,341 bytes零命中；260 binary entries／133,982,337 bytes未掃，不宣稱binary audit。完整logs及腳本在 `.playroom/tmp/plan25-candidate-beta32/`。原候選與資料保留。

真timed DOM到期再啟用、focus／click、排隊時狀態與版面未驗，不以pure模型或型別檢查代替。沒有本批browser／server或新QA資源，不用舊PID清理。未commit／push／tag／Release／平台發布或建立排程。完成本批交接後再依持續指令規劃實作下一批。

主代理一次本批文件引用檢查：7份文件、71個本地連結、7個Markdown anchor，零失敗；未重跑遊戲檢查。
