# 遠古遺跡包 D：存檔名稱空間、實際驗收與候選封包計畫

2026-10-26 20:20排程續作：[額外遺跡視覺驗收最新交接](reports/ruins-visual-handoff-20261026.md)。已補成真正勝利→正常再次挑戰：入口沒有舊矩形／青綠圈可見殘留，首領滿綠血條重生，戰後HP／MP及q18進度保留；[專項證據](reports/ruins-retry-2020-20261026.md)。先前三張地圖限定短段、兩種預警與可見半血轉場沿用。beta.18 source／ZIP未改，未重build/tests/pack或發布；正常角色q08claimed 1492B檢查點保留。精確瞬時／音訊／正式平台／雲端仍未驗，Plan15維持LOCAL_BROWSER_PARTIAL。下方為歷史。

最新進度：[自主優化集中交接](reports/overnight-optimization-handoff-20261026.md)（08:18收尾）。最新候選beta.18傳點標示／必要視檢及ZIP完成，對話／匯入改善亦保留。beta.15 q19正常手動回報、R2獨立fixture西返／重進、viewport／Esc及preview請求已補完；[主線報告](reports/ruins-d-browser-retry.md)保留分段／synthetic checkpoint界線。正常新玩家分版本完成q01–q04，q05 partial6/8有完整raw可續；08:13用量90%後停止新scope、完成child cleanup。首領時長樣本未得勝利，不稱45–80秒或完整聲畫驗收通過；D仍LOCAL_BROWSER_PARTIAL，正式平台／雲端未驗，未發布。下方06:18及最初紀錄是歷史快照。

2026-10-26 06:18續作更新：**beta.15 SOURCE_READY／ZIP_VALIDATED；LOCAL_BROWSER_PARTIAL**。瀏覽器已恢復可用，最初啟動失敗不再代表目前所有案例未驗。[namespace實測](reports/ruins-d-browser-namespace-retry.md)完成四格式匯入與資料保全等分支；[枝線實測](reports/ruins-d-browser-branches-retry.md)完成滿包領獎／旅冠、重試與死亡返回及替代配點短分支。代表主線已分段完成q15–q18，保存q19active raw供手動回報與R2收尾；含合法synthetic checkpoint，不稱不中斷全程。首領精確時長、phase瞬時清理與可聽音訊仍未驗。後續必要改善另立[beta.16對話焦點](reports/overnight-dialogue-focus-20261026.md)與[beta.17匯入回饋](reports/overnight-import-feedback-20261026.md)，[beta.17 ZIP已驗證](reports/overnight-beta17-package-20261026.md)，不覆寫beta.15原產物／驗收範圍；正式平台／雲端／發布仍未執行。以下原始規劃及初次失敗快照保留。

日期：2026-10-25（香港時間）。執行更新：**SOURCE_READY／ZIP_VALIDATED；LOCAL_BROWSER_UNVERIFIED**。beta.15 namespace修正、27個聚焦案例、typecheck／資源引用／獨立build及完整ZIP驗證已完成；瀏覽器工具啟動失敗，實際路線／聲畫／本機存檔仍未驗，正式平台／雲端與發布未執行。成果及續作見 [D交接](reports/ruins-d-handoff.md)。以下是開工前的原始規劃；其中「目前beta.14」「尚未實作」「PLANNED」及本輪未執行敘述均為規劃當時快照，不是最新交付狀態。

接續 [章節設計第9節D](12-next-chapter-ancient-ruins.md)、[plan14](14-ruins-bell-sanctum.md) 與 [C交接](reports/ruins-c-handoff.md)。目前候選 `1.0.0-beta.14`，ID `brightwood-first-oath`，讀1／2／3／4、寫4，成品 `artifacts/ruins-c/dist/`；17個不同聚焦測試檔127項、typecheck／content／218引用與build的歷史結果保留，不因本計畫轉為瀏覽器、正式雲端或ZIP通過。

## 1. 範圍與停止點

