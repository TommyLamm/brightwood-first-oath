# 48・基礎體驗：商人所在地圖入口

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan47](reports/plan47-handoff.md)已完成；唯一現況見[status](status.md#current-state)。

離開商人時商店只提示靠近木葉商人，缺少查看所在地的入口。新增「查看商人所在地圖」，開啟既有資訊地圖並選中商人所在圖，明示只查看、不移動角色。root 已核 worldCatalog、merchant 定義、town placement、world-map atlas 及 select-map／review-sidequest／setPanel 模式：商人在 town 木葉鎮，不能硬編 camp。

## W01・全新 Luna Max：純查找

只新增 src/ui/npc-map-target.ts、tests/npc-map-target.test.ts 與 plan/reports/plan48-npc-map-target.md。

resolveNpcMapTarget(world: Pick<WorldCatalog,'maps'|'npcs'>, npcId: Id): NpcMapTarget|null，結果僅 mapId／mapName／npcName。先核 NPC 定義存在，再按 Object.values(world.maps) 原序找第一個 map.npcs 包含 npcId 的圖；未知／無 placement 回 null。名稱及 ID 全由 catalog 取得，不硬編、排序、cache 或寫入輸入，不輸出 player／command，不判解鎖／任務或移動。

用真 worldCatalog 的三組 focused cases：merchant 在 town 且名稱正確；clone placement 移到 camp 及改名後動態跟隨、原件不變；unknown／無 placement／缺 NPC 定義回 null。核輸入不變及僅三 primitive 欄位。只跑此新檔一次 Vitest，原命令／輸出／exit 存新 log；不 tsc／browser／其他測試。

## W02・全新 Luna Max：單一 UI owner

W01 審後只改 src/ui/index.ts、加 plan/reports/plan48-ui-integration.md。加入 import 及 UiAction review-npc-map。handler 讀最新 view.catalog.world 與 button.dataset.npcId，缺 ID／無 target 即 return；設 selectedMapId=target.mapId，若頂層 map 則 renderPanel(view,true)，否則既有 dispatchDraft setPanel map，沿 review-sidequest 模式。不得改 player location 或新增 gameplay command。

buildShopPanel 原 merchant intro 後、bagStateMessage 前，僅 !atMerchant 且 helper(world,'merchant') 有 target 時 append secondary button「查看商人所在地圖」，data npcId merchant／focus shop-merchant-map。title／aria-label 帶實際 NPC 與地圖名，並明示「只查看地圖，不會移動角色」。已在商人處或資料缺失不顯示。保留其餘購售、資料、filter、數量草稿、背包選取、signature、開關面板 handler、focus machinery、CSS、計時器與地圖規則。

只一次指定 Node24.22.1 tsc --noEmit，root 審 helper／tests／UI 局部 diff；不 DOM／browser／server，不重跑 W01。真 click／focus／跨區選圖／讀屏／layout 未驗。

## W03・全新 Luna Max：候選

W02 審後使用預先確認未用 beta55／新 artifacts/plan48-1.0.0-beta.55 及 .playroom/tmp/plan48-candidate-beta55。只三 source metadata 1／2／1 次 beta54→55、新候選與 plan/reports/plan48-candidate.md。依唯讀 Plan38 簡單成功 prepare 範本六組整體替換：plan38→plan48、plan37→plan47、beta45→beta55、beta44→beta54、beta.45→beta.55、beta.44→beta.54；新 audit 由唯讀 Plan47 產生。依 AST／Path resolved 值核路徑，不猜 literal 次數，不改舊模板／audit／成品。

指定 Node24.22.1 一次 build／固定 tools1.2.0 pack／完整 ZIP validate／Python311 有限 audit，逐步存實際命令輸出與 exit；成功不重跑。不 tests／tsc／browser／server，有限文字 scan 及 binary 未掃如實列出。

## W04・root 收束及界線

本 Plan、[交接](reports/plan48-handoff.md)、status、README 一次文件引用檢查；完成後才建立下一個明確 Plan。root 完整網讀八份規格（refs183–186，含完整尾段）。保留 brightwood-first-oath／TommyLamm／desktop／Lv30 四區18圖／存檔讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0、相對資源與 iframe 契約。根無 .codegraph。共享 dirty、真資料、profiles 及全部候選保留，不 git 寫入／發布／push／tag／Release／新增排程，不例行重試 0x6D。02:40／07:50排程皆已觸發刪除。
