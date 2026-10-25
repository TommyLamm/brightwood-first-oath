# 遠古遺跡包 B：回聲探索實作計畫

日期：2026-10-25（香港時間）。狀態：**B程式與素材／獨立候選已完成，未做實際遊玩／正式存檔／ZIP／發布驗收**。主代理依使用者指示指揮全新GPT-6 Luna Max，最多三名並行；候選 `1.0.0-beta.13` 位於 `artifacts/ruins-b/dist/`，完成B即停。本文件保留設計決策與規劃當時基線；實際結果以 [B 整合交接](reports/ruins-b-handoff.md) 及 [派工紀錄](reports/ruins-b-dispatch.md) 為準，C／D未完成。

本文件承接 [12 完整章節設計](12-next-chapter-ancient-ruins.md) 與 [A 整合交接](reports/ruins-a-handoff.md)，把下一批 B 拆成可派工範圍。以實際程式優先於 12 中 A 開工前的基線描述。開工時先核對最新工作區，不重做 A，也不把 A 尚未做的瀏覽器／正式雲端／ZIP 驗收寫成通過。

## 1. 本批交付與停止點

新增回聲長廊、行舟、兩塊固定石碑、斷弦木偶與巡鈴石獸，完成 q17 主線與 q20 選做支線。主線在 q17 手動領獎後停下；q20 可獨立完成，不是主線門檻。C 的內殿、司鐘者、q18／q19、旅冠及 boss 音樂不納入。

| 項目 | 本批決定 |
| --- | --- |
| 入口 | 盤根石道東側 → 回聲長廊，需 q16 **claimed**，ready 不開門 |
| 返回 | 長廊西門 → 石道，無任務鎖；原營站／鎮內直航保持可用 |
| 新互動 | Space 開碑文，再按「調律石碑」確認；非限時、無資源消耗 |
| 新成長 | 維持 Lv30／原技能／一轉；不新增狀態異常、裝備或 AP 補償 |
| 世界圖 | ruins 分區加第三個真節點 `(67,39)`，探索總數為 3；沿用 A 區域底圖 |
| 收尾 | 行舟確認兩段回聲；文案可引向內殿，**不建立指向尚不存在內殿的 portal／可玩節點** |
| 候選 | 實作時另立高於 A 的候選；目前預計 `1.0.0-beta.13`，開工時核對未被占用 |
| 輸出 | 穩定後一次 build 至 `artifacts/ruins-b/dist/`；保留 A 的 beta.12 產物 |

玩家路線：q16 領獎 → 進長廊 → 向行舟接 q17（可同接 q20）→ 任意順序調律兩碑／擊退木偶 → 回行舟手動領 q17 → 本批主線結束。巡鈴石獸與鈴片是選做探索收益。

## 2. 開工前已知基線與缺口

- A 已交付兩張遺跡地圖、q15／q16、苔陶蟲、兩位 NPC 與 `theme-ruins` base／combat；本批沿用已完成的區域底圖與探索音樂，不重生。
- `QuestObjectiveType` 目前為 reach／kill／collect／equip；`QuestEvent` 只有 reached／killed。新 inspect 必須從契約接到 domain、命令處理、UI、存檔與內容驗證。
- `world/validate.ts` 用任務編號推導「上一件」前置。q20 必須改為明確例外 `['q16']`，不能誤接 q19，也不能為通過驗證放鬆所有舊任務前置。
- `ui/index.ts` 的對話面板已用 `filter` 列出多個相關任務卡。保留此設計；`gameplay.ts` 的 `npcDialogue` 摘要仍只 `find` 第一件，須兼容 q17／q20，不以摘要取代完整卡片。
- `persistence/validate.ts` 目前只承認 kill／reach counters，claimed 完整性也只檢查兩者；inspect 必須同時加入兩處，不能只讓 UI 顯示成功。
- `WorldSnapshot` 已有 `questViews`，石碑狀態可由 q17 objectives 推導，不需要新增存檔 flags 或把整份 SaveData 傳給 renderer。
- A renderer 已為苔陶蟲採用逐格出招時間。新怪物也需接上同一做法，否則總時長均分四格會讓攻擊姿勢與判傷錯拍。