D先完成兩個已確認的交付前缺口，再做有範圍的真實瀏覽器驗收及正式工具ZIP驗證。保留q01–q20、四張遺跡地圖、首領數值／時序、22姿勢、旅冠與成長上限；不新增下一章、第五節點、排行榜、手機支援或新的存檔格式。

預計另立 **`1.0.0-beta.15`** 修正生產入口的本機名稱空間，開工先核版本／tag／Release占用；本輪仍保持beta.14。schema2、SDK1.1.0、protocol1、讀1–4寫4不變。版本增加不代表需要格式5。

一般「執行plan15」的本機停止點是：安全Node下的修正候選、聚焦測試、實際iframe代表路線、可追溯ZIP與完整validate結果、交接。正式平台URL／測試帳號未提供時，繼續完成本機工作，將平台項目明列未驗。**Git提交／push、發布tag／GitHub Release、平台匯入／人工確認／上架不由本計畫自動執行**；已有明確授權時按其範圍續作，沒有時交付可審閱成品，不把「開始規劃／執行本機驗收」當成發布授權。

## 2. 本輪實際發現

| 項目 | 已讀到的現況 | D處理 |
| --- | --- | --- |
| Node | `node --version` 為 **v24.19.0**；新main規格要求24.22.1+；package目前只要求`>=24 <25` | 先定位／切換合規Node24，必要時收緊engines並同步root lock metadata，不更新套件版本；以實際執行檔及版本作證據 |
| 遊戲身分與本機key | `public/game.json`為`brightwood-first-oath`；`src/main.ts`與`src/app/app.ts`預設仍是`maplewood-swordsman` | 修正生產入口／預設ID並提供保全舊進度的明確匯入流程；雲端遊戲ID維持不變 |
| 存檔key規則 | `localSaveKeyForGame`產生`${gameId}:save:v1`，development另加`:dev` | 分清build與dev；此處`:v1`是既有key名稱，封套formatVersion仍可為4，不趁機更改key尾碼 |
| 打包入口 | `tools/playroom/pack.mjs`已接受來源及輸出參數；validate接受ZIP參數；README只示範預設`dist/` | 沿用現有CLI，明確指定D成品及ZIP，不另寫打包器、不複製C到根dist充數 |
| 固定工具 | lock為game tools1.2.0，ZIP與extracted metadata均存在；lock SHA為`24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022` | 本輪只讀lock及存在性，未驗hash；執行D時由現有runner驗整包／metadata逐檔SHA，再pack/validate，不無故重生工具 |
| 發布workflow | 已有Node24 check-latest、npm ci/build、固定工具驗證、不可覆寫Release及prerelease流程 | 核對最新範本的等效要求，保留自訂release notes／dispatch，不整份覆蓋；尚未驗證遠端實際工作流 |
| 成品與來源 | A／B／C artifacts保留；C來源與原稿仍有未提交工作區變更，另有原有`.claude/`、`.worktrees/` | 先記來源指紋／manifest／檔案hash，不清理或混入舊工作樹；發布前來源提交另依授權處理 |

因此不能直接把C候選改名ZIP便宣稱D完成；也不需要為已有參數的pack入口安排改造。

## 3. 本機名稱空間修正與舊進度保全

正式入口及app預設統一為`brightwood-first-oath`；persistence仍可接受明確傳入的其他ID作隔離測試，不把所有舊測試fixture字串機械替換。補一個使用**生產設定與正式manifest ID**的邊界驗證，避免只測任意fixture ID而漏掉入口接線。

| key用途 | build | development |
| --- | --- | --- |
| 新canonical | `brightwood-first-oath:save:v1` | `brightwood-first-oath:save:v1:dev` |
| 同專案舊版來源 | `maplewood-swordsman:save:v1` | `maplewood-swordsman:save:v1:dev` |

凍結行為：

