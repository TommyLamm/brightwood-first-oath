# 34・基礎體驗：商店背包容量提示

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。在[Plan33交接](reports/plan33-handoff.md)完成後依持續指令執行。唯一現況見[status](status.md#current-state)。

主代理已定點讀取buildInventoryPanel／buildShopPanel及domain buy／addStacks：背包有已用N／32格及>=28接近滿格樣式，商店只顯示金幣，需換面板才能看容量。滿格時仍可能補入同類未滿堆疊，因此本批只補資訊，不設新禁買條件。

## W01・單一UI owner，全新Luna Max

唯一可寫src/ui/index.ts的buildShopPanel錢包後一小段及新reports/plan34-capacity-ui.md。錢包p後、offers/grid前增加p.ms-panel-note，依序append文字「背包：」、strong（與inventory完全相同的`used >= 28 ? 'ms-bag-usage is-near-full' : 'ms-bag-usage'`，文字「已用 N／32 格」，used=player.bag.length）、文字「。可堆疊物品可補入同類未滿堆疊；能否購買依各貨品提示。」。不用innerHTML，不改inventory或新抽象／CSS，不新增role或aria-live避免重複播報。

不改任何preview、handler、disabled、分類、數量maps、bag selection、焦點或signature。現有signature已包含player，沿原render更新即可，不加timer。只顯示整個背包的占格數，不能用商店filter或物品數量合計冒充格數。不以used>=32禁買，保留Plan33最大量及domain容量規則。

只執行一次指定Node24.22.1的tsc --noEmit，主代理讀局部diff；純呈現不加tests／browser／DOM。實際換類、交易後刷新及版面列未驗。

## W02・獨立新候選，全新Luna Max

W01審閱後核高於beta40未用版本及目錄；只改package／lock top/root／public manifest版本、新artifacts/plan34-<version>/{dist,game.zip,source-files.sha256,dist-files.sha256}、本批tmp、新reports/plan34-candidate.md。指定Node24.22.1一次build／固定tools1.2.0 pack／完整ZIP validate／audit。複製Plan33 audit腳本只改本批路徑及版本，注意artifact字串兩處，執行前核artifact與tmp皆本批。既有成功checks不重跑，準備失敗與正式檢查分開記錄。有限文字掃描／binary未掃界線如實列。

## W03・主代理交接及保留

主代理寫reports/plan34-handoff.md與Plan/status/README，一次本批文件引用檢查；source／ZIP可交付但browser未驗，不稱平台通過。完成再開下一Plan，不擴本批範圍。

本批已完整網讀Playroom範本、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning及save-compatibility（refs102–105，尾段完整無失敗）。適用身分／新候選不覆寫／相對資源與iframe／存檔相容。保留brightwood-first-oath／TommyLamm／desktop／Lv30四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0；shared dirty、HEAD a20f4ac、玩家資料／profiles／舊成品不動。不commit／push／tag／發布／Release／新增排程。不例行重試0x6D環境；02:40一次性已刪除，07:50保留。