以上是本輪閱讀實際檔案的結果，不代表 B 已經實作。`.codegraph/` 不存在，本次直接使用 rg 與定點閱讀。

## 3. 地圖、落腳面與安全互動

`ruins-echo-gallery`：寬 2600、高 720、地面 y600、theme `ruins-gallery`、music `theme-ruins`、safe=false、boss=false。普通怪沿既有 MapBlueprint 地面出生，不引入空中／平台出生或新移動 AI。

| 對象 | 初始配置 | 限制 |
| --- | --- | --- |
| 石道東門 | `(2300,600)` → 長廊 left | q16 claimed；石道原西返不變 |
| 長廊西門 | `(100,600)` → 石道 right | 無鎖，與行舟互動範圍分離 |
| 行舟 `ruins-pathfinder` | `(300,600)`，scout | 西側安全區；第一隻木偶最西攻擊端約 x560，不能侵入其 64px 互動圈 |
| 西回聲碑 `ruins-stele-west` | `(900,420)`，keeper | 建議平台 x820–1020、y420；梯 x900 直連地面 |
| 東回聲碑 `ruins-stele-east` | `(2000,360)`，keeper | 建議平台 x1900–2120、y360；梯 x2000 直連地面 |
| 木偶兩點 | 約 x780／1570 | roam 分別 x720–850／1510–1630 |
| 石獸兩點 | 約 x1170／2000 | roam 分別 x1100–1240／1940–2070 |

平台與梯子先定碰撞，再配背景；必要路線不用精準跳躍。補充平台可做上下迴路，但兩碑均須有完整梯路。最高地面攻擊頂端約 y500，低於兩碑平台，讀碑區不得受地面攻擊；梯子下半段仍可遇敵，面板不暫停戰鬥。

現有追擊受 roam 邊界限制，仍應在新怪物測試中核對。巡鈴石獸最東攻擊端不得超過 x2330；本批東側可留安全空間，不加入假傳送門。所有 portal／NPC 互動圈按既有 64px 半徑檢查，中心距離大於 128px；石碑垂直高度也必須阻止站地面隔空互動。

## 4. 調律的資料與命令契約

本批先凍結以下名稱，再派依賴工作：

| 層 | 擴充 |
| --- | --- |
| objective | `type: 'inspect'`，targetId 為兩個 stele NPC ID，count=1 |
| domain event | `{ type: 'inspected', targetId }` |
| CommandDraft | `{ type: 'inspect', payload: { targetId } }`；seq 仍由 AppCommandQueue 配發 |
| 持久化 | `quests.q17.counters['ruins-stele-west'/'ruins-stele-east']`，各 0–1 |
| 顯示狀態 | q17 counter=1 或合法 claimed → 該碑常亮；不存額外全域 flags |

確認命令須重新核對：角色活著、沒有切圖待辦、目前地圖為長廊、targetId 在兩碑白名單且有實際 placement、仍在 64px 距離、目前 interaction 正是該對象、q17 已接取且尚未 claimed。不能只信任 UI 的 disabled 狀態或傳來的 targetId。

`recordQuestEvent` 只更新 active 任務中匹配的 inspect objective，count clamp 到 1。重複確認回報「已調律」而不增計數、不給獎、不重播成功音；兩碑次序不限。讀碑、看到背景或經過座標均不計入。

接取 q17 前可以讀到中性的碑面介紹，但不保存隱藏進度，也不提前顯示成功調律才揭露的歷史。接取後需要重新確認兩碑。成功寫入 counter 後，才顯示該碑的歷史片段；兩片合讀為「守護的是歸途，不是封鎖所有來路」。不改寫 q01–q14 故事。

