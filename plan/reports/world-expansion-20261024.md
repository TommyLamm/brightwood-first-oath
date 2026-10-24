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

## 2026-10-24 Frost Isles Stage D acceptance snapshot

Main 最新 runtime commit 288693e；q11/item 接線在 87fb9a1、Warden gameplay 在 fa11987。plan/status.md 是唯一狀態板。Stage A/B、C1/C2 與 UI check 的歷史證據保留於上文及狀態板，不重複重跑。

- 霜雪三張可玩地圖與 q09/q10 接線已在 main。q10 claim 後松隘東門開放；Cave 西出口始終可退回 Pine。UI 區域圖顯示真實地圖節點，世界總覽與 q10 lock 曾由 UI 代理 focused 驗收（6/6）。
- fa11987 接入 frost-tide-warden：Cave boss/music、Lv30/HP7600/碰撞72×72、192×192 atlas；交替 frost-tusk-slam 與 low-tide-wave，預警各900ms/1100ms，hit area 分別190×120與380×30。Boss death 開啟專屬結果及重試；結果返回到 Frost Shore。Guardian 的旗標與 q08 流程沒有改動。
- 87fb9a1 接入 q11 與 frost-tide-sword：前置 q10，手動向雪芽接取；擊敗 Warden 後任務 ready，回 Shore 手動 claim 才獎勵一次。新武器攻擊50、Lv30、buyPrice 0、沿用 weapon slot；對比 Guardian sword 攻擊38，高12。新增 atlas manifest visual key 與 32×32 runtime icon key；來源素材及 prompt 保留在既有 art-source。
- SaveData 仍為 format 1，沒有新 flags/欄位。舊存檔缺少 q11 合法且顯示 locked；q08/Guardian flags 不會由 Warden death/retry/claim 寫入。
- Warden gameplay 包已通過 npm.cmd run typecheck、npm.cmd run check:content、git diff --check，以及排除 .worktrees 的 Vitest actors/rules/app-gameplay 3 files／38 tests。
- q11/item 包已通過同樣 typecheck/content/diff checks，以及排除 .worktrees 的 Vitest rules/app-foundation/frost-quests 3 files／17 tests。新增集成測試實際走過 accept→Warden kill→ready→return Shore→manual claim，核對 sword 一次、coins、舊旗標與缺 q11 舊 save。
- q09/q10/Cave/UI 原有 focused 測試已在前段通過，沒有因 q11/item 變更重跑未受影響的 world-map UI suite。
- 集中 browser、當前版本候選確認、build、固定工具 pack/validate 尚未執行；也沒有完整從頭通關證據。下一步先確認未使用版本候選，再以隔離 profile/fixture 集中驗入口、region 切換、boss preview/攻擊/返回/重試、q11 手動獎勵/存檔重載與 runtime 素材。真實 Warden 戰鬥的瀏覽器結果尚未驗證，focused integration 不等於 browser QA。
- 本次 q11/item 開發包於 2026-10-24 香港時間約 07:23 完整讀取根目錄指定 Playroom template 與其七份 main 文件；沿用相對路徑、iframe 子目錄可用與存檔相容原則。不改平台 SDK/schema，不發布/push/tag/Release。

## Stage D candidate and focused acceptance (2026-10-24)

