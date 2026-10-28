# W01-03・q21／q22 與航標檢查的存檔可行性

日期：2026-10-27（香港時間）  
狀態：**DESIGN_READY／隔離候選實作已授權**。採格式5候選；真實舊存檔首次改寫必須經玩家明確備份升級選擇，正式雲端與發布需另依平台相容條件處理。最新進度見world-completion-live-handoff.md。

## 結論

SaveData 現有 quests/counters 結構能表達 q21、q22 和一次性 inspect 計數，並能在新 catalog 內讀寫；缺少的新任務不需預先初始化，舊的已領任務、角色數值、技能、裝備、背包、地圖及旗標均可原樣保留。

但同一份 format4 新增 q21/q22 狀態後，beta18 validator 會因 catalog 不認得新 quest ID 而拒絕整份存檔。它會保留原件並停止寫入，並不丟資料；玩家卻不能在 beta18 繼續載入。因此「format4 可序列化」不等於「beta18 與新版本雙向相容」。在不放寬 validator、不把新狀態偽裝成既有任務的前提下，沒有可證明的 format4 雙向相容方案。建議將下一格式定為5，讀1–5、寫5，保留現有 SaveData 欄位形狀，並對本機首次升級加明確確認及原始 format4 備份。

q21/q22、航標及格式5隔離候選在Plan16實作授權範圍內，源碼可完成並用隔離資料驗證。**真實存檔升級仍需玩家明確選擇**：用本報告的具體影響說明與『備份並升級／暫不升級』UI取得確認，確認前不寫舊原件；root及代理不自行搬移真實資料。正式雲端仍受已公開Manifest及saved:true契約限制，不因候選完成就視為已核准發布或已驗證正式寫入。

## 靜態來源證據

- 現行 beta18 候選／本機設定為 ID brightwood-first-oath、format 1–4 可讀、format4 寫入；SAVE_FORMAT 與 READABLE_SAVE_FORMATS 在 src/persistence/validate.ts:8-9，cloud manifest 在 public/game.json:13-16，SaveEnvelope／CloudSaveInput 固定 format4 在 src/contracts/types.ts:111-115、src/contracts/ports.ts:48-52。
- SaveData 僅允許固定的頂層欄位；quests 是動態字典。src/persistence/validate.ts:128-133 嚴格檢查頂層與 player 欄位，src/contracts/types.ts:102-109 定義 SaveData。逐筆 quests 驗證會查當前 catalog 的 world.quests[questId]，未知 ID 立即回錯；每個 counter 又必須對應該 quest 的 kill/reach/inspect objective，且不超過其 count：src/persistence/validate.ts:238-256。不能單靠 envelope format4 宣告讓舊 catalog 接受新 ID。
- 不存在「每個 catalog quest 都必須先寫入空狀態」的要求。startNewGame 使用 quests: {}（src/app/gameplay.ts:85-98）；缺少狀態時 getQuestView 會依前置／等級推導 available，acceptQuest 才建立 active 狀態與追蹤目標的零計數器（src/domain/quests/index.ts:78-100,107-123）。不要替既有存檔補 active/claimed 預設值；QuestState 沒有 available 狀態，而且 acceptQuest 把任何既有狀態視為已接取。
- recordQuestEvent 只更新 active quest，並將 counter 封頂在 objective count（src/domain/quests/index.ts:125-145）。Reach 已訪地圖也可由 visitedMaps 推導完成（同檔 37-58）。因此建議的 q21 inspect count 1、q22 basin reach count 1 + beetle kill count 2 都使用既有存檔表示，不新增 SaveData 欄位。
- 舊版拒讀行為可由程式直接確認：beta18 仍認得 envelope format4；其 prepareSave 對 q21 或 q22 狀態會走到 unknown quest error。local load 會回 loadError、保留原字串、設 initialized=false（src/persistence/index.ts:152-177,301-314），不能因失敗建立初始資料；cloud load 驗證失敗會進 memory、停止初始化，也不建立雲端初始存檔（同檔 317-332,369-394）。這是拒讀，不是丟棄；但也不是可用的舊版相容。
- 目前 world validator 亦是明確 allowlist：地圖／NPC／quest ID 必須完全符合清單（src/content/world/validate.ts:4-10,65-75）；前置規則把 q20 特別接到 q16，其餘視為連號主線（289-293）；inspect 只接受回聲長廊兩座石碑（26-30,303-309）。遊戲命令另外限定 inspect 只能調律該兩座石碑、位置在回聲長廊、q17 active 且目標相符（src/app/gameplay.ts:574-612）。新增航標必須在 validator 和命令端逐項納入核准 ID／位置／任務，不可放寬成任意 inspect target。
- 舊版的保存保全可沿用現有原則：本機格式1–3 首次改寫前會保存原始 JSON 至 formatN backup 並回讀核對；目前這段只涵蓋1–3，未涵蓋4（src/persistence/index.ts:526-605）。現有 legacy import 是使用者按鈕確認後複製，保留舊來源；損毀存檔另存備份也有兩步操作（src/app/app.ts:429-459,568-600）。沒有通用 format4→5 確認流程，需加一個最小專用升級分支。
- 歷史 Git 證據：初始 T09 validator commit 70a5784 是 format1；最新已提交保存 validator 17a4c37／目前 HEAD d410f67 是 format3、讀1–3，仍以當前 catalog 拒絕未知 quest。beta18 format4 是現有 dirty 候選內容；plan/reports/ruins-c-saves.md 記錄其格式1–3→4 備份、q17/q20 與 q18/q19 claimed 保留案例。plan/reports/overnight-beta18-package-20261026.md 記錄 beta18 使用讀1–4／寫4。倉庫未找到 format5 manifest／程式宣告；本機 tag 僅到 beta10，不能據此推斷外部平台當前狀態。

