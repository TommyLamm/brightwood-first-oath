# 33・基礎體驗：選擇最大可買量

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan32完成交接](reports/plan32-handoff.md)後，依持續優化授權執行。唯一現況見[status](status.md#current-state)。

## 來源與契約

主代理讀取src/ui/index.ts的buy handler與buildShopPanel、trade-preview.ts及domain buy：堆疊貨品只有1–99手動輸入，較難同時估計金幣及背包容量。新增「選擇最大可買量」只設定草稿，玩家仍按原購買按鈕。沿previewBuy的domain判斷，不另算價格／背包公式，不修改購買規則或保存資料。

新增src/ui/maximum-buy-preview.ts，匯出`previewMaximumBuy(input: Omit<TradePreviewInput, 'quantity'>): TradePreview`。先previewBuy(quantity1)，失敗原樣返回；非堆疊也返回1。堆疊且1成功時依99→2降序預覽，第一個成功即回傳，無成功回傳原1。最多99次preview，只於選量click使用，禁止逐幀／render掃描。正價格與既有addStacks容量使1失敗時更大數量亦失敗；domain保留唯一規則來源。不得修改player/catalog、不得回傳或套用domain player。

UI只對既有stackLimit>1貨品新增secondary按鈕，置於quantityRow label外、總價前，文字「選擇最大可買量」、aria-label加物品名稱、focus `shop-max-<id>`、data.itemId、action `select-max-buy`。每張堆疊卡只多一次previewBuy(quantity1)作disabled／title，失敗沿原reason，成功title「依目前金幣與背包空間設定數量，最多99；不會立即購買。」；不可用當前數量preview決定最大量鈕，避免99買不起時無法調回可買值。

handler讀currentView的最新player/catalog/interaction，缺物品或非堆疊即return；previewMaximumBuy成功才更新該item的shopQuantities及renderPanel(latestView,true)。不dispatch／扣款／改背包，不清其他maps／分類／bag selection，原購買與出售handler不動，沿原preserveFocus／數量input規則，不新增timer／CSS／依賴。

## 已讀規格、保留與驗收

主代理本次完整網讀Playroom範本、game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning與save-compatibility（讀取尾段完整，無失敗）。適用相對資源／iframe／新候選不覆寫／存檔相容；保留brightwood-first-oath、TommyLamm、desktop、Lv30四區18圖、讀1–5寫5、SDK1.1.0／protocol1／schema2／tools1.2.0。基線beta39及共享dirty、玩家資料、profiles、所有舊成品保留；無.codegraph，使用定點讀檔。

## 清楚分工

主代理規劃、審閱、交接；每包全新gpt-6-luna／max／fork none，依序單owner。

- W01只寫新helper、新tests/maximum-buy-preview.test.ts與新reports/plan33-maximum-preview.md。至多5組focused覆蓋99上限、金幣邊界、部分stack／空格／滿包容量、商人優先及不可買／未知拒絕、非堆疊1與input不變／無player輸出。小fixture用真preview/domain。只一次新檔vitest，必要修正只重跑失敗例；不tsc／browser／build。
- W02只改index.ts上述import／action／handler／卡內按鈕及新reports/plan33-ui-integration.md；其他helpers/domain/app/tests/CSS唯讀。一次tsc；不tests／browser／build。主代理審新helper與整段UI diff。
- W03審閱後核高於beta39未用版本與新目錄，只metadata版本、新候選dist/ZIP/source及distSHA清單、本批tmp及reports/plan33-candidate.md。一次Node24 build／固定pack／完整ZIP validate／有限文字audit；複製audit時先核artifact與tmp均指本批。不得重跑W01/W02通過檢查或覆寫舊成品。
- W04主代理寫reports/plan33-handoff.md、Plan/status/README，一次文件引用檢查，列真click／focus／草稿／版面未驗，不重試已知0x6D browser環境。完成後才開下一Plan。

不commit／push／tag／發布／建立Release／額外排程；02:40一次性已刪除，07:50沿實際進度續作。
