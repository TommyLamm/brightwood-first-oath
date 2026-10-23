# 霜雪群島擴充交接與進度

更新：2026-10-24（香港時間）。本報告是本輪續作紀錄，狀態板見 ../status.md。

## 本輪任務與範圍

使用者授權持續擴充關卡、怪物與世界地圖未開發區域。首批先開放霜雪群島，同時保留原有 q01–q08 主線、桌面單人劍士和既有存檔格式。舊版「七圖、六普通怪」是首版範圍，已由本次明確擴充授權覆蓋；本輪不修改雲端／排行榜契約、不提高等級上限、不發布或推送。

## 開發規格與驗收

已讀取根目錄 AGENTS.md、本專案線上模板及其七份指定規格：

- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md
- docs/game-development.md
- docs/command-contracts.md
- templates/game.schema.json
- templates/game-release.yml
- examples/starter/playroom-sdk.js
- docs/sdk-versioning.md
- docs/save-compatibility.md

本階段（2026-10-24）重新完整讀取上述線上模板與七份指定文件。另參照 plan/README.md、plan/10-asset-spec.md、plan/status.md 與 imagegen skill。適用要求：素材與 manifest 使用入口相對 URL、保持跨來源 iframe／子目錄相容、維護舊存檔相容；沒有使用者授權不得建立 Release、tag 或平台上架。最小驗收是新增地圖可由 q08 已領獎存檔抵達並返回，world map 能列出地標，舊格式存檔可以記錄新地圖位置，素材 manifest／世界內容／型別及相關測試有效。

## Stage A：雪痕海岸路徑與存檔相容

已新增 frost-shore「雪痕海岸」作為第八個正式地圖，接在 Guardian Arena。通往雪岸的 portal 要求 q08 狀態為 claimed（已完成並領獎）；回程 portal 不受任務鎖定。新地圖已加入 mapOrder、world landmark 和探索總數，霜雪群島從 planned region 移除，黃金沙海及遠古遺跡仍維持待開發。SaveData 格式及欄位沒有改動；測試驗證同格式存檔可以把 frost-shore 記為目前與已訪地圖。

雪痕海岸目前是無怪物探索地圖，不應宣稱已完成戰鬥內容。雪岸 sky/far/mid 三層環境圖已接入 frost theme 和 environment manifest，所有 URL 均相對於遊戲入口。

直接相關檢查結果：

- npm.cmd run typecheck：exit 0。
- npm.cmd run check:content：exit 0，rulesCatalog 與 worldCatalog 交叉驗證通過。
- .\node_modules\.bin\vitest.cmd run tests/world-map.test.ts tests/persistence.test.ts tests/integration/app-foundation.test.ts：exit 0，Vitest 輸出 9 files／74 tests passed；runner 實際回報檔案數比預期的指定檔案多，因此只記錄原始輸出，不宣稱僅執行三個檔案。
- git diff --check：exit 0；Windows Git 對少數 LF 工作檔提示下次會轉成 CRLF，無 whitespace error。
- 未跑瀏覽器、build、全套回歸或發布驗證。

Stage A 程式、focused tests 與狀態／報告 commit：f347c76（Add playable Frost Shore route）。素材接入 commit 已在 main：97be61e（sky，來源 commit 7121210）與 f632528（far/mid，來源 commit a5d86d3）。

## Stage B：霜牙雪狼與霜牙戰利品

已新增 frost-wolf「霜牙雪狼」為 Lv30 敵人，加入雪痕海岸三個巡邏生成點，保證掉落 frost-fang「霜牙」。霜牙是可出售材料，透過既有 merchant 取得用途（35 金幣）；沒有改裝備槽、等級上限或存檔 schema。狼 atlas 以實際 229×229 cell、6×5 切格載入，idle/walk/attack/hurt/dead 五列對應有效幀；runtime 96×96。item icon runtime 顯示 32×32。