1. canonical存在時以它為準；即使無效也不暗中改讀舊key或覆寫。兩份有效而不同的資料不自動合併。
2. canonical不存在而同模式舊key存在時，先驗證封套format1–4及完整當前catalog。對本機模式顯示可理解的「找到這台裝置的舊版進度」選項，**玩家明確選擇匯入後**才複製；取消則保留原件，不上傳、不默認覆寫。
3. 匯入複製原始字串至canonical、回讀相同後才接續；原key及其既有`:formatN-backup`全部保留。偵測到目標已出現／變更或讀寫失敗就停止，不宣稱localStorage有跨分頁交易保障。
4. 匯入後首次新寫入仍走既有format4流程：format1／2／3原封套各有同canonical key的`:formatN-backup`，備份失敗／不同既存備份不得覆寫。原key的歷史備份不搬走，也不刪除。
5. 未知格式、未知ID、不合法counter及不合法claimed紀錄不可當空檔或搬回城假稱相容；提示可理解的狀態，允許不覆寫資料地離開／繼續可用流程。
6. dev與build來源不交叉讀取；已登入且雲端可用時仍以帳號雲端初始化，不把本機舊key自動匯入帳號。確認到執行之間若登入模式／帳號改變就取消匯入；登出、session失效或帳號切換後取消待提交快照的既有契約保持。

實作owner整體接線main／app／persistence／必要UI，先定最小介面後釋出共享types／ports；不拆成兩人同寫app.ts。UI使用進度／匯入等玩家語言，不展示key、format、revision等實作細節。這一節是**待實作方案**，本輪沒有讀寫任何玩家localStorage。

匯入是一次性快照，後續不對舊key雙寫或雙向同步。較舊分頁仍可能只保存自己的舊key進度，不承諾兩者自動整合；canonical存在後的新版本繼續使用canonical，原件留作可辨識的保全資料。

## 4. 執行次序與輸出

| 階段 | 工作與依賴 | 明確交付 |
| --- | --- | --- |
| D0 | 重讀最新規格、記工作區基線；找到Node24.22.1+；核固定工具；完成§3最小修正與聚焦測試 | runtime／source摘要、namespace修正報告與測試結果 |
| D1 | 統一beta.15 metadata；在合規Node下建立獨立D成品；用該成品做§5／§6瀏覽器驗收 | D dist、路線／戰鬥／存檔證據及缺陷清單 |
| D2 | 僅修與新流程或驗收失敗直接相關的缺陷；穩定後凍結成品指紋，pack／完整validate | D ZIP、SHA、驗證摘要、交接與發布準備報告 |
| D3 | 有明確平台測試範圍後，驗真實平台預覽／SDK／顯示模式；需上傳／匯入或Release時先核授權 | 每個環境獨立的通過／未驗證記錄 |
| D4 | 明確發布授權及管理者人工確認後，才可公開版本並驗正式雲端／公開遊玩 | GitHub Release、平台版本／人工確認與正式保存證據分別記錄 |

D0–D2可獨立交付，D3／D4外部條件缺少不阻擋本機結果。不要因等帳號而改用mock填綠，也不要因本機成功自動上架。

新輸出統一放`artifacts/ruins-d/`：`dist/`、`fixtures/`、`browser/`、`logs/`、`game-beta15.zip`、`asset-reference-check.json`、`build-summary.json`、`zip-validation-summary.json`及`acceptance-summary.md`。檔名跟隨實際未占用候選版本；不覆蓋A／B／C或已有D交付。artifacts仍依ignore留在本機，repo內另有`plan/reports/ruins-d-*.md`交接。

## 5. 有範圍的真實瀏覽器驗收

### 環境與證據

測試**完成建置的D成品**，不只Vite dev、file://或單獨開index。使用兩個不同origin的本機父頁／遊戲靜態服務，以版本子目錄及preview形狀的子目錄載入，保留`sandbox="allow-scripts allow-same-origin allow-pointer-lock"`與`allow="fullscreen; autoplay; gamepad"`。本機preview形狀路徑只證明相對資源，不能證明平台短效授權／SDK保存。

依執行時可用的browser/computer-use工具及其skill操作；建立專用測試context／origin，記錄服務與port的ownership。只停自己建立的服務，不動共用5173。fixture先經當前catalog驗證，再放進自己隔離origin；不讀寫平常遊玩origin的key，不加入永久debug入口／作弊選單。正式build key與dev key分開驗。

