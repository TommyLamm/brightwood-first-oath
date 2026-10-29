# Plan20 規劃證據

2026-10-28（Asia/Hong_Kong）。本報告記錄主代理在本輪輸入修整完成後，為 [Plan20](../20-item-action-feedback.md) 所作的目標式source分析；**Plan20尚未實作，沒有其browser結果**。

## 來源與已完成前置

本輪網路完整讀取Playroom template及其七份main規格，game-development尾段已補讀；適用ID／相對路徑／iframe／存檔相容／新候選版本／固定工具與發布邊界。根無.codegraph，使用rg與相關函式讀檔，未索引repo。

沿用 [Plan19原交接](plan19-handoff.md)及 [本輪輸入修整](plan19-input-polish.md)。修整已先完成，一次tsc成功；新beta26 build及完整ZIP validate通過後才寫本plan。詳細candidate／有限掃描與source識別見 [beta26報告](plan19-polish-candidate.md)。未變helper4檔35項屬先前已過結果，本輪沒有重跑。

## 靜態證據與推論界線

下列行號依本次修整後source，之後實作前仍應按符號定位。

| 來源 | 直接觀察 | 推論／限定 |
| --- | --- | --- |
| [UI](../../src/ui/index.ts) `buildEquipmentPanel`（2470附近） | 有通用卸裝需空位文字；itemId存在便建立卸下鈕，沒有容量disabled／局部reason。 | 可改善預操作回饋；不表示domain卸裝會丟物品。 |
| 同檔 `buildInventoryPanel`（2321附近） | 裝備按鈕只預判tooLow；保留既有比較及出售數量。 | 裝卸應共用domain預覽，不用bag.length32禁掉所有equip。 |
| [progression](../../src/domain/progression/index.ts) `equip` 400–419附近 | 先remove背包一件，再assign裝備，最後把舊裝備add回draft。 | 合法滿包交換可成功；須有focused正向案例防誤禁。 |
| 同檔 `unequip` 420附近、`addStacksToDraft` 203附近 | 裝備回draft bag走既有addStacks；超32格回BAG_FULL，失敗draft不套回。 | 直接取Result可保留原容量規則，無需第二套公式。 |
| UI `buildInventoryPanel`／`buildShopPanel` 單筆sell（2450／2659附近） | disabled只看merchant；商店顯示sellPrice×quantity，沒有金幣上限前置reason。 | 兩面板應共用同一單筆sale preview；未browser確認點擊。 |
| progression `sell` 379–398附近 | 先驗index／數量／可售性及nextCoins，再扣物品、必要時splice；COIN_CAP=9,999,999。 | 現有安全拒絕，不是資產漏洞；UI可在點擊前呈現相同結果。 |
| [gameplay](../../src/app/gameplay.ts) `sell` 521附近 | app再查merchant互動及nearNpc，成功才採用domain player。 | UI的merchant預覽只做既有前置；實際距離／命令仍由app負責。 |
| UI `sell-materials` 1678附近 | 由高至低index逐命令出售素材。 | 原子化或跳過超限是另一政策，本批不引入。 |
| gameplay `useItem` 541附近；[UiSnapshot](../../src/contracts/ports.ts) | app先判potionReadyAtMs，可能替代大小藥，再套用domain；snapshot有nowMs／potionReadyAtMs。 | 藥水可用性不等於單純domain Result，避免把它塞進裝卸model而漏冷卻／身份。延後。 |

source看到的判定差異與未驗互動分開。沒有browser重現物品遺失、金幣異常或舊focus缺陷，不據此宣稱嚴重交易bug。

## 範圍與派工核對

新 `src/ui/equipment-preview.ts`／`src/ui/sale-preview.ts`、相應兩新test在規劃時不存在。W01／02獨立Luna檔案互斥，W03才獨占UI；不讓三人改同一大檔。所有實作／修復用全新Luna Max，browser唯一Terra Max；主代理分析／審閱／文件整合。沒有為本規劃啟動代理。

未選藥水冷卻、批次售出政策、金幣／價格／32格變更、排序搜尋、新內容、SDK／存檔遷移或browser底層排障。已知0x6D只保留有界QA條件，不假設新profile能解決。

## 本規劃檢查

只檢查兩新文件及本輪入口／交接新增引用與工作包互斥；不為寫plan跑遊戲tests、content、build、pack或browser。實際連結檢查結果由主代理收束補記。PLAN_READY只代表可派工，不代表執行或驗收通過。

實際一次文件檢查：8份本輪新／修改文件與入口範圍，72個本地連結、8個Markdown錨點均可解析。已靜態核對兩model互斥、UI後接、預覽不採用player、批次素材／藥水排除及browser有界條件。此補記沒有新引用，不重跑檢查。