## 建議的最小實作契約

### 任務與航標

1. 保持兩支線缺省為「未接取」：q21 的前置是 q09 claimed，q22 是 q13 claimed；不要加成 q20/q21 連號鏈，也不要令支線成為主線或傳點前置。
2. q21 active 狀態在接受時建立 counters['frost-route-marker']=0；接取後調查一次封頂1，claimed 必須有1。q22 建立 basin reach 及 sunwell-beetle kill counters；reach 可沿用既訪地圖語義，擊殺在接受後最多2。任何已領狀態均保留其原 counters，不發歷史獎勵。
3. 只批准航標的精確 ID、地圖與互動語義。若沿現有 NPC placement／interaction 表示，加入獨立 marker identity，不重用石碑 ID；更新 world validator 的 exact IDs、位置、角色／視覺鍵、q21 objective 與解鎖階段檢查，以及 gameplay inspect 的精確目標／地圖／靠近／開啟互動／q21 active／只計一次檢查。UI 需將 marker 名稱與「調查」文案正確顯示。sunwell-beetle 與 sand-sunwell-basin 已是既有 kill/reach 類型；q22 只需加入精確 quest/prerequisite/catalog 驗證，不改存檔引擎。
4. 保持未知 quest、counter target、未來 format 的嚴格拒絕；新 catalog 能驗證 q21/q22 才能讀取其存檔。

### Format5 與既有資料