主要viewport為1280×720，再在同一遊戲進度調整為960×640，檢查操作區及Esc面板／暫停；manifest仍只宣告desktop。實際平台的原生全螢幕、沉浸模式、右上退出與不重載進度另在D3測，本機harness不能冒充這些平台行為。

完整截圖／錄影及日誌落`artifacts/ruins-d/browser/`，主對話只回文字及路徑。必要AI審圖每次1–2張、長邊≤1280、JPEG q60–75、中性底。至少保留一張勝利／回報結果與一張雙攻擊對照的必要證據；不反覆截全地圖。

### 一次代表主線與少量分支

| Case | 起點與操作 | 驗收 |
| --- | --- | --- |
| R1 遺跡主線 | 合法Lv30 fixture、q14 claimed、琥珀砂岸向琉砂接q15 → 營站向芷衡手動交 → q16接後擊退3苔陶蟲並手動交 → 長廊q17雙碑與2木偶 → 手動交 → q18 → 司鐘者 → 結果返營站 → 芷衡手動交／接q19 → 回教官手動交 | 真正走過A–C四圖；ready不當claimed開門；q20缺省仍能走完；q18／q19無重獎，Guardian flags不被C改寫 |
| R2 距離與進退 | 沿R1檢查碑距離／梯路、長廊東門；首領戰前西返一次，之後重進 | 石道／長廊可達、碑不在錯誤高度調律；內殿安全帶／西門自由，戰中回城按鈕停用 |
| R3 結果與重試 | R1勝利後重試一次，再以獨立分支確認玩家死亡及免費返回 | 新首領滿血phase1、沒有舊預警／攻擊／階段音；q18有效擊殺不倒退，結果返回營站；不為這個case重跑整條主線 |
| R4 輔助分支 | 在同一fixture分支觀察q17／q20多任務卡與q18滿包領獎，再整理後重試 | 任務可獨立顯示，滿包不先扣／加金幣或改claimed；旅冠只領一次，卸下／出售不影響q19 |

q01–q14從已驗證的合法前置fixture開始，不把這段稱為從零通關。q20完整三怪／三鈴片不另拉長主線驗收；只有發現其UI／交付問題或直接修改時，才加一次對應分支。

## 6. 首領聲畫與本機存檔重點

首領沿原凍結數值：兩招第三格才active、完整預警／recovery、鎖向原點；低掃地面命中、跳起可躲。半血不截斷招式，1200ms轉場可受傷、無攻擊／假預警，結束才phase2音樂；phase2三招邊界允許連續兩掃。勝利只有復原短音，靜音仍可辨招及完成，結果重開／領獎不補播。

只聆聽新boss兩層的循環／切換及復原短音；不重生舊音樂。旅冠在idle／walk／attack／jump與左右面向檢查head overlay，必要時才擴到其餘姿勢。一次範圍內檢查四圖的地面、視差與resize，既有beta.11背景抖動未驗不能因此統稱全部通過。

沿代表路線量一次熟悉後戰鬥，使用合法Lv30、日井誓刃與已記錄配點／技能，不改boss HP、傷害、時鐘或補暗屬性；記開始／結束定義與操作策略。另用冰潮長鋒及一組合法未最佳化配點做短分支，證明不是誓刃裝備門檻。45–80秒及首次觀察60–120秒是既有目標，分別記實測，不能用高輸出fixture一場推稱所有玩家；偏離先分析，不加長無敵或擅改凍結數值。需要平衡重設時列具體提案另處理。

本機存檔聚焦新增namespace修正：在獨立origin驗格式1／2／3舊key的明確匯入、format4新檔重載，逐筆核原始字串與應有備份；另測取消、canonical已存在、無效舊檔及一次儲存失敗。已有counter／單碑／claimed與旅冠保持。不得為測試刪除玩家原件或改真實帳號；較完整格式／任務負例沿用C聚焦測試，只重跑被新程式直接影響的檔。

## 7. 固定工具與封包

先記Node執行檔及版本，必須是24.22.1以上的24.x；缺少合規環境時可繼續程式／計畫檢查，但停止宣稱符合標準的build／pack，不能把目前24.19.0標為通過。

