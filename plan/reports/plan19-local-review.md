# Plan19 W06・本機短 route 結果

**瀏覽器啟動失敗；遊戲 route 與圖審未驗。** 2026-10-28 14:36（Asia/Hong_Kong）在指定的新 profile／CLI session 中，以 `about:blank` 首次啟動 Chrome 時，重現 crashpad pipe `0x6D`／`crash server failed to launch`。完整一次日誌：[open.log](../../output/playwright/plan19-local-beta25-20261028-01/open.log)。按 W06 與 browser lifecycle 停止，沒有重試、換 profile、升權或進行額外環境排障；這不是已確認的遊戲 source 缺陷。

完整的候選、工具版本、隔離前置、owner、原始記錄及觀測限制見 [run record](../../output/playwright/plan19-local-beta25-20261028-01/run-record.md)。本次直接核對 beta.25 manifest，且合成 fixture 的 SHA-256 符合其 provenance；候選 build／pack／完整 ZIP validate 沿用 [W05 報告](plan19-candidate.md)，沒有重跑。事前指定兩個 loopback port 均可綁定，但 browser 未成功建立，因此未啟動 server、建立 iframe 或存取 canonical save。

以下均**未驗**：

- 右 Ctrl 衝突提示、合法重綁及設定／guide／實際開背包一致，以及恢復隔離預設。
- canonical-null guard 和合成 fixture seed；商店容量不足原因、滿格可補堆疊、數量輸入後單次購買、裝備滿格阻擋與 before／after raw。
- 出售前槽後的背包選取／出售草稿清除、焦點、單擊及一次出售的 raw 對照。
- 960×540 的設定／商店／背包視審、640×360 擁擠面板截圖，以及 route console／失敗資源檢查。沒有產生截圖或交易 raw。

啟動 log 記錄 daemon 退出與 Chrome 退出；本環境 CIM 查詢受限，程序 parent／完整 daemon 命令列和事後 ports 狀態未能獨立確認。沒有 server，未使用批次關閉或按 PID 終止；本輪新 profile 與 log 均保留。此結果不代表正式平台、雲端或完整候選驗收。