- Versions in local package/game manifests and existing tags were checked: beta.1–beta.5 were already used, so beta.6 was selected and committed in `3b327e1`. This is a local candidate only; no tag, Release, upload or publish was made.
- The first beta.6 browser launch caught a renderer timing contract mismatch for the crab idle row. `799d08f` changed it to the shared 200 ms idle cadence. A subsequent Cave load found Warden idle/dead cadence mismatches; `288693e` set those to the shared 200/100 ms values. `npm.cmd run check:content` passed after these manifest corrections.
- Final `npm.cmd run build` passed (Vite 8.3.4, 62 modules). The pinned tools 1.1.0 pack command produced `artifacts/brightwood-first-oath-1.0.0-beta.6.zip`, and the matching pinned `validate-game.mjs` reported `Valid: brightwood-first-oath v1.0.0-beta.6 (tools 1.1.0)`. The ZIP is 48,494,575 bytes (~46.3 MiB), under the 64 MiB package budget. Build, pack and validation were run once after the final timing fixes.
- Browser acceptance is PARTIAL. It used a disposable, schema-validated q08-claimed / q10-claimed Level 30 fixture, not a from-scratch playthrough or the user's save. The app entered the regional map and Cave; all three Frost Isles nodes and 3/3 explored state appeared in that fixture; the cave environment, crab, Warden and telegraph rendered with zero console errors after the timing fixes. The character later died during timed combat before Warden victory. Browser QA therefore did not verify victory, result/retry, return to Pine/Shore, or manual q11 claim. The isolated save remained format 1, q11 was absent, the existing fixture flags remained true, and reload returned to the title with the Cave location retained. Focused integration tests recorded in the q11 section cover kill → ready → return → manual claim and one-time reward; they are not a substitute for the uncompleted browser path.
- A warning-window capture is retained at `output/playwright/frost-isles-beta6/warden-warning.png`. The task-owned Vite server on port 5193 and named disposable fixture files/logs were removed; the screenshot is kept as evidence. No shared server or real save was touched.
- The browser run exposed the two timing issues above and they were fixed; no other startup or console error remained in the successful Cave load. No full test suite or full playthrough was run.
- Before this Stage D work, the root `AGENTS.md`, the online game-agent template and all seven linked specifications were fully read (around 2026-10-24 07:30 Hong Kong): game-development, command-contracts, game schema, game-release workflow, starter SDK, SDK versioning and save compatibility. Applicable rules were relative asset URLs/subdirectory iframe compatibility, format 1 save compatibility, and pinned build/package validation. No release or platform action was authorized or performed.

## 2026-10-24 Gold Sand Sea Stage A initial snapshot (historical; superseded below)

Gold Sand commits: art c8997ed, playable map/atlas bf2cc2f, required asset-loader contract fix a65b1d9; the beta.6 checks above still apply only to earlier runtime commit 288693e.

- Gold Sand Sea now has one actual map, sand-glass-shore / 琥珀砂岸. The Frost Shore east portal requires q11 claimed and level 30; the west return portal is always open. No SaveData field or format change was made, and q08/Guardian state remains untouched.
- A separate sand atlas scope displays the 960×540 generated route map, the real current-map landmark, region entrance status and cross-region portal line. World and regional node counts derive from actual catalog maps; the future dune-pass and sunwell-basin coordinates do not render as playable nodes until their MapDefs exist.
- Art commit c8997ed adds region-golden-sands-map-v1.png and env-sand-{sky,far,mid}-v1.png; unchanged raw generations, exact prompts and logs are in art-source/expansion-sands/. The map remained readable at 320×180 and the three-layer shore composite was visually checked. Far/mid layers have real alpha; runtime images total about 2.5 MiB.
- Code commit bf2cc2f adds the MapDef and route, map order and validation, relative manifest entries, independent atlas model/view styling, global Frost↔Sand connection, and Gold Sand focused test.
- Checks after content integration: npm.cmd run typecheck, npm.cmd run check:content, npx.cmd vitest run tests/world-map.test.ts --exclude '**/.worktrees/**' (1 file / 7 tests), direct Python manifest/file/dimension/mode/alpha checks for all four runtime images, and git diff --check all passed. The final UI model change was followed by typecheck and the same 7 focused tests. No build, package validation, or browser QA has been run on these Gold Sand commits.
- The entry shoreline is playable exploration content but still has no enemies, NPC, quest, or boss. No complete Gold Sand Sea acceptance is claimed. Before this package, the local AGENTS.md, online game-agent template and all seven linked Playroom specs were fully reread (around 2026-10-24 08:00 Hong Kong); plan/10-asset-spec.md and the imagegen skill were also read.

## Gold Sand Sea Stage B1: scorpion combat prototype

Commit c498dce adds the sand-scorpion Lv30 rules definition, the ranged telegraphed sand-stinger attack, and a guaranteed saleable amber-scale material drop. The scorpion uses a 190px × 44px locked telegraph with an 850ms warning and does not dash; this gives it a ranged tail-sting role distinct from the Frost crab charge. The scale sells for 42 coins and cannot be bought.