沿用game tools1.2.0的lock＋ZIP＋metadata。既有runner會驗archive SHA與extracted逐檔hash；若失敗先分辨檔案缺失、解壓與版本，不重建同版本ZIP／改checksum繞過。確需升級才以新版本＋ZIP＋lock作可追蹤變更，按線上指引另行取得正式工具。

候選穩定時在合規Node下執行，實際版本不同則替換ZIP檔名：

```powershell
npm.cmd run build -- --outDir artifacts/ruins-d/dist
node tools/playroom/pack.mjs artifacts/ruins-d/dist artifacts/ruins-d/game-beta15.zip
node tools/playroom/validate.mjs artifacts/ruins-d/game-beta15.zip
```

build先供§5驗收；同一成品指紋通過後直接pack，不為封包再build一次。有相關修正才重建並重驗受影響路徑。ZIP根直接是game.json、index.html、cover與全部自有資源，不多包dist／repo；工具、原稿、fixture、日誌、node_modules、帳密／token／私鑰／.env不進成品。完整ZIP驗證之外另核不含機密，不能以schema驗證或手動zip代替。

保留manifest版本、dist／ZIP SHA、工具版本／SHA、檔案數、壓縮／解壓大小、封面大小及成功退出碼。當前C新資產11檔7,559,589 bytes，全章21,867,870 bytes；D沒有另加素材時沿用此預算，完整遊戲ZIP仍按固定工具的512 MiB／2 GiB／50,000 entries與封面5 MiB限制驗，不把章節素材數當ZIP總量。

本機可用版本化ZIP檔名保存歷史，正式GitHub Release的唯一附件仍須叫`game.zip`。若直接複製已驗證ZIP，核對前後SHA相同；若Release workflow從已授權提交重新build／pack，核其來源commit、工具與下載附件SHA，不能未比對就沿用另一成品的驗收。不同bytes須先釐清差異並補必要檢查，不覆寫已發布附件。

## 8. 正式平台與格式4的外部驗收

本輪未連平台核實目前公開版本、上架狀態、角色或帳號存檔，不假設B曾公開。執行D3前取得具體平台URL、測試範圍及可用測試登入context；用既有登入／正式介面，不從遊戲讀密碼、Cookie、CSRF或管理API。沒有排行榜宣告，就不新增startRun／finishRun或排行榜驗收來湊接入。

| 環境 | 可以證明 | 不能代替 |
| --- | --- | --- |
| 本機iframe／fixture | 資源路徑、玩法、本機key及隔離、resize | 平台guest／preview連線或正式雲端 |
| 平台診斷preview | SDK／protocol／game版本、capabilities、暫存進度與預覽事件；保存回null | 正式saved:true、跨瀏覽器帳號保存 |
| 已授權隔離測試平台的authenticated模式 | 該測試平台真實SDK／HTTP保存、revision與衝突 | 生產平台相同帳號資料已驗證 |
| 已公開相容版本的正式平台 | 其環境中的saved:true、跨登入context恢復與實際顯示模式 | 其他平台／未驗帳號或舊版本皆相容 |

格式4不能在未公開候選iframe內偽裝正式保存。候選讀1–4若通過平台相容檢查、經人工確認成為目前公開版本，之後才驗真實寫4；**不預設要先發布橋接版**。舊目前版本不能讀4時的拒寫是保護，不能只改readableFormats或自動部署虛假橋接來消除錯誤。

正式保存使用專用測試帳號／進度；不得拿玩家現有正式進度覆寫成fixture。兩個獨立登入瀏覽器恢復同一進度、不同帳號隔離、並發revision衝突、載入失敗、相同快照／requestId回應遺失重試、登出／session失效及重新登入各留明確證據。格式拒絕須停止寫入，不以空檔／最新revision覆蓋；只有saved:true顯示正式保存。使用受控網路／測試環境觸發錯誤，不加入永久作弊API。

若有已公開、只讀舊格式的歷史版本，再驗新格式後舊分頁讀／寫受拒與回退相容檢查；不存在就列未驗，不為測試擅自公開B。本人快照恢復屬平台登入後的明確操作，不加進遊戲iframe；需要演練時另用有授權的受控資料，不拿復原測試改正式玩家進度。