Stage B commits：9f90269（wolf／loot 與玩法接線）、61db462（狼 atlas）。相關素材／接入 commits：be6958d（霜牙 icon）、87fbd08（雪岸 region card）；環境層為 97be61e、f632528。原始素材 commits 及 prompt/source 保留在代理分支和 art-source/expansion-frost/。狼圖目視可見透明底的側向角色與 6×5 格；來源記錄 alpha 四角約 0/0/1/0（左下極弱 alpha 1 點），沒有重採樣切格。

最小驗收實際結果：

- npm.cmd run typecheck、npm.cmd run check:content、git diff --check 均 exit 0。
- npx.cmd vitest run tests/rules.test.ts tests/world-map.test.ts tests/integration/app-gameplay.test.ts tests/integration/app-foundation.test.ts 通過，原始 runner 輸出 12 files／117 tests passed。integration 覆蓋擊殺雪狼、必掉霜牙、拾取與向商人出售。
- 瀏覽器集中檢查為 PARTIAL，非完整路線驗收。使用隔離 Playwright profile，起點是人工構造的 q08 claimed／Lv30 fixture，並非從頭通關。可續玩狀態在 reload 後恢復到雪岸；世界圖顯示 8/8 已探索、雪岸地標與狼情報；畫面確認狼 atlas 與雪岸背景出現在實際場景，雪狼攻擊使測試角色 HP 由 660 降為 419；「返回城鎮」成功抵達木葉鎮。沒有完成狼擊殺或 browser 掉落檢查，沒有走完整祭壇傳點往返；該戰鬥與掉落由 focused integration test 覆蓋。隔離 save key 已刪除、Playwright session 已關閉。共用 Vite PID 15908 由主代理觀察且仍在服務 5173；未終止來源未確認的程序。
- 未執行 full test suite、build、完整主線流程、發布或 tag／Release。

## 2026-10-24 Stage C current snapshot

截至程式驗收 commit 9c88e5c，main 已整合 C1/C2、雪芽 NPC、q09/q10、第三張 frost-tide-cavern、Warden atlas、霜雪區域圖 UI、長鋒 sprite 與 icon。q09/q10 在 445559f；Cave content 在 bf7bfb5；長鋒 sprite 在 7838c1d，icon 在 7137479；Warden runtime atlas 在 3134390；區域圖 UI 在 3ec2b8d；Cave 節點與 q10 gate focused UI tests 在 9c88e5c。

- Cave frost-tide-cavern 使用 frost-cave 背景及三隻已註冊的 frost-crab；松隘→洞窟要求 q10 claimed，洞窟→松隘不設鎖。已更新 mapOrder、內容 validator、地圖數與 q09/q10 integration route。
- Warden atlas provenance/runtime 已整合為 4b5d3d9／3134390：1632×1360 RGBA、6×5、272px cell、192px runtime。boss encounter、兩招、獨立重試與 q11 尚待開發。
- 長鋒正式 sprite 為 64×64 RGBA；icon 為 128×128 RGBA、遊戲顯示 32×32。來源、prompt、原稿及 export scripts 隨素材 commits 保存。尚未註冊為 item/visual，也未作為任務獎勵。
- Cave focused checks 在 bf7bfb5 通過：npm.cmd run typecheck、npm.cmd run check:content、排除 .worktrees 的 frost-quests/app-foundation Vitest（2 files／10 tests）、git diff --check。
- UI 代理在具有 bf7bfb5 等效 Cave content 的 worktree baseline 1c92952 執行 world-map.test.ts（6/6）、typecheck、git diff --check，均通過；測試涵蓋第三節點、80%／25% landmark、q10 claimed 前鎖定及退回總覽後位置保留。測試差異提交 8301ef5 並已整合成 9c88e5c。沒有重跑已通過且未變更的 checks。
- 尚未做 browser、build、pack/validate、boss/q11 整合或完整路線驗收。區域可切換與 q10 gate 有 focused UI evidence，但尚未集中檢視其實際遊戲流程。
- 格式 1 舊存檔、q08/Guardian flags、桌面單人劍士與 Lv30 上限需維持。q11 只在手動 claim 時標記 Frost Isles 完成並給長鋒一次；boss死亡／重試不可提前完成或重發獎勵。
- 本次新開發包完整讀取根目錄 AGENTS.md 所指 Playroom template 及其七份 main 規格：docs/game-development.md、docs/command-contracts.md、templates/game.schema.json、templates/game-release.yml、examples/starter/playroom-sdk.js、docs/sdk-versioning.md、docs/save-compatibility.md，約於 2026-10-24 香港時間 07:06。適用要求包括相對資源 URL、iframe 子目錄可運行、舊存檔相容；本輪不改 Playroom schema/SDK，沒有發布授權。
- heartbeat 06-55-2 已於 2026-10-24 香港時間 06:55 執行後刪除。當時 quota 顯示 1% used、ordinary usage allowed；goal 狀態仍可能回報 usageLimited，沒有可用代理 API resume，必要時使用者需輸入 /goal resume。