面板、任務日誌與 HUD 的 objective 動詞增加「調律」，`targetName` 由 NPC catalog 解析碑名，不能顯示裸 ID 或誤查物品 catalog。石碑按鈕要在對話面板的「沒有相關任務卡則 return」之前接上，因為石碑不是 q17 的 giver／turn-in NPC。

## 5. 任務與支線獨立性

| 任務 | 前置；發起／交付 | 目標 | 手動領獎 |
| --- | --- | --- | --- |
| q17 兩段回聲 | q16 claimed；行舟／行舟 | inspect 西碑1、東碑1；接取後殺木偶2 | 金幣800、大紅4、大藍2，EXP0 |
| q20 留給旅人的鈴聲 | q16 claimed；行舟／行舟 | 接取後殺石獸3；持有並交付失聲鈴片3 | 金幣600、大紅4，EXP0 |

q17 與 q20 的接取、進度、ready、claimed 與獎勵互不代替。可以不接 q20 就完成 q17，也可以先做完 q20。q20 不得進入主線 prerequisites、入口門鎖或本批收尾條件。

鈴片為普通 material，石獸始終必掉 1，不放入只接受 quest 物品的 `questDropByQuest`。collect 即時讀背包；出售後可讓 ready 退回 active，但已達 3 的 kill counter 不倒退。兩個生成點加一次既有 9000ms 重生即可完成三殺；測試用推進遊戲時鐘，不實際 sleep 等待。交付扣 3 片，沿用既有領獎原子性與一次性保護。

存檔驗證允許舊檔完全缺 q17／q20；active 的 inspect counter 只能為 0／1 整數，拒絕未知碑 ID、越界或非整數。q17 claimed 必須同時具備兩個 inspect=1 與木偶 kill=2；不能靠 getQuestView 對 claimed 顯示滿格來掩蓋缺紀錄。q20 claimed 驗 kill=3，但不要求仍持有已交掉的鈴片。

## 6. 兩種普通怪與出招節拍

不修改既有怪物；皆 Lv30、EXP0、respawn9000。以下沿 12 的首輪數值，仍未實測難度。

| 怪物 | HP／ATK／DEF／speed | 專屬技能與矩形 | 時序／起手間隔 | 固定收益 |
| --- | --- | --- | --- | --- |
| `ruins-string-puppet` 斷弦木偶 | 1280／54／23／56 | `ruins-puppet-slap`，前方160×100，倍率1.1 | 1000／100／900ms；間隔≥2200 | 金幣95、`broken-copper-thread` 斷裂銅弦1，售50 |
| `ruins-bell-prowler` 巡鈴石獸 | 1360／56／24／48 | `ruins-prowler-sweep`，前方260×30，倍率1 | 1100／100／900ms；間隔≥2400 | 金幣100、`muted-bell-fragment` 失聲鈴片1，售55 |

兩招皆為原地鎖向 attack；不是 dash 或移動彈體。完整矩形預警、一次 attack ID 只命中一次；死亡／切圖取消剩餘判定。低掃用跳躍或離開矩形躲避，不新增抗性、沉默、減速、無敵殼或背擊。

四格 attack 建議精確時間：木偶 `[500,500,100,900]`、石獸 `[550,550,100,900]`。前兩格承擔 windup、第三格對應 active、第四格 recovery。同步 MonsterDef 的 windup／cooldown、SkillDef、選招分支、renderer authored timing 與 animation contract；不只新增 catalog 資料，也不以改全體舊怪動畫方式接入。

## 7. 存檔決策：B 讀 1／2／3、寫 3

本決策供下次實作，不在本輪修改 manifest 或執行遷移。A 已存在格式 2 的候選與讀取器，而 B 會新增 A 不認識的 map／NPC／quest／item ID 及 inspect counters；因此不繼續用同一格式號宣稱 A 可以回退讀取。這是對 12 第 8 節早期「全章格式 2」建議的後續細化。