GitHub Release、平台匯入、人工review、發布及正式保存分別記錄。發布階段沿最新預期版本／上架狀態契約；STATE_CONFLICT需刷新後重新人工確認，不自動填新值重送。角色撤銷／多管理者競爭等平台側要求需受控環境或管理者配合的證據，不在遊戲repo越權改角色／下架正式遊戲。沒有具體發布授權就不推tag、不建Release、不呼叫發布API。

## 9. 後續全新Luna Max分工

開始實作後才派工，全新GPT-6 Luna、max reasoning、最多三名，不fork圖片歷史、不沿用完成／額度中斷owner；不為湊三人同寫app或manifest。

1. 首批可並行「namespace／persistence／app最小匯入流程」與「安全Node／固定工具／隔離harness準備」。前者獨占相關共享型別與UI接線，先交介面；後者不改遊戲玩法及package版本。
2. 契約與修正完成後，全新整合owner統一engines／package-lock／版本／manifest及獨立build；已釋出共享檔的舊owner停止寫入。
3. 全新瀏覽器owner獨占測試context、port／fixture與證據目錄；問題回報原模組的新修正owner，只有變動路徑重驗。不讓兩個owner控制同一browser/context。
4. 穩定成品後，全新封包／交接owner核來源指紋、pack／validate與summary；與遊戲修正分開ownership，不同時封裝正在改的dist。正式平台驗收另依具體範圍及授權排批。

每批report `plan/reports/ruins-d-*.md`包含來源、改檔、實際指令／檢查結果、失敗／未驗、source／artifact指紋、下一步與釋出的共享檔。用量中斷先恢復自己batch的指定session原稿／metadata，不猜全域最新圖片、不重生可恢復成果。

## 10. 最小檢查與完成定義

namespace是資料變更，必須有聚焦coverage：生產ID一致、canonical優先／衝突、四個可讀格式的明確匯入、取消／無效／儲存失敗保全、dev/build隔離、帳號雲端不自動吃本機舊key。可新增`tests/ruins-d-local-namespace.test.ts`及必要app用例；只跑其直接影響的既有persistence／app檔，Vitest固定`--exclude '**/.worktrees/**'`。

新Node與修正source穩定後typecheck一次；content／production loader僅在相關定義／資產或新D成品引用需要核對時各一次。C未改的首領、任務、音訊encoder、22姿勢來源與127項通過紀錄不整批重跑。只有新修改或具體失敗才重做相應檢查；不為文案加測試，不跑完整回歸，不反覆截全部地圖。

完成狀態必須拆開記：`SOURCE_READY`、`LOCAL_BROWSER_VERIFIED`、`ZIP_VALIDATED`、`PLATFORM_PREVIEW_VERIFIED`、`FORMAL_CLOUD_VERIFIED`、`GITHUB_RELEASED`、`PLATFORM_PUBLISHED`。沒有外部授權／環境時可交付前三項及後續待辦，不籠統寫「全部驗收通過」或「已發布」。本計畫現在僅為PLANNED。

## 11. 本輪來源與規劃檢查

2026-10-25約20:29–20:34（香港時間）透過網路重新完整讀取main：[模板](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)、[開發標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)、[操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)、[Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)、[Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)、[SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)、[版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)、[存檔相容性](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)。完整開發標準的工具輸出曾截尾，已補讀末段；沒有使用摘要冒充全文。遠端內容僅作本專案規格資料。

本地讀取來源：C及各owner交接、章節D定義、AGENTS、main／app／persistence key factory、q14–q20資料、manifest／C build摘要、Vite／package／固定工具lock、pack／validate／runner及Release workflow。`.codegraph/`不存在，依指示用rg與定點讀取。

本輪實際檢查僅文件／來源接線、`node --version`、固定工具檔案存在性及計畫連結／diff檢查；**未驗工具SHA，未執行遊戲測試、typecheck、content、build、browser、pack或validate**。沒有更改版本、玩家資料或發布狀態。
