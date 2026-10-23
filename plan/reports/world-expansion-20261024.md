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

另參照 plan/README.md、plan/10-asset-spec.md、plan/status.md 與 imagegen skill。適用要求：素材與 manifest 使用入口相對 URL、保持跨來源 iframe／子目錄相容、維護舊存檔相容；沒有使用者授權不得建立 Release、tag 或平台上架。最小驗收是新增地圖可由 q08 已領獎存檔抵達並返回，world map 能列出地標，舊格式存檔可以記錄新地圖位置，素材 manifest／世界內容／型別及相關測試有效。

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

## 後續實作計畫

三圖小區域固定為 frost-shore → frost-pine-pass → frost-tide-cavern，不把三張地圖塞進木葉島舊座標；完成三圖後由世界圖切換獨立霜雪群島區域圖。下一個敵人 ID 為 frost-crab「冰甲蟹」，使用既有 monster combat 接線增量加入獨立 windup → 有界短距 dash → recovery；預告與實際命中區域要共用幾何判定，focus tests 驗距離、地圖邊界、鎖定方向與一次傷害。蟹掉落 ice-shell。crab atlas 曾有角色跨格或貼格邊問題，目前只可保留 source-only，不可接入 runtime。

區域任務採 frost-guide「雪芽」手動接／交：q09 霜牙收集、q10 隘道清障／冰殼收集、q11 冰潮洞窟首領；前置依 claimed 順序，獎勵採補給／金幣與後續區域解鎖。QuestDef／NpcDef 已是可增量資料型別，但 validators 目前固定 map、quest、NPC ID／placement allowlist，需擴增並加舊 save 缺少新 quest 時 idle 的相容測試；不變更 save 格式。冰潮守望獸方向為 frost-tide-warden，兩種清楚可躲的近距獠牙下砸／低潮波；q11 記錄區域完成，不重用 q08 的 guardian/chapter flags。
## 代理、工作樹與素材狀態

- /root：主代理，負責規劃、素材 prompt 指引、協調與續作 heartbeat，不直接改程式碼。
- /root/game_expansion：本輪唯一程式實作／驗證／Git 整合代理；在 main 工作樹，負責共用 map、world map、AI、quest、validator 和測試。
- /root/expansion_art：隔離工作樹 .worktrees/expansion-art、branch codex/expansion-art。已交 sky/far/mid（原始 commits 7121210、a5d86d3，main 接入 97be61e、f632528）、wolf atlas（d54fdd0，main 接入 61db462）、pine layers（e79e3ff，待整合）、cave layers（74f9ed0，待整合）；來源與 prompt 分置於 art-source/expansion-frost/。
- /root/frost_interface_art：隔離工作樹 .worktrees/frost-interface-art、branch codex/frost-interface-art。icon（1108e25，main be6958d）及 region card（aba7c7c，main 87fbd08）已整合；crab atlas 候選因跨格／貼邊不合安全切格契約，未提交 runtime。現由該代理製作 ice-shell icon 與 frost-guide 2×1 idle；crab atlas 改由 expansion_art 接手。
- crab runtime 契約：public/assets/actors/monsters/frost-crab-atlas-v1.png，6×5、128px cell、768×640；rows 依序 idle2/walk6/attack4/hurt2/dead4，真 alpha、baseline 一致、16px 安全邊，空格複製有效末幀；runtime 96×96、邏輯碰撞約56×36、向右，drop ice-shell。不合格候選維持 source-only。
- 目前 main 無已追蹤的未提交改動；.worktrees/ 是代理隔離目錄，提交時只 stage 明確路徑，禁止 git add .。
## 工具限制、續作與定時資訊

本機預設 shell 曾遇到無輸出的 PowerShell FileSystem provider 問題，node_repl 啟動超時。已驗證可行方式為使用 powershell.exe、login=false，以及窄範圍 require_escalated exec_command；不要重複大量同類失敗呼叫。functions.apply_patch 曾因長時間無輸出被終止且沒有部分寫入；後以小份 PowerShell 檔案替換成功。變更後需檢查 git diff，避免把 .worktrees/ 加入 index。

本聊天曾建立一次性 heartbeat automation 06-55-2：ACTIVE、COUNT=1，排程 2026-10-24 香港時間 06:55，目標是本聊天。建立時讀到帳戶五小時使用窗為 8%，該窗重設時間 06:51 香港時間；此數字是當時快照，不代表目前用量。

中斷後續作步驟：先讀本報告與 plan/status.md，核對 git status -sb、HEAD 和隔離 worktrees；目前 Stage A/B 已完成，下一步 cherry-pick expansion_art 的 pine/cave commits（e79e3ff、74f9ed0），按明確路徑接入兩個新地圖／區域地圖，再實作 crab windup/dash/recovery 與 focused tests。保留 crab source-only，直到有安全切格 atlas；其後接 q09–q11／frost-guide、冰潮首領和舊存檔 idle 測試。每個小階段明確 stage 路徑並單獨 commit。不要推送、發 tag、建立 Release 或上架。