實作時 B 讀取器支援 1／2／3，驗證目前完整 B catalog 後套用；所有新寫入為 3。同步 `SAVE_FORMAT_VERSION`、CloudSaveInput、SaveEnvelope 與 schema 2 Manifest：`readableFormats:[1,2,3]`、`writeFormat:3`。SaveData 頂層、角色、背包、舊任務與兩個 Guardian flags 不變；不自動補調律進度、清掉未知 ID 或搬回城假裝相容。

目前 `isSupportedSaveFormat` 寫成「1 或當前寫入格式」，不能只把寫入常數改3而漏掉2；需明確支援三個可讀格式，並分開定義讀取範圍與唯一寫入格式。

本機沿原 namespace／開發隔離 key，首次把格式 1 或 2 轉寫 3 前保全原封套。沿 A 的先備份、回讀確認、再覆寫順序；格式 2 補相應 `:format2-backup`。備份失敗、已存在不同內容或不支援格式時，保留原件並停止寫入，不擅自清除備份。A 應拒絕格式 3，而不是把新資料誤判為可修復的壞檔覆寫。

此處只決定開發候選格式，**不是正式雲端部署完成**。正式寫 3 仍須目前上架版本實際可讀 3；橋接版必須真正理解新 IDs／inspect，不能只改 readableFormats。格式宣告不能替代資料驗證，讀取失敗不可當空存檔；詳見 [平台存檔契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)。本批只用隔離 fixture／本機候選及預覽證據，不自動上架橋接版、不呼叫管理 API。C 再新增不相容 ID 時重新審查格式，不假設 B 能讀所有未來內容。

## 8. 素材與音訊交付

A 已證明多姿勢 strip／大圖集容易主體跨格。本批直接採「一個真姿勢一張圖 → 確定性正規化 → 組表」，不再先試整張 6×5 重生數輪。每種怪先審單角色 profile 與一個 active pose；合格稿可直接作對應有效影格，剩餘姿勢依同一參考分批生成。

| 資源 | 本批正式輸出 |
| --- | --- |
| 普通怪 | 木偶／石獸各 576×480 RGBA，6欄×5列、單格96，pivot(.5,1)；每隻18個有效姿勢 |
| 行舟 | 192×96 RGBA、兩格96px idle，各350ms loop；閉嘴、肩袖輕微呼吸，不做說話循環 |
| 石碑 | 共用 `actor:ruins-stele` 靜態 PNG，建議192×256 RGBA、display96×128、pivot(.5,1)，兩個 NPC ID 共用底圖 |
| 石碑 idle metadata | 各自 `npc:ruins-stele-west:idle`／east，frames `[0,0]`、各350ms loop，image 只有一格；明確為靜態相容接線，不放寬全體 NPC 契約 |
| 石碑發光 | renderer 用 questViews 推導常亮的小光暈，可沿既有 Graphics 畫；不新存 flags、不危險閃爍 |
| 環境 | `ruins-gallery` sky960×540／far1440×540／mid1920×540，後兩層真RGBA，mid y≥180全透明 |
| 物品 | 斷裂銅弦／失聲鈴片，各128×128 RGBA、runtime32 |
| 區域圖／音樂 | 沿用 A 區域底圖、`theme-ruins` base／combat，不重新生成 |
| 新音效 | `stele-tune`，離線原創合成、48kHz mono PCM16 WAV，約0.35–0.65秒；只在成功0→1時播一次，靜音仍可完成 |

兩種怪沿 idle `[0,1]` 各200、walk `[6..11]` 各120、attack `[12..15]` 依上一節、hurt `[18,19]` 各100、dead `[24..27]` 各100；未用格複製同列最後有效格。單幀統一朝右、中心 x48、最下非透明 y92，四邊至少3px透明；保留完整根鬚／銅線／四足，不以裁斷身體適配格子。

