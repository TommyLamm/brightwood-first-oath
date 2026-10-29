# Plan21 規劃證據與前批收束

2026-10-28（Asia/Hong_Kong）。**PLAN_READY／尚未實作**。使用者要求完成當前Plan後再開下一個；主代理先確認 [Plan20交接](plan20-handoff.md)與[候選報告](plan20-candidate.md)已完成來源及ZIP交付，再建立 [Plan21](../21-material-sale-feedback.md)。前批條件式browser未啟動，維持未驗，不把它改成通過。本次使用者指令取代前批交接的「不自動開Plan21」，舊報告作為歷史保留。

## 本輪來源與適用規範

主代理本輪完整網讀 [Playroom範本](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)及其列出的七份main文件：game-development.md、command-contracts.md、game.schema.json、game-release.yml、playroom-sdk.js、sdk-versioning.md、save-compatibility.md；game-development與SDK尾段補讀，沒有讀取失敗。不下載規格副本，不執行遠端內容中的無關命令。

本輪僅規劃；實作時保留固定ID、作者TommyLamm、desktop iframe／相對資源、讀1–5寫5的存檔相容與原SDK／工具版本，新候選必須新版本／新路徑，發布仍須另有明確指令。規劃驗收只看證據、工作包界線及本輪文件連結，不執行遊戲檢查。

根目錄無.codegraph，使用目標式rg與相關函式讀檔。Git status確認Plan19／20增量仍未提交、沒有還原他人修改；來源manifest仍為beta27／TommyLamm。本輪沒有改遊戲程式、版本、玩家資料、舊候選、QA profiles或任何既有測試。

## 靜態證據與推論界線

行號為本輪規劃時位置，開工仍按符號重新定位。

| 原始來源 | 直接觀察 | 規劃含意 |
| --- | --- | --- |
| [UI](../../src/ui/index.ts) `sell-materials`，1687–1698附近 | 原bag由高index往低index；只選material且sellPrice正數，刪該index草稿後dispatch整組sell，不等各筆回傳。 | 不能擅改成低index先、只送預覽成功組、遇錯中止或拆stack。 |
| 同檔 `buildShopPanel`，2686–2693附近 | 批次鈕把素材標價總和放在「出售全部素材（+…金幣）」上，disabled只看atMerchant。 | 接近金幣上限時，這個標價不能代表逐筆後實際可取得的收入。這是靜態推論，沒有browser重現。 |
| [gameplay](../../src/app/gameplay.ts) 命令迴圈225–230附近 | 依命令順序processCommand並接續gameplay，不因sell回toast而break。 | 逐筆成功後狀態延續、失敗後仍處理下一筆；預覽須模擬這項既有語義。 |
| 同檔 `sell`，521–530附近 | app要求merchant互動及nearNpc；domain成功才withPlayer，失敗回toast。 | UI merchant旗標不是距離與排隊時狀態的保證；原app仍為權威。 |
| [progression](../../src/domain/progression/index.ts) `sell`，379–398附近；COIN_CAP第15行 | 先驗index／quantity／可售性，再算nextCoins，超9,999,999或非安全整數拒絕；成功才扣物品、splice及加coins。 | 失敗的高index stack仍在袋中；下一筆較低index依然可處理。不能用總價一條公式取代累計domain結果。 |
| [單筆預覽](../../src/ui/sale-preview.ts) `previewSale` | 有merchant前置及domain結果，但刻意不回傳player。 | 批次需自己的局部模擬鏈，不能拿單筆預覽假裝取得下一個player，也不改既有單筆API。 |
| [樣式](../../src/ui/styles.css) `.ms-disabled-reason`、`.ms-sell-row`；[journal覆色](../../src/ui/journal.css) | 已有可見原因與換行相關樣式。 | 優先沿用；是否好讀仍需真正局部UI驗收，不能以CSS存在聲稱通過。 |

核心反例：高index整組收入大於剩餘金幣空間而被拒絕，較低index小組仍可成功；另一種情況是每組單獨看都可售，但第一組成功後另一組超限。這兩者要求按原順序接續成功狀態、失敗後繼續，不能只把總價超限判為整批不可售。

這裡沒有發現或宣稱物品遺失、金幣漏洞；現有domain在扣物品前安全拒絕。本Plan改善的是預操作回饋。預覽只對當前snapshot成立，不能保證先前queue、距離、死亡或其他app狀態不影響實際執行，也不提供保存證明。

## 取捨與可派工性

只選一項批次素材回饋，延後藥水替代／冷卻、技能、任務、資料與全域focus重構。Plan20曾排除此工作，本次明確列入下一個獨立批次，仍不改其交易政策或引入原子性。

規劃時新model與test路徑均不存在。W01只寫新helper／test／本包報告；W02等API完成才獨占UI與必要局部styles；W03待審閱後再升新版本／產新候選。模型、UI、候選依序交全新Luna Max，不讓多名代理同改UI。browser僅在具體新環境或明確有界對照授權下，交唯一Terra Max；已知0x6D不例行重試。

W01最多六組有行為意義的focused，包含累計超限與失敗後繼續；W02一次typecheck；W03一次build／pack／完整ZIP validate。未變的前批檢查不重跑。這些是後續實作驗收要求，尚未執行。

## 本次實際檢查

主代理已核對既有命令順序、domain拒絕前不扣物品、候選收集規則、新路徑無碰撞及工作包所有權。全新 `gpt-6-luna`／`max`／`fork none` 代理 `/root/plan21_batch_sale_audit` 已完成本範圍唯讀交叉核對，確認§2–3與原行為一致，未改檔或執行檢查。它另核對 [queue](../../src/app/command-queue.ts) 第8–17行push／drain及 [app](../../src/app/app.ts) UI入列、update保序傳給gameplay的路徑，支持FIFO前提。

Luna指出互動旗標即使來自同一view，也不含runtime距離判定；主代理已在Plan§3明寫僅依player／rules／互動旗標推導，不能當成近距離交易保證。這是唯一措辭修整，沒有改交易政策或新增工作包。

未執行tests、tsc、content、build／pack、ZIP validator、browser或截圖。未升版、commit／push／tag、Release、平台發布或建立排程。Plan21規劃完成後，先依明確工作包完成實作與交接，再規劃下一批。

本輪一次文件檢查：四份新／修改文件（Plan21、此證據、README與status當前區）共42個本地連結、6個Markdown錨點可解析，failures為空。未掃全repo歷史；此補記不新增引用，不重跑檢查。
