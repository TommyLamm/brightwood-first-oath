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

## 2026-10-24 Gold Sand Sea Stage A current snapshot

Main runtime commits: art c8997ed, playable map/atlas bf2cc2f; the beta.6 checks above still apply only to earlier runtime commit 288693e.

- Gold Sand Sea now has one actual map, sand-glass-shore / 琥珀砂岸. The Frost Shore east portal requires q11 claimed and level 30; the west return portal is always open. No SaveData field or format change was made, and q08/Guardian state remains untouched.
- A separate sand atlas scope displays the 960×540 generated route map, the real current-map landmark, region entrance status and cross-region portal line. World and regional node counts derive from actual catalog maps; the future dune-pass and sunwell-basin coordinates do not render as playable nodes until their MapDefs exist.
- Art commit c8997ed adds region-golden-sands-map-v1.png and env-sand-{sky,far,mid}-v1.png; unchanged raw generations, exact prompts and logs are in art-source/expansion-sands/. The map remained readable at 320×180 and the three-layer shore composite was visually checked. Far/mid layers have real alpha; runtime images total about 2.5 MiB.
- Code commit bf2cc2f adds the MapDef and route, map order and validation, relative manifest entries, independent atlas model/view styling, global Frost↔Sand connection, and Gold Sand focused test.
- Checks after content integration: npm.cmd run typecheck, npm.cmd run check:content, npx.cmd vitest run tests/world-map.test.ts --exclude '**/.worktrees/**' (1 file / 7 tests), direct Python manifest/file/dimension/mode/alpha checks for all four runtime images, and git diff --check all passed. The final UI model change was followed by typecheck and the same 7 focused tests. No build, package validation, or browser QA has been run on these Gold Sand commits.
- The entry shoreline is playable exploration content but still has no enemies, NPC, quest, or boss. No complete Gold Sand Sea acceptance is claimed. Before this package, the local AGENTS.md, online game-agent template and all seven linked Playroom specs were fully reread (around 2026-10-24 08:00 Hong Kong); plan/10-asset-spec.md and the imagegen skill were also read.

## Gold Sand Sea Stage B1: scorpion combat prototype

Commit c498dce adds the sand-scorpion Lv30 rules definition, the ranged telegraphed sand-stinger attack, and a guaranteed saleable amber-scale material drop. The scorpion uses a 190px × 44px locked telegraph with an 850ms warning and does not dash; this gives it a ranged tail-sting role distinct from the Frost crab charge. The scale sells for 42 coins and cannot be bought.

The behavior and rules tests use a synthetic map placement so the new AI can be checked independently of art delivery. The monster is not yet in any real MapDef, and the actor atlas/icon are not in runtime manifests; therefore no live encounter or loot is claimed. Relevant checks passed: npm.cmd run typecheck, npm.cmd run check:content, npx.cmd vitest run tests/rules.test.ts tests/actors.test.ts --exclude '**/.worktrees/**' (2 files / 17 tests), and git diff --check. No build, package validation or browser QA was run.

## Next implementation slice

1. Integrate the pending scorpion atlas and amber-scale icon, register them in manifests, then spawn the scorpion on sand-glass-shore. A focused integration check should cover its attack, death drop, pickup and sale before calling the encounter playable.
2. Complete the Gold Sand Sea in small slices: add sand-dune-pass with its own behavior and a short manual challenge, followed by sand-sunwell-basin and a readable boss telegraph/one-time reward. Keep q11 as the unlock to the region, always allow return, and do not raise the level cap.
2. After the content/art route is complete, select an unused version (beta.7 or later only after checking manifests/tags), run one build and pinned pack/validate, then one isolated browser route. The earlier beta.6 package checks do not cover commits c8997ed/bf2cc2f. Frost browser combat remains PARTIAL; do not call its q11 claim or full route browser-verified.
3. Before each new development package, reread the required online template and its seven linked specifications, state requirements/acceptance, and define the image prompt/path contract. Preserve format 1 saves and q01–q11/Guardian behavior; focused checks only. No push, tag, Release or platform listing.
## Agent, worktree and art status

- /root 是協調代理；/root/game_expansion 在 main 獨占 content/runtime code、Git 整合、focused checks 與本報告。
- /root/expansion_art 的 worktree .worktrees/expansion-art／codex/expansion-art 現正處理 Gold Sand sand-scorpion atlas 與 amber-scale icon；最新已知 HEAD 3e6643a，尚無 Gold Sand 圖像 commit。長鋒 sprite 原 commit 00fa553 已整合為 7838c1d，icon commit 3e6643a 已整合為 7137479；Warden source/runtime 整合為 4b5d3d9／3134390。
- /root/frost_interface_art 的 worktree .worktrees/frost-region-map／codex/frost-region-map 位於 8301ef5；代理回報 clean。UI commit 3ec2b8d 與 focused test commit 8301ef5（main cherry-pick 後為 9c88e5c）已整合；不要重挑 8301ef5 或改 world-map model/view/style/test。
- 舊 .worktrees/frost-interface-art／codex/frost-interface-art 位於 2b4bb2a，保留不清理。未追蹤 .worktrees/ 亦保留。
- 本報告與狀態板最新 docs checkpoint 為 e5110db；Frost beta.6 runtime 為 288693e，Gold Sand commits 為 c8997ed/bf2cc2f/c498dce。文件 checkpoint 只 stage plan/status.md 與本 report。

## Tools, heartbeat and resume

PowerShell 的有效方法是 powershell.exe、login=false、窄範圍 require_escalated；普通 sandbox shell 曾卡住，apply_patch 曾卡住，故小文件使用 PowerShell。Vitest 一律使用 --exclude "**/.worktrees/**"，避免隔離工作樹中的測試副本被混入。

Heartbeat 06-55-2 已於 2026-10-24 香港時間 06:55 執行並刪除，沒有待執行喚醒。用量恢復點曾回報 1%、ordinary usage allowed；goal 狀態仍可能回報 usageLimited，工具無法代為 resume，如中斷請使用者輸入 /goal resume。beta.6 build/pack/validate 只驗至 runtime commit 288693e，Gold Sand commits c8997ed/bf2cc2f/c498dce 尚未重新打包或 browser QA；等沙海內容完成後再做下一候選的一次集中驗證。Frost browser 仍為 PARTIAL；若再測僅補首領結果／重試／回岸／q11 手動領獎。禁止推送、發布、tag 或 Release。