調律音走既有音訊生命周期與去重機制。不能把 UI 點擊、每幀 render 或讀到已完成存檔當成新成功；換圖、重載、重開面板、重按均不重播。可在 `GameApp.playStateTransitionAudio` 觀察已確認的 q17 counter 0→1：前後皆 playing、同一 playerEntityId、同在長廊、前態 q17 已 active，並排除載入／重建；事件 ID 含該次角色實體及碑 ID 供既有機制去重。不要冒用 pickup／buff VisualEvent 來播放錯誤音效，音效不可用仍正常計數。

本批新增 runtime 目標 **≤4 MiB**；A 已有11.29 MiB，因此 A+B 目標≤15.29 MiB，為 C 保留約8.71 MiB，維持全章24 MiB增量預算。估算本批約10個新資源檔：actor4、environment3、item2、WAV1。先優化 PNG 與移除 public 中的非正式稿，不為預算改動已定尺寸／動作或降低既有 AAC160k 規格。

所有原稿、完整 prompt、工具來源、採用／拒絕原因、raw SHA、正規化與格位映射留 `art-source/ruins-b/`。生成時就保存每個 frame ID 的 metadata；wrapper 缺路徑時限定讀自己的 session `savedPath/revisedPrompt` 恢復，不能用全域「最新幾張」猜來源。主對話只收文字及路徑；必要審圖由負責代理看1–2張≤1280px、JPEG q60–75中性底縮圖。額度中斷先保存交接並恢復既有原稿，不重生已完成成果。

## 9. 程式接線與檔案所有權

| 工作流 | 主要檔案／責任 |
| --- | --- |
| 契約、任務與存檔 | contracts/definitions、commands、ports、types；domain/quests；persistence/index、validate；inspect count／claimed完整性、格式3與舊檔保全 |
| 規則與敵人 | content/rules/monsters、skills、items、validate；domain/actors；新選招、判定時序與普通掉落 |
| 地圖與任務內容 | content/world/maps、npcs、dialogues、quests、validate、index；world-map-model 的第三地標；q20明確前置例外、inspect對象可達性 |
| app／UI／renderer | app/gameplay、app、assets；ui/index；render/index、animation-contract；命令重驗、調律按鈕、名稱／進度、常亮狀態、一次音效與新怪逐格節拍 |
| 素材與音效 | public/assets各包manifest及新檔、tools/audio/scores/sfx；只在有明確交接時轉移共享manifest所有權 |

World validator 的 approved IDs 精確擴充為：17張圖、12個NPC（行舟＋兩碑）、18件任務（q01–q17加q20，**不補假的q18/q19**）。Rules 為33物品、18技能、16怪物。保留舊清單與限制，不能只改成「任意數量皆通過」。

inspect target 必須是長廊中合法配置的兩碑，並納入目前任務階段可達性驗證。NPC／portal 不重疊、平台出生點落腳面、免費回城與原有傳送維持現有規則。區域圖只計真 MapDef，沒有內殿 placeholder。

## 10. 新 Luna Max 的依賴與批次

本節供下一輪獲得實作指示後派工；本輪不派代理。每個任務都建立全新 GPT-6 Luna、max reasoning，最多3個同時工作。完成後不再給舊代理新批次，靠 repository 交接接續；不用 fork 複製圖片歷史。

