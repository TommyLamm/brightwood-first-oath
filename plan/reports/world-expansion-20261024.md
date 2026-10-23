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

C1/C2, guide, route-map UI/art, q09/q10 and Warden atlas provenance/runtime are committed on main. Latest content commit is 445559f; regional-map UI commit is 3ec2b8d. Pine/cave scenery, crab atlas, ice-shell icon, and guide details are inventoried below.

- C1 frost-pine-pass is playable (b457c2e). C2 frost-crab bounded charge and ice-shell drop is committed (a034dba); atlas registration is fe3f23a/6c28d21.
- Guide sprite/runtime is 0e6a333 and NPC wiring 5be355c. Route-map art is 3c78f01; regional-map UI is integrated as 3ec2b8d and renders its regional selection with the existing map action.
- q09 and q10 manual quest flows, costs/rewards, and the q09 Coast→Pine gate are committed in 445559f. Pine→Coast return remains open. The q10 flow consumes four ice-shells after six crab kills. No Cave map or q10 route gate exists yet.
- Cave scenery is already integrated (06e884d). Warden provenance and runtime atlas are integrated on main as 4b5d3d9 and 3134390 (original commits 8767a17→8e4c87e); atlas is 1632×1360, six by five, 272px cells, runtime 192px. Warden gameplay is not wired yet.
- One-time heartbeat 06-55-2 ran at 2026-10-24 06:55 Hong Kong time and was deleted after firing. Quota then reset to 1% used at 06:55; ordinary usage was allowed. Earlier 8% / 06:51 readings are historical only.

q09/q10 checks recorded from their implementation: typecheck and content validation passed. Focused Vitest covered frost-quests, quests, journal-selection, and app-foundation; initial run passed 3 files/23 tests with one journal expectation failure; after fixing reachable objective locations, typecheck and journal-selection passed (1 file/3 tests). The other three files passed in the initial run. The focused commands excluded .worktrees to avoid duplicate discovery. No build or browser run was made for q09/q10. C2 actor/combat checks remain as previously recorded (2 files/18 tests, plus typecheck/content). Regional-map UI check, run by its agent on base commit 445559f before its UI-only commit d978ab4: typecheck and six world-map focused tests passed. The commit is integrated as 3ec2b8d; checks were not repeated after cherry-pick. Do not repeat checks unless related code changes.

## Next implementation slice

1. Add frost-tide-cavern as the third playable Frost Isles map. Pine→Cave requires q10 claimed; Cave→Pine is always open, preserving a safe return for existing or older saves.
2. Keep world-map UI files with the UI agent. Add focused coverage for the new node, q10 gate, free return, and existing save format 1.
3. Implement frost-tide-warden with its own encounter/retry state and two telegraphed attacks. Add q11 so only manual claim records Frost Isles completion and grants frost-tide-sword once; preserve q08/guardian flags and save format 1.
4. Integrate the sword icon when delivered, then run one concentrated browser route on an isolated fixture/save. Report clearly that the fixture does not represent a fresh playthrough.
## Agent, worktree and art status

- /root coordinates and supplies prompts; /root/game_expansion owns content/runtime code, focused checks, Git integration, and this report.
- /root/expansion_art uses .worktrees/expansion-art / codex/expansion-art at 8e4c87e. Warden provenance/runtime is already on main. Sword sprite sources, transparent edit, export script, and 64×64 RGBA runtime candidate are untracked in art-source/expansion-frost/sword/ and public/assets/equipment/; source log/commit and icon are pending. Preserve this WIP; do not clean or copy it before handoff.
- /root/frost_interface_art delivered regional-map UI commit d978ab4; integrated on main as 3ec2b8d. The four-file UI/model/style/test change is complete and agent worktree .worktrees/frost-region-map / codex/frost-region-map is clean at d978ab4. The agent reports no additional controller/manifest wiring; UI uses the existing select-map action and relative route-map asset (3c78f01). It awaits frost-tide-cavern content for a focused third-node/q10-lock check. Older .worktrees/frost-interface-art remains clean at 2b4bb2a.
- The main checkout has only the untracked .worktrees directory unless later status reports say otherwise. Stage explicit files; never use git add ..
## Tools, heartbeat and resume

The default sandbox shell previously stalled; the verified local method is powershell.exe with login=false and a narrow require_escalated exec_command. functions.apply_patch stalled without modifying files; small PowerShell edits worked. Do not repeat failed startup checks or broaden diagnostics. Focused Vitest commands must include --exclude "**/.worktrees/**"; the earlier inflated file counts likely included the other worktrees.

Heartbeat 06-55-2 ran at 2026-10-24 06:55 Hong Kong time and was deleted after firing. Quota then showed 1% used with ordinary usage allowed; the prior 8% / 06:51 reading was historical.

To resume: read this report and plan/status.md, inspect git status --short --branch, HEAD, and git worktree list. Main checkpoint is 3ec2b8d; content baseline is 445559f. Warden integration is complete in 4b5d3d9 and 3134390; regional UI is integrated in 3ec2b8d from d978ab4. Do not cherry-pick integrated art/UI again. Continue with Cave map/q10 route, Warden gameplay/q11 and sword reward, then one isolated browser review of the complete region. Preserve user data. No push, tag, Release, or platform publication.
