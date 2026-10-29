# Plan19 規劃證據與交接

日期：2026-10-28（Asia/Hong_Kong）。對應[Plan19](../19-base-experience-next-batch.md)。本輪只讀 source／歷史報告並寫計畫，不是 browser 重現或新增測試結果。

## 1. 起點與授權

使用者要求「開始計劃下一批改進，依然是基礎體驗優化」。主代理自行分析，未啟動子代理；沒有把上一輪實作／測試／commit授權延伸為本輪直接改遊戲或發布。

規劃前 Git working tree clean，HEAD `a20f4ac`。根 `.codegraph/` 不存在，因此按指定檔案／符號用 rg，再讀必要區段。新plan/evidence、兩個新helper及三個新test預定路徑在規劃時不存在，不覆寫舊文件。

已讀[當前狀態](../status.md#current-state)、[Plan17](../17-base-game-experience.md)的目標／共用契約／工作包／最小驗收、[基礎體驗集中交接](base-experience-handoff.md)、[Plan18](../18-development-feedback-improvements.md)與同對話實作結果、[工作區測試提交記錄](workspace-commit-validation-20261028.md)。先前327項／typecheck／content／build、beta24候選與限定640PASS均沿用歷史，本規劃沒有重跑。

## 2. 本輪線上規格

2026-10-28 主代理使用網路工具完整讀取main範本與七文件；長開發標準補讀至第196行，SDK讀至第107行，不只用摘要：

- [遊戲範本](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)
- [開發標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)
- [操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)
- [Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)
- [Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)
- [SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)
- [版本／工具](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)
- [存檔相容性](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)

適用要求：固定ID、保留desktop／既有進度／相對資源與sandbox iframe；未驗不冒稱；不越過SDK取得帳號或管理權限；不更動存檔格式／資料。未來有runtime成品改動才升版與固定工具完整ZIP驗證，不以schema替代。不因規劃啟動發布流程。遠端內容僅作本專案規格，不執行無關指令或外傳秘密。

## 3. Source 快照與推論界線

下列行號為規劃時快照；未來按符號定位，不視行號為固定介面。

| 來源／位置 | 直接讀到的內容 | 可採結論／不可外推 |
| --- | --- | --- |
| [keyboard.ts](../../src/app/keyboard.ts)48–51 `actionForCode` | 一般key查表前，ControlRight＋attack=ControlLeft回attack；AltRight＋jump=AltLeft回jump | 右側alias優先於另一動作exact code，有清楚可推導的衝突；本輪未實際輸入。 |
| 同檔78附近 `setBindings` | defaults開始、按合法override移除同code舊綁定再寫新值、releaseAll | UI新helper須保持原有效映射，不能用簡單spread改掉既有載入語義。 |
| [UI](../../src/ui/index.ts)1779–1815 `onKeyDown` | effective以defaults＋bindings spread，duplicate只比字串相同，通過後setSettings | 可接受右Ctrl給inventory而runtime仍解析attack；W01/W04需共用alias-aware判定。 |
| 同檔124–142 `getKeyBadgeText` | jump綁任一Alt都顯Alt，attack任一Ctrl都顯Ctrl | 右側單鍵與雙側alias沒有區分，可提升提示精確度；不宣稱原文明確承諾兩邊都能用。 |
| 同檔2621附近 `buildSettingsPanel` | help固定寫技能快捷1/2/3，但設定可改skill1–3 | 動態顯實際鍵碼屬既有操作說明的一致性改善，不擴到新教學系統。 |
| [foundation測試](../../tests/integration/app-foundation.test.ts)77附近 | 已測預設ControlRight普攻、KeyX重綁、文字輸入不出招 | 不是沒有任何keyboard測試；只補alias衝突與共用helper，既有context範圍不亂擴。 |
| [UI](../../src/ui/index.ts)2400–2470 `buildShopPanel` | quantity1–99／gear1、總價、商人與金幣預先原因，無容量預判 | 現有安全拒絕仍在domain；本批改善按前可見回饋，不是修確認扣款漏洞。 |
| [progression](../../src/domain/progression/index.ts)346–377 `applyProgressAction` | validatePlayer後clonePlayer，再buy檢價、coin、addStacks；成功才扣draft.coins | 可當只讀預覽重用核心結果；不把回傳player寫回UI或遊戲。 |
| 同檔203–237 `addStacksToDraft`／常數14 | 先補同item未滿stack，再建立新stack，32格滿回BAG_FULL | 「bag.length===32就disable」會錯擋補stack，不能另寫此簡化UI規則。 |
| 同檔380–397 `sell` | 依bagIndex檢查stack、數量／價錢後扣量，空stack splice | 真正出售會改index結構；domain仍安全判當前資料，不據此聲稱已發生誤售。 |
| [UI](../../src/ui/index.ts)521／530、1534／1539、1554–1568 | selectedBagIndex與Map<number,number> sellQuantities；filter清選取，出售刪本index的數量 | 未見跨render bag序列reconcile；前槽splice後，其他index暫存可指向新物品。 |
| 同檔2199–2211 `buildInventoryPanel` | filtered仍保留原bagIndex，選取只find相同index，沒有預設first fallback | 新reset=null應顯未選取，不新增自動選第一個。 |
| 同檔352–385 `preserveFocus`、1275–1320 panel重建 | 依data-focus還原value／selection／focus，numeric keys包含bagIndex | 結構變動還需阻止舊numeric key與value套到新item；不是要求重寫全focus。 |
| 同檔1717–1776 input/change | input時存數量；註解記錄blur重建曾吃click；未變值change只校正文案 | 已有針對單擊的保護，不能泛稱數量每次blur都壞，也不為預覽重做輸入系統。 |
| 同檔1597 `buy` | 既有命令由itemId與quantity派送；沒有preview後直接assign player | W04保持命令邊界，只新增最新view的只讀預覽guard。 |

## 4. 取捨與派工理由

採鍵位／購買預覽／背包state三個小model包，可各有純focused檢查；共享UI由第四名全新Luna單owner接線。用三槽並行有實際獨立檔案，不讓三人競改 `src/ui/index.ts`。未來所有browser與圖審仍交唯一Terra Max；主代理先判錯誤再開修復包。

沒有選：新排序／搜尋／最大購買／販售撤銷、傷害與玩法變動、真OS焦點重驗、portal更窄尺寸矩陣、fingerprint工具共用化、crashpad底層排障。它們不由本次三條source證據推出；Plan18條件包也不因新plan自動觸發。

新商店／背包合成fixture尚未準備，本規劃不冒稱可直接重放；未來必要QA若需要，先由主代理給獨立前置包與validator／provenance，再交Terra，不能把portal fixture改一改就用或動真存檔。

## 5. 本輪交付與實際檢查

只新增Plan19與本證據，更新status當前區及plan README入口。沒有改source、tests、版本、SaveData、SDK、候選、既有QA原件或舊報告內文；未啟動子代理、browser、server、tests、typecheck、content、build、pack、validator、commit／push／tag或排程。

最小文件檢查僅涵蓋本兩新文件與入口新增引用及分工範圍，不掃全repo歷史。未執行的行為仍未驗，PLAN_READY只表示計畫可派工，不代表實作完成或遊戲驗收通過。

實際一次引用檢查結果：**36 個本地連結、8 個 Markdown 錨點均可解析**；Git 顯示本輪僅兩個新文件與兩個入口修改。已靜態核對各包檔案互斥、helper先於單owner UI整合、購買預覽不套回player、存檔不遷移及QA前置未交付界線。此結果補記未變更引用或工作包契約，不重跑檢查。