The behavior and rules tests use synthetic placements so the new AI can be checked independently of art delivery. The monster is not yet in any real MapDef; the amber-scale icon is integrated, but the actor atlas is not. Loot flow has only been exercised with a test-only spawn, not in a live encounter. Commit c498dce checks passed: npm.cmd run typecheck, npm.cmd run check:content, npx.cmd vitest run tests/rules.test.ts tests/actors.test.ts --exclude '**/.worktrees/**' (2 files / 17 tests), and git diff --check. Follow-up a65b1d9 adds sand sky/far/mid to required asset keys and fixes foundation catalog counts; typecheck and npx.cmd vitest run tests/integration/app-foundation.test.ts --exclude '**/.worktrees/**' (1 file / 10 tests) passed. Test commit 32d204a directly verifies the stinger hits a grounded target while a jumping target avoids the low attack band; tests/combat.test.ts passed 11/11, followed by typecheck. Art commit e10833d is integrated as icon commit 29820ce; 0e2b40b registers it in the interface manifest and requires that key. Four rejected 6×5 scorpion atlas candidates and one rejected 2×2 attack-strip diagnostic are preserved with source notes by source-only commits 7cf3d4a and 6f71d43, integrated as 07382d4 and fac1544. None is a safe runtime image: the strip is non-square/unevenly divisible and has red/coral fringe. The art agent stopped further ImageGen attempts. Commit 3b541f3 adds a test-only sand-scorpion spawn and covers attack→kill→guaranteed amber-scale drop→pickup→merchant sale; targeted Vitest passed 1 test (23 skipped) and `npm.cmd run typecheck` exited 0. This does not add a production MapDef spawn. No build, package validation or browser QA was run.

## 使用者指定的有限續作：三階段與停止條件（取代舊後續方向）

只完成沙蠍 production encounter、第二張 sand-dune-pass 地圖及 q12 手動解鎖、一次集中驗證和提交整合。Stage 3 完成後立即停止；不做 sunwell-basin、首領、第三張地圖、新區域或其他後續內容。保留 SDK/tools 1.1.0、SaveData format 1、q01–q11/Guardian 契約及相對資源路徑。不 push、不建 tag/Release、不上架。

### Stage 1：沙蠍和琥珀甲片正式遭遇

本整合代理負責遊戲程式、manifest/loader、MapDef、focused check、Git 整合與此報告；/root/expansion_art 負責隔離工作樹的 scorpion ImageGen/素材包裝。前次 atlas 均為 rejected source-only，本階段依賴 art worktree 提供可檢視的 runtime 素材。遵循 art agent 的 2×2 clean poses 再技術切格方案，不要求 raw canvas 為正方形；animation 格數依實際獨特姿勢調整，renderer contract 要求 idle 200ms、dead 100ms。

完成條件：正式 actor manifest/required keys 載入 atlas；sand-glass-shore MapDef 有實際 scorpion spawn；玩家能看見 850ms stinger warning、跳躍躲過低尾刺、擊殺後保證取得 amber-scale、拾取並向商人出售。對真實 MapDef encounter 增一項直接相關 integration check。素材可切格、alpha 邊緣乾淨，時間與 anchor 符合 manifest 才接入。

### Stage 2：第二地圖探索與 q12 解鎖

本整合代理負責 sand-dune-pass MapDef、探索迴路/平台、自由回程 portal、atlas/world catalog、q12 條件/獎勵與 focused coverage；/root/sand_scene_art 負責隔離 worktree 的新 ImageGen dune scenery 與 guide/NPC art。收到素材後檢查檔案、像素尺寸、alpha、相對路徑和 runtime manifest 契約；依實際交付與 renderer 支援決定尺寸。

完成條件：由 sand-glass-shore guide 手動接 q12；擊敗可重生沙蠍並取得、交付 3 個 amber-scale，再手動 claim q12 開放 sand-dune-pass。售出材料不軟鎖，正式沙蠍可重生供重取。第二圖有真實探索路徑和自由返回沙岸的出口，不是單純背景或節點。舊 format 1 save 缺 q12 狀態仍能載入並使用合理預設；不改 save format 或既有任務契約。圖像未註冊並在遊戲渲染前，不能標示本階段完成。

### Stage 3：最小集中驗證、分段提交及整合 main

本整合代理負責。依小階段明確 stage/commit；從隔離 art worktree 僅 cherry-pick 通過檢視的素材 commit。保留 .worktrees/，不追蹤、不 stage。