- 宣告 SAVE_FORMAT=5、READABLE_SAVE_FORMATS=[1,2,3,4,5]；同步 SaveEnvelope、CloudSaveInput、public/game.json cloudSave.readableFormats/writeFormat 及相應測試／fixture。payload 仍是原有六欄 SaveData，無需重建或重算玩家資料。
- 對格式1–4 使用同一嚴格 payload validator；新版本讀 format4 舊檔時，保留已存在的 quest status/counters、player name/level/EXP/STR/DEX/AP/SP/HP/MP/coins/skillRanks/bag/equipment、visitedMaps/location/flags/settings。新 q21/q22 不在舊存檔中補 claimed 或 active；玩家接取後才增加相應 map entry。
- 本機 format4 首次寫 format5 前，在標題／存檔提示提供「備份 format4 並升級繼續」與「暫不升級」兩個明確選擇。確認後先將當前 key 的 exact raw envelope 複製到同 key 加上 :format4-backup 的備份鍵、回讀比對，再允許寫5；備份已存在且相同可續行，內容不同／讀寫確認失敗則保留原件並停寫。拒絕升級時只允許不保存的暫時遊玩或離開，不把 format4 內容降寫或丟掉。這是專用遷移提示，不擴建一般存檔管理系統。
- 雲端 SDK 提供的是雲端 load/save 與 revision 契約；本輪沒有可證明的雲端原件備份／回復 API。保留舊 SaveData 欄位值不等於可恢復原雲端 envelope。首次雲端 format5 寫入視為 forward-only；只有在玩家明確確認且當前已發布版本 manifest 支援讀5／寫5後才可送出。未發布候選或 beta18 伺服器狀態下不得嘗試 format5，不能退回 format4 重送。
- 新版發布後，beta18 舊分頁的 format4 寫入應由伺服器以 format incompatibility 拒絕；取得新 revision 也不使舊分頁可降寫。format5 雲端資料存在後，回退 beta18 不相容；若需回退，必須先有讀1–5／寫5 的相容版本，且發布流程仍需使用者另行授權。

## 平台邊界與次序

依主代理本輪完整讀取的官方 game-agent-template、game-development、command-contracts、game.schema、game-release、starter SDK、sdk-versioning、save-compatibility 規格：伺服器依已公開版本 Manifest 檢查 read/write 格式；提交版本的寫入格式必須等於其 writeFormat，保存內容須能由目前上架版本讀取。舊分頁不支援的格式需回 SAVE_FORMAT_INCOMPATIBLE，不能靠重取 revision 繞過；版本回退不回退玩家資料。Manifest 數字宣告不能替代實際資料 validator 的相容性。

因此採此先後：

1. 先完成 format5 parser/writer、local raw backup＋確認閘門、q21/q22 strict catalog／inspect 更新；只用隔離 origin、合成存檔與測試帳號，從不載入／改寫真實存檔。
2. 在隔離案例確認 format1–4 舊資料可保留讀入、format4 備份確認、格式5 reload、q21 inspect 與 q22 reach/kill 的中斷續存，以及 unknown quest/counter/future format 仍拒絕。核對 claimed 任務、AP/SP 與 bag/equipment 完整保留。
3. 候選須同時宣告讀1–5／寫5並由實際程式讀5；未成為已公開的目前版本前，正式雲端寫入保持停用。正式上架／發布依 W09 的明確授權另行執行。
4. 已公開新版 manifest 後，才向使用者展示雲端升級確認；雲端成功只接受平台回 saved:true。若平台仍在 beta18 manifest、回傳 incompatibility 或讀取失敗，原件不動、不建立空存檔、不改用 format4 寫入。
5. 任一已存在 format5 雲端記錄不得靠 beta18 回退；回退候選必須保持可讀5／寫5。

## 本輪範圍與驗收

只做靜態源碼、Git 歷史及既有報告盤點；未讀或修改真實存檔，未改程式／素材／manifest，未執行測試、typecheck、content check、build、browser、pack、publish、commit 或 push。工作樹中原有 dirty/untracked 檔均保留。

後續W01實作依本報告完成格式5隔離候選與明確確認gate，不需要為源碼另等聊天批准；q21/q22按以上缺省與counter契約實作。真實舊檔只在玩家明確備份升級操作後改寫。W03在存檔契約落地後沿用支線入口與inspect event；不可繞過雲端發布相容條件向正式帳號寫入5。

