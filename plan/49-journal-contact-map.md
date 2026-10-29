# 49・基礎體驗：手帳接取與回報 NPC 地圖

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan48](reports/plan48-handoff.md)已完成；唯一現況見[status](status.md#current-state)。

手帳顯示接取與回報 NPC 的名字／所在地，但底部地圖按鈕尚未指向該 NPC。本批於可接取／待回報時讓同一按鈕直接查看相關 NPC 圖；沿用 Plan48 純查找與 review-npc-map handler，仍只選圖查看、不移動角色。root 已核 buildVisualQuests 現有 selected／definition／單一底部 map 按鈕、button helper 的 data-focus 生成及 root buildWorldJournal 的選取一致性。其他狀態保留原世界地圖入口。

## W01・全新 Luna Max：單一呈現 owner

僅寫 src/ui/illustrated-panels.ts、新 plan/reports/plan49-journal-ui.md 與新 tsc log。加命名 import resolveNpcMapTarget；只改 buildVisualQuests 底部原 map 按鈕：selected.status 為 ready 時 npcId=definition?.turnInNpcId，available 時 npcId=definition?.giverNpcId，其餘 undefined。存在 npcId 時由 helper 查 world；沒有 target 時完整沿原「查看世界地圖 →」／open-panel／{panel:'map'}／原 class 與 helper focus。

有 target 且 npcId 時，在原位置仍只產生一個 button，使用既有 button helper，label「查看回報 NPC 地圖 →」或「查看接取 NPC 地圖 →」，action review-npc-map，data {npcId}，class 原 ms-button ms-journal-map-button。title 與 aria-label 含 selected.title、接取／回報角色、實際 target.npcName／mapName 及「只查看地圖，不會移動角色」。button helper 生成新 action／NPC 對應 focus，不改 helper、全域 handler、root UI 或 map 模型。原 card.append(map) 與 root append 順序不動。

不改 selected／chooseJournalQuest、quest state、任務條件／接取／領獎、現有 contacts／objectives／reward／locked／story、其他按鈕、CSS／資料／signature／計時器／metadata。ready 只代表待回報，按鈕不暗示必可領獎；available 不自動接任務。不硬編地圖或 NPC 名稱，不重複 lookup／解鎖判定，不增加新 helper／tests 或 DOM setup。

一次指定 Node24.22.1 tsc --noEmit，存完整命令輸出與 exit；root 對基線 illustrated-before.ts 審 import／單一區塊及 ready／available／其餘／缺資料各 branch。不重跑 Plan48 focused／handler／其他 tests，不 browser／server。真 click／跨區選圖／focus／reader／layout 未驗。

## W02・全新 Luna Max：新候選

W01 審後使用已預核未用 beta56／artifacts/plan49-1.0.0-beta.56／.playroom/tmp/plan49-candidate-beta56，僅三 source metadata 1／2／1 次 beta55→56、新候選與 plan/reports/plan49-candidate.md。唯讀 Plan38 prepare 六組整體替換 plan38→plan49、plan37→plan48、beta45→beta56、beta44→beta55、beta.45→beta.56、beta.44→beta.55，來源 audit 為唯讀 Plan48；新副本 AST／Path resolved 路徑檢查，不猜 occurrence 數、不改任何舊模板／成品。

指定 Node24.22.1 一次 build／固定 tools1.2.0 pack／完整 ZIP validate／Python311 有限 audit，各步實際 command／output／exit 原檔保留，成功不重跑。不 tests／tsc／browser／server；六 metadata／hashes／有限文字 pattern 及 binary 未掃限制如實。

## W03・root 收束與界線

完成本 Plan、[交接](reports/plan49-handoff.md)、status、README 後一次文件引用檢查，再開下一個明確 Plan。root 本批完整網讀 Playroom 範本、game-development、command-contracts、Schema、Release workflow、SDK、sdk-versioning、save-compatibility（refs188–191，含完整尾段，無讀取失敗）。保留 ID brightwood-first-oath／TommyLamm／desktop／Lv30 四區18圖／讀1–5寫5／SDK1.1.0／protocol1／schema2／tools1.2.0、相對資源與 iframe 契約。無 .codegraph，不自行 index。保留 dirty／真資料／profiles／全部舊候選，不 git 寫入／發布／push／tag／Release／新增排程，不例行重試 0x6D。02:40／07:50 已觸發刪除。

## 最新使用者指令・收尾補丁與 Release（取代自動開下一 Plan）

2026-10-29 使用者明確要求「完成這個 plan 後開始收尾跑簡單驗證，然後建立 release」，隨後要求「把你剛剛過程中發現到問題先修了再說」。因此不建立 Plan50；先完成本 Plan 原 beta56 並保留，再修已確認的霜潮洞窟地圖返回誤標，以 beta57 新候選收尾，提交及推送對應 immutable tag，由既有 Release workflow 建立 GitHub prerelease；不操作平台匯入／確認／上架，也不新增排程。

root 已核 src/app/gameplay.ts returnTown：frost-tide-cavern 首領戰後實際回 frost-shore，result 畫面已正確寫「返回雪痕海岸」；src/ui/world-map.ts 卻只有 bell／sunwell 例外，漏 frost，且 disabled title 的 arena 清單也漏 frost。補丁全新 Luna Max 單 owner，只改 world-map.ts 末段：增加 frostBossResult=current map frost-tide-cavern && view.canReturnTown；returnLabel 加對應「返回雪痕海岸」；disabled title 的原 arena OR 清單加 frost-tide-cavern，使戰鬥中顯示同一不能返回安全地點訊息。保持其他 label／data／focus／disabled／action／順序、UI layout、遊戲 returnTown 路由、政策及存檔不變。不要順手改其他地圖按鈕、HUD、legacy root-ui 或新增 helper/tests。指定 Node24.22.1 單次 tsc，root 審局部 diff 並對照既有 gameplay；不 browser／完整套件。

新補丁報告 plan/reports/plan49-frost-return-fix.md；候選新 artifacts/plan49-1.0.0-beta.57／.playroom/tmp/plan49-candidate-beta57，報告 plan/reports/plan49-release-candidate.md。beta56 舊成品及報告保留。新 beta57 prepare 從唯讀 Plan38 模板映射 plan38→plan49、plan37→plan49、beta45→beta57、beta44→beta56、beta.45→beta.57、beta.44→beta.56；注意 source audit 與新 audit 都同 Plan49，只替換 beta token，不能以 plan49 token 當 legacy guard（同名合法）；以 AST／Path 精確 resolved 新57路徑及六metadata核對。必要時採獨立明確 prepare 新副本，不改原模板／audit。只三 metadata beta56→57、新候選／新log，一次 build／pack／完整 ZIP／有限 audit，成功不重跑。

本補丁／Release 任務開始前 root 完整網讀八份規格 refs199–202（含尾段）。保持固定身分、格式及契約。GitHub 公開目的地已讀確認 TommyLamm/brightwood-first-oath，main 為預設分支；最新版已公開 beta10。原受限 CLI 兩個 read 呼叫無法連線，經標準網路提權後成功，未暴露憑證。發布授權已由使用者明確提供，前段不 git／tag／Release 限制在此任務範圍內被最新指令取代；原本工作資料保全與最小驗證仍適用。