## Next implementation slice

1. 檢視既有 boss encounter、skill damage、預告與 death/retry lifecycle，接入 frost-tide-warden 專用 encounter state，不重用 guardian/q08 flags。
2. 實作 frost-tusk-slam 與 low-tide-wave：清楚預警、可躲時窗、命中距離/邊界判定及一次傷害。Boss 使用現有 atlas attack row。以 focused tests 覆蓋 attack windows、死亡與重試。
3. 註冊 frost-tide-sword（Lv30、不可購買，attack 按現有 Lv30 裝備調整）及 sprite/icon visual keys；q11 手動 accept/claim 時才消耗目標、一次性發獎並完成霜雪群島。保留 q08／Guardian flags、format 1 舊檔及已在松隘玩家的無鎖回岸。
4. 累積 boss/q11/item checks 並確認 UI gate check 後，再集中做一次 build/pack/validate 和隔離 browser route；fixture 起點及範圍須清楚標示，不得稱為從頭通關。沒有推送或發布授權。

## Agent, worktree and art status

- /root 是協調代理；/root/game_expansion 在 main 獨占 content/runtime code、Git 整合、focused checks 與本報告。
- /root/expansion_art 的 worktree .worktrees/expansion-art／codex/expansion-art 位於 3e6643a，素材代理回報 clean。長鋒 sprite 原 commit 00fa553 已整合為 7838c1d，icon commit 3e6643a 已整合為 7137479；Warden source/runtime 整合為 4b5d3d9／3134390。
- /root/frost_interface_art 的 worktree .worktrees/frost-region-map／codex/frost-region-map 位於 8301ef5，代理回報 clean。UI commit 3ec2b8d 與 focused test commit 8301ef5（main cherry-pick 後為 9c88e5c）已整合；不要重挑 8301ef5 或改 world-map model/view/style/test。
- 舊 .worktrees/frost-interface-art／codex/frost-interface-art 位於 2b4bb2a，保留不清理。未追蹤 .worktrees/ 亦保留。
- 本報告與狀態板在 9c88e5c 後仍有編輯，需只 stage 這兩個明確文件並 commit。

## Tools, heartbeat and resume

PowerShell 的有效方法是 powershell.exe、login=false、窄範圍 require_escalated；普通 sandbox shell 曾卡住，apply_patch 曾卡住，故小文件使用 PowerShell。Vitest 一律使用 --exclude "**/.worktrees/**"，避免隔離工作樹中的測試副本被混入。

Heartbeat 06-55-2 已於 2026-10-24 香港時間 06:55 執行並刪除，非待執行排程。Quota 當時為 1% 且 ordinary usage allowed；goal 狀態可能仍為 usageLimited，工具無法代為 resume。恢復時先讀本報告/status 並檢查 git/worktrees，保留 WIP，先做 boss、q11、item wiring 的 focused checks；未改動的先前 checks 不重跑。禁止推送、發布、tag 或 Release。