完成條件：直接相關的 typecheck、content check、focused tests 通過（Vitest 排除 **/.worktrees/**）；對最終整合只 build 一次、以 pinned Playroom tools 1.1.0 pack/validate 一次、以隔離 browser profile 做一次路線 smoke：q11/Lv30 入沙岸→打沙蠍→掉落/拾取/出售→接取並完成 q12→進 sand-dune-pass 探索→自由回程。沒實測項目維持 UNVERIFIED。提交整合到 main 並更新 status/report；達成後標記 DONE 並停止。沒有 push/tag/Release/平台發布。

### 基線與依賴

計畫起點 main HEAD 3edb5f7。當時已在 main 的內容是 sand-glass-shore、Frost→Sand 的 q11 claimed + Lv30 gate、amber-scale icon、scorpion AI/低尾刺與 test-only loot/sale integration；尚缺 production spawn、scorpion runtime atlas、sand-dune-pass、q12 與新 dune scenery/NPC。Stage 1/2 art 依賴分別由 /root/expansion_art 和 /root/sand_scene_art 隔離 worktree 負責，不重複生成。本次已完整讀取根 AGENTS 指定的線上模板與七份 main 規格；適用要求包括固定工具/SDK與存檔契約、相對路徑、子目錄 iframe 相容、pack/validate，且不發布。

## Historical implementation snapshot (before accepted art/runtime integration; superseded below)

Commit bb23360 adds three repeatable sand-scorpion spawns on sand-glass-shore, the sands-guide and q12 (manual accept; kill three scorpions, collect and consume three amber scales at claim), plus a q12-gated route to sand-dune-pass. The second map is 2,600px wide, has five platform heights with ladders, four repeatable scorpions and a free return portal. The world validator contracts and existing Gold Sand atlas assertion were updated. git diff --check passed before commit.

No tests, build, package validation or browser run has been performed for this code stage, and neither stage is claimed playable yet. The scorpion runtime atlas and asset-manifest wiring remain pending. The scene-art commit 1112506061ccdde51ffe82b509388135038f50c7 delivered the sky, far/mid canyon layers and guide; review found a bright red/magenta fringe on the far/mid transparent edges, so those two files are withheld while the art agent cleans them. The sky and guide looked clean. Scorpion commits 2a4bba3, 59bdb9b and 36ce331 are source art only; a runtime atlas is still pending.

## Current ownership (2026-10-24 finite Gold Sand task)

- /root owns the finite scope and final QA coordination.
- /root/sand_integration owns runtime/content implementation and focused checks; these are committed on main. The beta.7 candidate build/package is ready. Browser QA is complete; no code follow-up remains.
- /root/expansion_art completed the accepted scorpion source/runtime asset delivery; those commits are integrated on main.
- /root/sand_scene_art completed dune scenery/guide assets, integrated them on main, completed the isolated route smoke and cleaned up its disposable fixture.
- Earlier agent/worktree states are historical. The completed frost interface agent's restriction against world-map edits/tests does not apply to this second-map task. Preserve .worktrees/ and never stage it.
## Tool and handoff notes

On this Windows host use powershell.exe with login=false and narrow require_escalated for short file operations. Vitest commands exclude **/.worktrees/**. Heartbeat 06-55-2 was deleted; the coordinator confirmed the goal remains active and no user resume action was needed. Stage D beta.6 package evidence is historical and applies only to its earlier runtime. The beta.7 candidate and completed browser evidence are below. QA closed only the named sand-smoke session after removing its disposable save key; the shared server was left running. No push, tag, Release, or platform listing.

## 2026-10-24 Gold Sand finite task — final integration and acceptance evidence

The user-defined endpoint remains three bounded stages: production sand-scorpion encounter; the second map sand-dune-pass with exploration, new ImageGen scenery, and manually claimed q12 unlock; then minimum focused validation, commits on main and stop. No third map, boss, new region, follow-on feature, push, tag, release, or listing is in scope.

### Integrated code and focused checks

- Production sand-glass-shore now has three repeatable sand-scorpion spawns. The registered 384×384 RGBA atlas uses 4×4 96px cells with idle frames 0–1 at 200ms loop, four genuine walk frames 2–5 at 120ms loop, attack 6–9, hurt 10–11, and dead 12–15 at 100ms. The loader permits four walk frames only for this actor; it keeps state, timing, loop, cell and index checks. Accepted art/source commits on main: 9c2cfa5, 1222369, cf79fc1 and 2a300f7; production combat/map wiring: f46dcb6.
- The production scorpion has a locked 190×44px stinger warning for 850ms, a jumpable low attack band, and a guaranteed amber-scale drop. The item remains saleable through the existing merchant; there is no new economy system.
- sand-dune-pass is a real 2,600px MapDef with five platform heights, ladders, four repeatable scorpions and an unrestricted west return portal. Sands-guide manually gives q12; the quest requires three scorpion kills and three amber scales to turn in and claim before the east portal opens. Repeatable spawns avoid a softlock if scales were sold. Dune scenery runtime files are 960×540; sands-guide is two 128×128 cells. Main integration commits: bb23360, 4fdcd14, c6fd2d8 and fe7ec30.
- SaveData remains format 1. The focused old-save case accepts missing q12 state; no new format field is required.
- Passed at source commit f46dcb6: npm.cmd run typecheck; npm.cmd run check:content; npm exec -- vitest run --exclude '**/.worktrees/**' tests/integration/app-foundation.test.ts tests/integration/app-gameplay.test.ts tests/persistence.test.ts tests/world-map.test.ts (4 files / 56 tests); git diff --check.
- Two separate app-audio/app-persistence fixture attempts failed because their existing mocked asset manifests omit newer Frost Tide/Amber required keys. They were outside the focused acceptance path, are not reported as passes, and were not changed as part of this task.

### Direct q12 route integration case

Commit 3bdf9f0 adds one end-to-end gameplay-harness case: opens the Sand Dune Pass only after manually claiming the three-scorpion route quest. It uses the actual three sand-glass-shore MapDef spawn definitions; the test brings each target to HP 1 and positions it beside the player to keep this logic-focused harness run short. It sends authoritative acceptQuest, attack, pickup, claimQuest and interact commands. The case verifies q12 remains active/locked until complete, reaches three kills and three scales, stays ready but the portal stays locked before manual claim, consumes all three scales at claim, enters sand-dune-pass, and returns through the free west portal. The only test run for this addition was:

npm exec -- vitest run --exclude '**/.worktrees/**' tests/integration/app-gameplay.test.ts -t "opens the Sand Dune Pass only after manually claiming the three-scorpion route quest"

Result: 1 passed, 24 skipped. npm.cmd run typecheck and git diff --check -- tests/integration/app-gameplay.test.ts also passed. Existing old-save coverage is tests/persistence.test.ts:175, “loads a format-1 save from before q12 existed and derives q12 without rewriting quest state”; it was part of the earlier four-file / 56-test focused run. The earlier run also includes the production-spawn Amber Scale pickup/sale integration case. No full suite was run.

### Candidate package

- Commit 9cf9b3d aligns package.json, package-lock.json and public/game.json at 1.0.0-beta.7 without creating a tag.
- npm.cmd run build passed with Vite 8.3.4 and 63 modules.
- node tools/playroom/pack.mjs dist artifacts/game.zip packed successfully with pinned Playroom tools 1.1.0.
- node tools/playroom/validate.mjs artifacts/game.zip reported Valid for brightwood-first-oath v1.0.0-beta.7 (tools 1.1.0).
- Candidate path: C:/Users/Tommy/Desktop/brightwood-first-oath/artifacts/game.zip. Size 52,258,660 bytes; 171 entries; 55,118,120 uncompressed bytes; SHA-256 93612A00CA3CE260A5DD6BAC8F1E223F1B32B8DBDFD88263E75365B27D83D280. This is below 64 MiB. Nothing was published or uploaded.

### Browser smoke result (route completed; full platform climb unverified)

The smoke used a disposable, validated format-1 Lv30/q11-claimed save with q12 absent at the beginning; it was not a from-scratch playthrough or the user's save. The player accepted q12 in game, initially reached two kills and two scales, and died during the third attempt. Normal Return to Town recovery preserved quest, bag and coin progress. To avoid repeating the old-map journey, the authorized fixture-only step changed only location to frost-shore/left; player stats, HP, inventory and quest data were preserved. This did not verify Town-to-Frost travel.

From Frost Shore the player used the real portal to Sand Glass Shore, defeated the third production sand-scorpion, picked up its guaranteed third amber scale with Z, spoke with Liusha and clicked the real “領取任務獎勵” button. The tracker changed to 自由探索, the guide dialogue confirmed all three scales were delivered and the pass route was open, and gold rose from 2,390 to 3,790. The player entered Sand Dune Pass through its real east portal, made a short safe left/right movement, then used the unrestricted west portal to return to Sand Glass Shore. Final state was q12 claimed/free exploration at Sand Glass Shore, HP 71/660 and 3,790 gold. The browser did not climb a ladder or traverse all five platform levels, and this is not described as a full map traversal or full-game playthrough.

The final browser console contained three messages: zero errors, zero warnings and one Phaser startup info line. Screenshots are retained at output/playwright/sand-beta7/sand-dune-pass-entry.png and output/playwright/sand-beta7/sand-glass-shore-return.png. The earlier death snapshot is retained at C:/Users/Tommy/AppData/Local/Temp/brightwood-sand-smoke/.playwright-cli/page-2026-10-24T02-27-58-671Z.png.

QA cleanup removed only the disposable localStorage key maplewood-swordsman:save:v1:dev from the named sand-smoke session (existed=true, removed=true) and closed that session. The shared server on localhost:5173 was left running; an HTTP HEAD returned 200 after cleanup. No other save data or server was removed.

The actual shop-sale interaction is not claimed as browser-verified; it is covered by the production-spawn Amber Scale integration test in the earlier focused run. Scorpion spawn/AI code was unchanged after the previously recorded beta.7 build, pack and validate. The additional commit 3bdf9f0 contains only a test file, so build/pack were not repeated.

## Final state and stop condition

The finite three-stage task is complete on main: production sand-scorpion encounter; sand-dune-pass, new scenery and manually claimed q12 route; focused validation, beta.7 build/package validation, route smoke and documentation. The implementation/test commit is 3bdf9f0; this final report is a docs-only commit after it. No runtime source changed after the candidate package was built. Final main status: tracked files clean after the report commit, with only the existing .worktrees/ directory untracked and preserved. No publish, push, tag, Release, listing, or platform action occurred. Stop here; no third map, boss, new region or follow-on feature is authorized by this finite task.

## 2026-10-24 新授權有限續作：日井盆地

使用者要求「繼續實作下一個任務」，授權一個有明確停止條件的新包。上一節記錄的 Gold Sand STOP 屬於已完成的前一包，不限制本次新授權；日井盆地包完成後立即停止。

已完整讀取本地 `AGENTS.md`、最新 game-agent template 與七份指定 main 規格（game-development、command-contracts、game.schema、game-release、starter SDK、sdk-versioning、save-compatibility）。本包沿用相對資產路徑／子目錄 iframe 相容、SaveData format 1 舊檔相容；q01–q12 與 Guardian 不變，沒有發布／push／tag／Release／上架授權。

唯一範圍是 `sand-sunwell-basin`「日井盆地」、Lv30 `sunwell-beetle`「日井甲蟲」、保證可出售的 `sunwell-shell`「日井甲殼」（sell 約 55）和 q13。琉砂於 q12 claimed 後供玩家手動接取 q13；砂丘關道的兩個沙蠍點保留、另外兩點改為甲蟲；擊殺兩隻甲蟲後仍須回琉砂手動 claim 才解鎖砂丘東門。沒有物品交付。第三圖約 2,800px，具安全入口、主地面、上層平台與梯路、中央日井遺跡、甲蟲／沙蠍混合遭遇及永遠開放的西側回程。區域圖只把新增真實 MapDef 顯示成節點。

甲蟲沿用 Frost Crab 既有 bounded charge 行為與參數（750ms 預警、250ms active、最多 220px）：預警時鎖定方向，既有命中、map wall、map edge 與 spawn roam 裁切保持一致，警示路徑對應衝鋒攻擊路徑；新增甲蟲專屬技能資料，不複製沙蠍尾刺，也不新增 combat framework。美術契約為環境三層 sky/far/mid；甲蟲 384×384、4×4 個 96px 格（idle 0–1／walk 2–5／attack 6–9／hurt 10–11／dead 12–15），walk 格須為真實獨特姿勢，idle 200ms、dead 100ms，runtime 96×96、collision 約 52×42；甲殼 icon 128×128 RGBA，runtime 32×32。walk 四格特例僅給甲蟲，既有沙蠍檢查不放寬。

`/root/sunwell_integration` 擁有全部 main 程式、manifest、文件及測試；`/root/sunwell_environment_art` 與 `/root/sunwell_beetle_art` 各自在隔離 worktree 交付素材。素材代理等計畫 commit 後開始生成。最小驗收是一個以實際 catalog spawn 的 q13 路線案例（q13 缺席舊 format 1 save、門在手動領獎前鎖定、兩次擊殺、claim、進圖和自由回程），及需要時一個 charge 碰撞／牆面／單次命中案例；另跑相關 typecheck、content、focused tests、diff check。固定工具 1.1.0 pack/validate 與 build 各一次，待來源和 metadata 穩定後執行；不跑 full suite、不發布。詳細範圍、責任、acceptance 和停止條件見 `plan/status.md` 新增的「日井盆地有限續作」。

## Sunwell Basin final acceptance (2026-10-24)

The newly authorized finite packet is complete. It adds the production Sunwell Beetle encounter to Sand Dune Pass, the q13 manual unlock route, the real Sunwell Basin map with mixed encounters and free west return, the beetle atlas, and a guaranteed saleable Sunwell Shell. Gold Sand's earlier STOP described its completed packet; this packet is now complete and stops here.

The integration commits are 3752c0c, 467d335, 3466add, 6c0917a, b569cb0, 744bb0c, 43683b1, 2387678, 49df6af, cd6bc02, cd62ac5, c28a9d4, 3ee429b, 1d4a9a4, b9a7c65, 70cf742 and 37a5dc7. The -130px far-layer translation in 70cf742 exposed a sky gap beneath the terrain and was replaced by a Sunwell-far-only vertically scaled, bottom-anchored layer in 37a5dc7. Root accepted the final fixed screenshot: the canyon reaches the floor with no sky strip, and the turquoise pool and broken sundial ring remain visible; the platform naturally occludes some lower details. No further visual edits were made.

### Production behavior and focused checks

q13 is offered by the existing Liusha NPC after q12 is claimed. The player manually accepts it, defeats two Sunwell Beetles in Sand Dune Pass, and manually claims it to unlock the east gate; there is no item turn-in. Two production scorpion spawns remain in the pass and two are beetles. SaveData remains format 1, a save without q13 remains valid, and q01–q12 plus Guardian behavior remain unchanged. Sunwell Shell is guaranteed from the beetle, sells for 55 through the existing shop path, and is not buyable.

The Beetle reuses the Frost Crab bounded charge parameters and rules: a 750ms warning, 250ms active interval, maximum 220px travel, locked direction, matching warning path, one hit, wall/map bounds and spawn-roam limits. The 384×384 atlas uses sixteen 96px cells with idle 0–1 at 200ms, walk 2–5, attack 6–9, hurt 10–11 and dead 12–15 at 100ms. Runtime display is 96×96 with 52×42 collision. Environmental layers are 960×540. Source art, prompts, hashes and exporter provenance are retained.

Focused checks passed: the production-catalog q13 route case reported 1 passed / 25 skipped and covered an old format-1 save missing q13, manual accept, two production beetle kills, manual claim, locked/unlocked gate, Basin entry and free return. Relevant bounded-charge actor/combat cases passed. The app-foundation integration file passed 12/12. npm.cmd run check:content passed. npm.cmd run typecheck passed after the final renderer change at 37a5dc7. No full suite was run.

### Browser evidence and limits

The single route smoke on beta.8 used a disposable format-1 Lv30 fixture with q13 already preseeded as claimed; it was not a from-scratch q13 playthrough. It confirmed the Basin rendered, a short movement worked, and the free west portal returned to Sand Dune Pass. Console inspection reported zero errors and warnings and one Phaser info message.

After the renderer fix, a separate one-image check loaded the same kind of disposable q13-claimed fixture at Basin/left and captured the corrected far-layer framing. That check only confirmed the pool/ring visibility and absence of the sky gap; it did not include movement, a route or console inspection. Captures: .playwright-cli/page-2026-10-24T05-10-11-806Z.png and page-2026-10-24T05-13-14-795Z.png for the earlier route smoke, and .playwright-cli/page-2026-10-24T05-23-42-149Z.png for the final visual check. The disposable fixture and backup marker were removed, the named browser session was closed, and shared port 5173 was left running.

### Final package and stop

After the accepted 37a5dc7 renderer change, one final npm.cmd run build completed; node tools/playroom/pack.mjs dist artifacts/game-beta8.zip packed successfully, and node tools/playroom/validate.mjs artifacts/game-beta8.zip reported Valid for brightwood-first-oath v1.0.0-beta.8 using pinned tools 1.1.0. The final archive is 53,523,653 bytes with 176 entries and 56,394,472 expanded bytes; SHA-256 is B60943E1ABFBBDD611A7452A736634AAB525009618619F0ECC2A3290914C5537. It is below 64 MiB. The previous beta.7 archive remains at artifacts/game.zip.

The task is complete on main. The two canonical progress documents are being finalized in the closing documentation commit. The existing .worktrees/ directory is preserved and was not staged. No publish, push, tag, Release, listing or platform action occurred. Stop after this finite packet.

## 2026-10-24 新授權有限續作：日井守衛終章

日井盆地包的前一節「在此停止」是已完成上一包的歷史停止點，不限制使用者授權的本次新包。這是一個新有限任務；完成下列明確內容後停止，不延伸下一個目標。計畫在兩份 canonical 文件中先行提交；該 commit 完成前，素材代理不得生成。

### 固定範圍與玩法

新增第四張黃金沙海地圖 `sand-sunwell-altar`「日井祭壇」，作為既有 `sand-sunwell-basin` 東側的小型獨立首領場。祭壇約 1,400px、平坦地面、入口安全且只放一名首領；沿用已接受的 Sunwell 背景主題，不需要新增環境素材。祭壇西門無鎖返回盆地。盆地仍為 `boss: false` 普通探索圖，原有四個普通怪生成點與西門回砂丘關道維持不變，只新增通往祭壇的東門。region atlas 增列真實 MapDef 祭壇節點，不虛構其他地圖。

新增 Lv30 日井守衛 `sunwell-sentinel`：砂岩人形石像、青綠核心、砂金紋、以雙巨拳重擊。沿用霜潮守望獸的可讀單區域重擊節奏：900ms telegraph、100ms active、850ms recovery，攻擊矩形 190×120，傷害倍率 1.3。邏輯碰撞 72×84。它使用既有 boss map 結果、再戰與離場流程，死亡可由同一場地重新挑戰；不使用、不修改 Guardian flags，也不增加新戰鬥框架。

琉砂在 q13 claimed 後可供玩家手動接 q14。q14 要求祭壇擊敗一次日井守衛；擊殺後只成為 ready，玩家必須回琉砂手動領取才獲得 1,800 金幣與日井誓刃。沒有物品 turn-in。日井誓刃為 Lv30、ATK 58、weapon slot、不可購買；以同級唯一武器訂合理出售價。任務狀態 claimed 後不可再領取，重戰首領也不重複支付任務獎勵。

SaveData 保持 format 1，不新增持久化首領旗標。舊 format-1 存檔沒有 q14 欄位時照常載入；q01–q13 與 Guardian 流程、flags 均不變。素材使用相對路徑及現有 manifest/loader 契約。

### 素材責任與接線順序

`/root/sentinel_actor_art` 負責首領身分、idle/walk/hurt/dead 姿勢與最終 atlas 組裝；先把角色身分交 `/root/sentinel_reward_attack_art`。`/root/sentinel_reward_attack_art` 負責四張連續重擊姿勢、日井誓刃 icon 和裝備 sprite，再把攻擊 poses 交給角色代理組進 atlas。保留原始稿、完整 prompts、生成日誌與匯出紀錄，整條 provenance/runtime commit chain 都需整合。

最終首領圖固定 384×384、4×4 格、每格 96px；actors manifest 為 display 192×192、pivot 0.5/1、collision 72×84。格位依序為 idle 0–1（200ms loop）、walk 2–5（120ms loop）、attack 6–9（non-loop、配合重擊動作）、hurt 10–11（100ms non-loop）、dead 12–15（100ms non-loop）。原 actor animation contract 要求一般首領 6 格 walk，因此本包只為 `actor:sunwell-sentinel` 加一個 4 格 walk 白名單，保留其他角色與沙蠍／甲蟲的既有檢查。

日井誓刃素材含 128×128 RGBA UI icon（runtime 32×32）與獨立透明 64×64 裝備 sprite。前者註冊於 interface manifest，後者註冊於 actors manifest；ItemDef 的 iconKey 與 visualKey 同時使用，確保背包顯示及裝備後場景可見。

### 實作、驗收與停止

本整合代理擁有唯一 main 程式、content、manifest、focused tests、Git 整合及兩份 plan 文件。第一個 mutation 只更新本報告與 `plan/status.md` 並 commit；提交後通知素材代理開始。素材只從隔離 worktree cherry-pick 通過檢視的 commit，不 stage `.worktrees/`。

新增一個最小 focused gameplay case，使用實際 world catalog／MapDef production spawn，並以 HP=1 harness 控制耗時。驗收 q13 claimed 門檻與進出祭壇、舊 format-1 檔缺 q14 狀態、手動接取 q14、擊殺一隻首領後任務 ready 但未先發物品／金幣、回琉砂手動 claim 正好取得一把誓刃與 1,800 金幣、二次 claim 不重獎、重戰擊殺不多獎、Guardian flags 保持原值、祭壇免費返回盆地。若必要，另加重擊 telegraph／active hit 的單一 focused case。

只跑直接相關 typecheck、content check、Vitest focused tests（固定排除 `**/.worktrees/**`）與 diff check；不跑全套測試。beta.9 metadata 只在內容及來源穩定後更新一次，最後 build 一次並用固定 Playroom tools 1.1.0 pack/validate 一次，產出 `artifacts/game-beta9.zip`，保留 beta.8 ZIP。root 另安排一次隔離 browser 短 smoke，只核對首領顯示、短預警及無鎖返回；不做長戰或全任務遊玩。完工記錄真實驗收與未驗證項目後即停止；不 push、tag、Release、上傳或發布。