1. 先派「契約／任務／存檔」、「怪物規則／AI」及「單角色 profile／active pose」三個獨立 owner。契約 owner 先交付第4／7節接口；圖像 owner 只交已審參考與來源紀錄，避免同一長對話兼做全部程式和大量圖稿。
2. 依賴完成即以全新代理補位：「地圖／任務內容」依賴規則與契約；「app／UI／renderer」依賴契約；「環境／物品／NPC／石碑／音效」依賴已審參考。不要為湊三名同時工作而同改 shared contracts 或同一 manifest。
3. 怪物剩餘單姿勢分為每隻 motion 與 action 小批，沿共同參考，各自只寫自己的 art-source 子目錄。合格 profile／active pose重用為對應格，不多生一份。每批至多用少量 contact sheet 自審，完成即停。
4. 再派全新的素材組裝代理，等所有有效幀與 metadata 齊備才追加正式圖集／動畫。actor manifest 在 NPC／石碑 owner 完成後才交給此 owner；不讓兩邊以 JSON 互相覆寫。
5. 最後由新的整合代理核對引用、候選版本與必要檢查；主代理審查交接、維護狀態並決定 B 是否完成。只做本批，完成即停，不自動延伸 C／D。

各 owner 報告至少含來源、改檔清單、已完成／未完成、實際檢查、輸入輸出與下一位可直接使用的路徑。交接放 `plan/reports/ruins-b-*.md`，長日誌／metadata保留檔案，不貼到主對話。

## 11. 最小驗收與檢查時機

| 核心行為 | 聚焦驗收 |
| --- | --- |
| inspect 命令 | 接取前只讀不記；錯map／距離／target／interaction／死亡／待切圖均不改counter；西東任意順序、重按最多1 |
| 進度與領獎 | q17兩碑＋木偶2才ready，仍需手動claim，不能重領；q20可並接／獨立完成，永不鎖主線 |
| 存檔 | format1／2舊檔無新任務可載入，首次寫3保全原件；單碑進度重載保留，claimed缺碑拒絕；未知格式保留並停止寫入 |
| 材料 | 兩石獸生成點＋重生可得三殺；賣掉鈴片不抹kill，補足後可交3片，獎勵一次，claimed後不要求還持有材料 |
| 戰鬥 | 兩新技能完整windup／active／recovery、鎖向／一次命中／取消；低掃地面可命中、跳起可躲、沒有假彈體 |
| UI與聲光 | 同時顯示q17／q20；碑名不裸ID；常亮隨已存counter恢復，成功音每碑一次且重載／重開不播 |
| 資產與候選 | 五組動畫／static碑metadata、PNG切格／alpha、relative URL、第三地標與版本／格式宣告相符；新檔與全章預算分開記錄 |

實作時使用少量有行為價值的 focused tests，例如 `tests/ruins-inspect.test.ts`、`tests/ruins-b-save.test.ts`、`tests/ruins-gallery-combat.test.ts`；既有直接受影響的單檔才跟跑。Vitest filter 是 substring，命令必須加 `--exclude '**/.worktrees/**'`，不要再選入舊副本，也不清理其資料來讓測試轉綠。

最終相關程式穩定後，typecheck、content check、受影響測試各一次；素材齊備再做一次全體 loader／引用核對及獨立 build。已通過且相關檔案未改不重跑。只有文案／樣式不新增測試；不跑全回歸、不重生音樂、不重複截全部地圖。

本批可報「程式與素材／候選完成」，但未進真實瀏覽器就把互動手感、平台組合畫面、讀碑不中斷戰鬥等列為未驗證。D 的一次有範圍子目錄／跨來源 iframe、正式SDK、完整ZIP及發布流程仍獨立追蹤，不由fixture或build代替。沒有明確發布指示不推tag、Release或平台發布。

## 12. 規劃階段來源與文件驗收（歷史紀錄）

本輪於2026-10-25完整網路讀取 [Playroom模板](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md) 與七份 main 文件：[開發標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)、[操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)、[Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)、[Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)、[SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)、[版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)、[存檔規格](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)。查詢參數避開舊快取，永久來源仍連 main；未下載規格副本入庫。

本輪適用：舊進度保留與真實格式相容性、失敗不覆寫、相對資源、正式驗收與候選分開、未授權不發布。本輪只檢查計畫與實際接線缺口、文件連結及差異；不執行遊戲測試、build、瀏覽器、素材生成、存檔遷移或發布。beta.12及其獨立成品不變。
