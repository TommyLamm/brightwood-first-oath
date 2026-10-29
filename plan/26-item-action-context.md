# 26・基礎體驗：物品操作的對象名稱與選取狀態

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan25完成交接](reports/plan25-handoff.md)後完成七處呈現屬性與beta33，見[本批交接](reports/plan26-handoff.md)。依使用者持續指令接續下一批。唯一現況見[status](status.md#current-state)。

## 來源與範圍

主代理讀取[UI](../src/ui/index.ts)的buildInventoryPanel與buildShopPanel：多個商店按鈕只有相同「購買」或「出售」名稱；背包使用／裝備／出售選取數量亦缺物品名稱。背包出售輸入只有「出售數量」，而商店數量輸入已包含物品名稱。背包格選取只有is-selected class，尚無aria-pressed。這是靜態名稱與狀態缺口，未實測screen reader。

沿用Plan19–25現有preview.quantity／total、item.name與formatNumber，不新增計算。只改兩個builder中的屬性與必要局部變數，不改可見文字、title、disabled、拒絕原因、action／dataset、focus key、append順序、handlers、helpers、CSS、價格／數量政策或資料。

主代理本新批次重新完整網讀Playroom範本、game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning及save-compatibility；截斷尾段補讀，沒有失敗。適用固定ID、相對資源、iframe、存檔相容及新候選要求。保留brightwood-first-oath／作者TommyLamm／desktop／四區18圖／Lv30／讀格式1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0。基線beta32、HEAD a20f4ac及共享dirty、舊候選／玩家資料／profiles保全。根無.codegraph，目標式讀檔。

## 呈現契約

| 原控件 | 本批增加的屬性 |
| --- | --- |
| 非空背包格 | aria-pressed為String(bagIndex === state.selectedBagIndex)，沿原索引與選取；不給空格或動作鈕加pressed。 |
| 背包「使用一個」 | aria-label為「使用一個：」加item.name，保留Plan25 marker與preview／disabled。 |
| 背包「裝備」 | aria-label為「裝備：」加item.name。 |
| 背包出售數量輸入 | aria-label為item.name加「 出售數量」。 |
| 背包「出售選取數量」 | aria-label為「出售選取數量：物品名，數量 N，收入 X 金幣」，N與X取salePreview.quantity／formatNumber(salePreview.total)。 |
| 商店「購買」 | aria-label為「購買：物品名，數量 N，總價 X 金幣」，沿preview.quantity／formatNumber(preview.total)。 |
| 商店單筆「出售」 | aria-label為「出售：物品名，數量 N，收入 X 金幣」，沿preview.quantity／formatNumber(preview.total)。 |

名稱以既有可見動作起頭；無新元素／wrapper／id／live region／role。必要時把原inline makeButton存到局部const後setAttribute，再append到原位置。不要重新呼叫preview、clamp、計價或用preview成功player。不改卸下／素材批售、分類、快捷列、商店數量輸入既有名稱或其他控件。

## 明確工作包與驗收

主代理負責Plan、局部diff審閱與交接；實作使用全新gpt-6-luna／max／fork none。先W01，審閱後才W02；不派多人同改UI。

### W01・名稱與選取狀態（Luna A）

唯一可寫src/ui/index.ts中上述兩個builder的七處、新plan/reports/plan26-item-action-ui.md。其他程式／helpers／tests／CSS／metadata唯讀。依表格實作；保留前批全部dirty。一次tsc，不新增或執行tests、不啟browser／讀屏／DOM或截圖、不build。報告實際改動／命令／結果及未驗界線。

### W02・新候選（全新Luna B）

W01完成審閱後指定高於beta32且未用的新版本／新目錄，不預占beta33。只改package／lock根版本及public manifest版本、本批新候選／tmp logs、新plan/reports/plan26-candidate.md。一次Node24.22.1系build／固定pack／完整ZIP validate／既有一次性audit路徑副本；source與dist SHA清單、六處metadata一致、有限文字scan與未掃範圍如實列出。不覆寫舊成品，不重跑tsc／tests，不browser、commit／push／tag／發布或排程。

### W03・主代理整合

讀七處diff，核對名稱使用既有預覽、原元素順序與所有dispatch／focus／disabled未變。新plan/reports/plan26-handoff.md，更新Plan／status／README，只查本批文件引用。一次tsc、新候選build／pack／完整ZIP validate通過即完成本批source／ZIP交付；screen-reader／實際click／keyboard／layout列未驗，低風險屬性修改不例行重試browser。完成後再開下一個Plan。
