# Plan 33：最大可買量 UI 整合

日期：2026-10-29（Asia/Hong_Kong）  
狀態：W02 實作完成，待主代理審閱。

## 依據與適用要求

根據主代理本任務完整網讀的 Playroom `game-agent-template.md`，以及其中列出的 game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning、save-compatibility 七份規格；本次 UI 改造只涉及遊戲內操作，不更動資源路徑、iframe、存檔、SDK、metadata 或發布成品。Plan 33 的交易契約要求選量只更新 UI 草稿、沿用 domain preview、仍由玩家按原購買按鈕成交，且不改既有 buy/sell/filter/input handler。

## 完成內容

- 在 `src/ui/index.ts` 匯入 `previewMaximumBuy`，新增 `select-max-buy` action。
- 只為 `stackLimit > 1` 的商品卡新增「選擇最大可買量」secondary 按鈕，置於數量欄位外、總價前；按鈕具備商品名稱與可見文字組成的 aria-label、`data-item-id` 及 `shop-max-<id>` focus key。
- 每次建構 stackable 商品卡額外呼叫一次 `previewBuy(quantity: 1)`，只用來設定按鈕 disabled/title；失敗顯示原拒絕原因，成功顯示「依目前金幣與背包空間設定數量，最多99；不會立即購買。」。未在 render 掃描最大數量，也未依目前草稿數量決定按鈕是否啟用。
- click handler 從最新 `currentView` 重新取得玩家、規則、互動狀態與商品，拒絕缺值及非 stackable 商品；僅在 `previewMaximumBuy` 成功後更新該商品的 `shopQuantities` 並呼叫 `renderPanel(latestView, true)`，不 dispatch 購買命令。
- 依 `.playroom/tmp/plan33-integration-review/ui-before.ts` 審閱差異，修改僅限本包指定的 import、action、handler 和商品卡按鈕；原 buy/sell/filter/input handler 未改。

## 驗證與限制

- 執行一次：`node node_modules/typescript/bin/tsc --noEmit`；exit code `0`。`node` 由 PATH 解析為 `C:\Program Files\nodejs\node.exe`，版本 `v24.19.0`。
- 本包未使用派工指定的 `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`（預期 `v24.22.1`）；這是本次驗證 runtime 的偏差。沒有重跑 tsc。
- 沒有執行 tests、browser 或 build。W01 的五項 focused tests 由其 owner 執行並回報 5 PASS，本包沒有重跑。
- 真實 click、focus 還原、數量草稿呈現及版面尚未經 browser 或遊戲內驗證。

## 下一步

主代理審閱本次 UI diff 後，接續 W03 候選成品工作；如發現 UI 差異問題，先由主代理指示處理。Plan 33 整體仍待候選與 handoff 階段完成。
