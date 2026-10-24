# 實作狀態板

2026-10-18 repository 更新：Public repository [TommyLamm/brightwood-first-oath](https://github.com/TommyLamm/brightwood-first-oath) 的 main 已推送，[v1.0.0-beta.1 預發布 Release](https://github.com/TommyLamm/brightwood-first-oath/releases/tag/v1.0.0-beta.1) 已建立，唯一 `game.zip` 已上傳；GitHub workflow 建置／固定工具驗證／pack／validate 全部成功。三個已完成工作樹與臨時分支已清除，原提交歷史保存在 main；尚未追蹤的計畫、來源原稿與預覽已補提交。實際結果見 [GitHub 發布報告](reports/github-release-20261018.md)。下方先前「沒有 tag／Release」是候選驗收當時的歷史狀態。Playroom 尚未上架。

由主 Agent 統一維護；經主 Agent 明確授權的實作代理可更新自己負責的工作段。建立計劃不算實作完成。狀態：NOT_STARTED → READY → IN_PROGRESS → PARTIAL／BLOCKED／REVIEW → DONE。缺驗收標 UNVERIFIED，不寫 PASS。

## 2026-10-24 霜雪群島擴充（IN_PROGRESS）

- Stage A 已實作：新增 frost-shore「雪痕海岸」，q08 領獎後可由 Guardian Arena 前往，回程不設任務鎖；補入 world map 地標與探索進度、mapOrder、地圖驗證、frost 背景主題及格式 1 存檔相容測試。
- Stage A 最小檢查 exit 0：npm.cmd run typecheck、npm.cmd run check:content、git diff --check；指定 world-map、persistence、app-foundation 測試檔後，Vitest 回報 9 files／74 tests passed。此命令輸出比預期測試檔數廣，未再重跑。
- Stage A 實作 commit：f347c76；素材接入 commit：97be61e（sky，原始 7121210）、f632528（far/mid，原始 a5d86d3）。未推送，沒有建立 tag／Release 或發布。
- Stage A 當時尚無怪物、亦未做瀏覽器驗收；此為該階段快照，已由下方 Stage B 更新。
- 後續方向：延續為 frost-shore → frost-pine-pass → frost-tide-cavern；再加入差異化短衝刺敵人、可躲預警首領與區域手動任務，維持等級上限 30、桌面單人劍士和格式 1 存檔。
- 本輪唯一追蹤報告：reports/world-expansion-20261024.md。

| 包 | 狀態 | 擁有者 | 輸出／下一步 |
| --- | --- | --- | --- |
| T00 | DONE | 本輪整合代理 | G0、共用契約與根設定完成；T00-09 已隨四包 canonical manifests／素材交付收尾。遊戲接合另由 T14/T16 驗收 |
| T01 | REVIEW | T01 package | 規則、物品、技能、怪物資料與局部測試已交付，待整合驗收 |
| T02 | REVIEW | T02 package | 移動核心及 15 項局部測試已交付，待手感／遊戲整合驗收 |
| T03 | REVIEW | T03 package | 戰鬥核心及死亡清理交接已交付，未驗收完整路線 |
| T04 | REVIEW | T04 package | 成長、背包、經濟 domain 已交付，待 app/主線整合驗收 |
| T05 | REVIEW | T05 package | 七地圖與八任務資料/核心已交付，未做全套跨表建置驗收 |
| T06 | REVIEW | T06 package | actor/boss 核心及局部測試已交付，待 T14 實際遊戲整合 |
| T07 | PARTIAL | T07 renderer | renderer／anchor／quest marker／VFX source 已合入；本輪有限瀏覽器看過角色、武器、場景與標記。完整動作、地圖／技能視覺及路線驗收仍未完成 |
| T08 | DONE | T08 UI | 桌面 UI package 已交 T14；完整 app/遊戲驗收仍由 T14/T16 負責 |
| T09 | REVIEW | T09 persistence | 存檔核心與格式驗證已交付，待整合/cloud 環境驗收 |
| T10 | DONE | T10 assets | 素材22 images／64 animations＋96 hero anchors；缺圖已由原ImageGen稿匯出補齊；遊戲接合未驗證 |
| T11 | DONE | T11 assets | 素材20/20 keys；platform／slope由原ImageGen稿確定性匯出入庫（`4765c45`）；遊戲接合未驗證 |
| T12 | DONE | T12 assets | 素材47 images／5 VFX animations；heavy-strike v9匯出入庫（`0520204`）；遊戲接合未驗證 |
| T13 | REVIEW | T13 audio | 16 個原創 WAV/controller 已交付；瀏覽器解碼、播放與生命週期未驗收 |
| T14 | PARTIAL | 本輪整合代理 | app／T07／T08 已整合；有限正常瀏覽器路線到 q01 2/3，讀檔、Esc、正式 UI icons 與 iframe input 有限驗證。真實音訊播放及完整路線仍 UNVERIFIED |
| T15 | DONE | T15 package | 正式 gameplay cover、119-entry ZIP、官方 pack/validate、hash／entry／機密掃描已完成；證據見 `artifacts/T15-package-evidence.json` |
| T16 | PARTIAL | 本輪整合代理 | typecheck/build/content、T15 archive、cross-origin `/dist/` iframe、sandbox/allow、960/640 resize 已完成；完整主線、fullscreen、雲端與 FPS 未驗證 |

## 2026-10-18 候選與驗收更新

- main runtime candidate 為 commit `56ec0fe`。`npm.cmd run typecheck`、`npm.cmd run build`、`npm.cmd run check:content` 各執行一次且 exit 0；build 另有 Vite 大 chunk 建議警告。未重跑完整測試套件。
- T15 以 `56ec0fe` 的 `dist/` 產生 `artifacts/game.zip`：`brightwood-first-oath` v`1.0.0-beta.1`、tools `1.1.0`；官方 pack/validate 通過。119 entries、36,361,975 bytes、SHA-256 `13920DD169E1852DF200DFA8416A85D6268A179342ECB45C9C6CAEE3D68CE875`；T15 機密／可疑檔名掃描無命中。完整紀錄見 `artifacts/T15-package-evidence.json`。
- 單一 Vite server `http://127.0.0.1:5173/` 與 hidden IAB：建立 `旅人`、正常接取 q01，真實擊殺計數到 2/3；reload 後「繼續冒險」恢復 EXP 20/55、角色、地圖與道具，續玩後進度到 2/3。Esc 關閉任務面板、官方 interface icons、角色武器／場景有限視檢通過。未完成 q01 第三擊、森芽回報／獎勵，也未走 q02–q08；沒有計時或宣稱 45–60 分鐘。
- 同一 server 以 `http://localhost:5173/dist/` 載入不同 origin 子目錄 iframe，`sandbox="allow-scripts allow-same-origin allow-pointer-lock"`、`allow="fullscreen; autoplay; gamepad"`。production 首屏可載入，960×540 與 640×360 顯示正常；暫時遊玩中 ArrowRight、J、Esc 與普攻可操作。CUA 沒有此頁的 browser-console logs capability；Vite server log未見錯誤，只有 production dynamic-import analysis warning。瀏覽器 console clean、可聽見 WAV／音訊 lifecycle、fullscreen／平台退出、真實 Playroom account/cloud、FPS／完整路線均維持 UNVERIFIED。
- T14-22、T14-25、T16-04/05/07/08/09 未完成。T16-06 只完成跨 origin／子目錄、sandbox/allow、尺寸及基本輸入子集；未完成 console、音訊或全套平台矩陣。沒有 tag、Release 或平台上架。

## 契約

文件契約 v1；T00 共用骨架與契約已落地並開放 G0。2026-10-18 最新素材同步：T10–T12素材檔已完整，actors22 images／64 animations＋96 anchors、environment20 images、interface47 images／5 animations；本次只完成素材，不宣稱遊戲接合通過。變更記日期、原因、受影響包及接線處置。

## 檢查與阻塞

本次只完成素材：經使用者明確授權，復原既有ImageGen原稿並保留裁切／重排／最近鄰縮放／清邊alpha腳本。新素材完成視檢，離線素材audit通過檔案存在、相對路徑、key唯一、切格、動畫引用、96個anchors、各包體積及新圖16px安全邊／binary alpha。應用程式loadRequiredAssetManifests以本地JSON檔案讀取通過四包（audio沿用既有16 entries）。詳細證據見[素材交付報告](reports/asset-recovery-20261018.md)。

（歷史紀錄）截至素材復原報告建立時，本輪 build、typecheck、瀏覽器、pack/validate 與 iframe 驗收尚未執行，當時亦沒有候選封面或 ZIP。以上結論已由本節 2026-10-18 候選與驗收更新取代；完整路線、真實音訊播放、雲端、fullscreen 與平台發布仍未驗證。

2026-10-18 主線節奏補充（package-level 靜態估算，非完整路線試玩）：T01/T03 估算 41 隻必需敵人的高輸出攻擊窗約 58.55 秒（首擊至末擊理想下界約 55.60 秒）；普攻-only 配置約 790.56 次攻擊、約 7.20 分鐘理想連續攻擊。T02 前向地圖走訪為 11,110 px／約 79 秒；T02/T05 代表任務路線約 34,340–35,140 px／約 4.1–4.2 分鐘無阻走路。估值不含完整追敵、互動、選單、失誤、操作與實際戰鬥節奏，不能相加宣稱通關時間；目前沒有證據支持 45–60 分鐘，模型顯示主線很可能偏短。各包依 08 等待整合可玩路線的代表性實測再集中調節奏；T14-25 仍未執行，主線時長未驗證。

2026-10-18 素材復原補充：T10 `actor:hero-cloth` v8（1254×1254，非 8×8 可切尺寸且有彩色柔邊）、T11 `env:tile-platform` cedar-plank one-shot（2172×724，尺寸、頂邊、gutter、接邊失敗）、T12 `vfx:heavy-strike` v7（6×1 尺寸可切但前五格透明內縮 0–3px、低 alpha 與紅邊）皆只保留 source-only。最後 T12 v8 one-shot 仍為 2172×724（3:1 而非 6:1），六格安全邊未達16px、79,683個半透明像素且有紅／粉邊；拒絕後依使用者指示停止素材重試，未加入runtime／manifest。T11 在中止前產生 stone-timber source 候選，但未完成檢視，仍未驗收且不計coverage。T07 terrain geometry focused check commit `a118ab6` 通過8項測試及 renderer-only strict tsc；素材驗收仍待完整資產。canonical coverage 仍為 actors 部分清單、environment 18/20、interface 46 images／4 animations，T14 啟動素材閘門未解除。細節見各包最新 reports 與 source logs。



2026-10-18 本次素材復原完成：下方／前段歷史紀錄中的source-only結論是指未處理原稿，已由本次使用者授權的確定性匯出解除缺圖；原稿仍保留，正式使用新版本PNG與更新manifest。素材完成不等於T14/T16遊戲驗收完成。

2026-10-18 T00-09 收尾：四包正式 manifest／素材齊全（actors 22 images／64 animations＋96 anchors、environment 20 images、interface 47 images／5 animations、audio 16 entries），asset-recovery 報告已記 `loadRequiredAssetManifests` 以本地 JSON 通過。T00 標 DONE。T14 音訊接線已在 app；仍需 T07 將正式角色／地形／VFX 呈現接到實際遊戲並檢查腳底、anchors、動作節拍，另以瀏覽器驗證 WAV 播放。T14-25 完整 45–60 分鐘路線未跑，時長仍 UNVERIFIED；T15 截圖／封面／ZIP 及 T16 驗收未完成。沒有 build、typecheck、測試、瀏覽器、pack/validate 或發布的新結果。

## 2026-10-24 Stage B／瀏覽器集中檢查更新（IN_PROGRESS）

- Stage B 已提交：9f90269 新增 Lv30 霜牙雪狼、海岸三處生成、保證掉落霜牙（可向既有商人出售，35 金幣）；未變更存檔格式。狼 atlas 接入為 61db462，來源為素材代理 commit d54fdd0，229×229 cell 的 6×5 atlas，runtime 96×96。
- 已接入素材：霜牙圖示 be6958d（原始素材 commit 1108e25，128×128 RGBA，runtime 32×32）；雪岸地區卡 87fbd08（原始素材 commit aba7c7c，960×540 opaque）。先前雪岸三層環境在 97be61e、f632528。
- Stage B 直接相關檢查均 exit 0：npm.cmd run typecheck、npm.cmd run check:content、npx.cmd vitest run tests/rules.test.ts tests/world-map.test.ts tests/integration/app-gameplay.test.ts tests/integration/app-foundation.test.ts（12 files／117 tests passed）、git diff --check。未跑全套回歸或完整 build。
- 瀏覽器檢查為 PARTIAL：使用隔離 Playwright profile 的人工 q08 claimed、Lv30 劍士 fixture；成功載入雪痕海岸、reload 後從標題續玩並恢復地點、世界圖列出已探索 8/8 與海岸詳情、顯示狼與場景素材、使用「返回城鎮」抵達木葉鎮。畫面觀察到霜狼攻擊，fixture HP 660 降至 419。自動化操作未擊殺狼、未在 browser 驗掉落；狼戰鬥／必掉霜牙／拾取／出售由上述 focused integration test 覆蓋。此 fixture 起點是人工構造的 q08 完成存檔，不代表從頭通關；未完整走祭壇傳點往返。
- 隔離存檔 key maplewood-swordsman:save:v1:dev 已刪除，Playwright session frost-shore-stage-b 已關閉。我送出 Ctrl-C 的 Vite exec session 為 33276；主代理另觀察到 PID 15908 仍服務 5173，故保留該共用／來源未確認的程序，沒有再終止。
- 本聊天 heartbeat 06-55-2 已於 2026-10-24 香港時間 06:55 執行並刪除；當時用量重設後為 1%，ordinary usage allowed。先前8%／06:51為歷史讀值。
- Stage D 候選版本 1.0.0-beta.6 已確認 beta.1–beta.5 為既有版本，於 3b327e1 更新設定；runtime 動作節拍修正在 799d08f、288693e。最終 build、固定工具 pack/validate 通過；隔離 browser 驗收 PARTIAL，未完成首領勝利/q11手動領獎。完整證據與限制見唯一續作報告的 Stage D current snapshot。

## 2026-10-24 霜雪群島 Stage D snapshot (candidate checks done; browser PARTIAL)

- Stage D 驗收時 runtime commit 為 288693e；當前 Gold Sand 進度見下節。唯一未追蹤路徑是 .worktrees/，保留全部 worktree；沒有把它加入 commit。
- Stage C1/C2 與路線內容已在 main：q09/q10 445559f；第三地圖 Cave bf7bfb5；pine/cave backgrounds df70efa / 06e884d；雪芽素材/接線 0e6a333；Warden atlas provenance/runtime 4b5d3d9 / 3134390；區域圖 UI 3ec2b8d 與 focused test 9c88e5c。以上 commit 不要重挑。
- Warden gameplay fa11987：Cave 切至 boss music/classification；霜潮守望獸 Lv30、HP 7600、碰撞 72×72、atlas 顯示 192×192；獠牙下砸（900ms 預警、190×120）與低潮湧浪（1100ms 預警、380×30，可跳躍）交替，首領免擊退，有專屬 result/retry/返回海岸路徑。新 boss death/retry 不改 bossDefeated/chapterComplete；q08 Guardian 流程維持原狀。
- q11/item 接線 87fb9a1：q10 claim 後可在雪芽處手動接取；擊敗 Warden 後回海岸手動 claim 才獲得一次冰潮長鋒。武器攻擊 +50、Lv30、不可購買、同一武器槽；比 Guardian sword +38 高 12，目標是提供封頂後可感知的進展。sprite 64×64 RGBA、icon 128×128 RGBA/runtime32 已在 7838c1d / 7137479；兩者現在註冊為 item/visual。
- SaveData format 1 未變。缺少 q11 的舊存檔仍有效，q11 開始為 locked/available 由 q10 claim 決定；Warden result/retry/claim 不動 q08／Guardian flags。
- Warden 包驗證 exit 0：npm.cmd run typecheck、npm.cmd run check:content、Vitest actors/rules/app-gameplay（3 files／38 tests；排除 .worktrees）、git diff --check。
- q11/item 包驗證 exit 0：npm.cmd run typecheck、npm.cmd run check:content、Vitest rules/app-foundation/frost-quests（3 files／17 tests；排除 .worktrees）、git diff --check。新增 integration 覆蓋老存檔缺 q11、Boss kill 使 q11 ready、返回雪岸手動 claim、獎勵單次與舊 flags 不變。
- UI agent 先前的第三節點／80%–25% landmark／q10 gate focused tests 仍有效；q11/item 沒改 world-map UI/model/styles/controller/tests，未重跑該組。
- 尚未做集中瀏覽器、build、pack/validate 或全路線遊玩。下一步依協調安排做一次集中驗收，使用隔離 profile/fixture，清楚標註起點，不稱為從頭通關。
- 本包開始前已完整重讀模板與七份規格（game-development、command-contracts、game.schema、game-release、starter playroom-sdk.js、sdk-versioning、save-compatibility），香港時間約 2026-10-24 07:23。適用要求為相對資產 URL、iframe 子目錄相容及存檔 format 1 不遷移；沒有發布／push/tag/Release 授權。
- Stage D 開始前於香港時間約 2026-10-24 07:30 再次完整讀取本地 AGENTS.md、線上模板及七份規格；對本輪適用的是保持相對資產路徑／子目錄 iframe 兼容及 format 1 存檔，完成真實 build 與固定工具 pack/validate；不建立 tag／Release、不發布。
- Heartbeat 06-55-2 已於香港時間 2026-10-24 06:55 執行並刪除；非待執行排程。當時使用量 1%，ordinary usage allowed；goal 可能仍顯示 usageLimited，需使用者 /goal resume，現有工具無法代為恢復。

## 2026-10-24 黃金沙海 Stage A current (IN_PROGRESS)

- 新區域已由 planned 黃金沙海轉為真實 MapDef。第一張「琥珀砂岸」sand-glass-shore 加入 mapOrder、world validator 與 sand environment theme；Frost Shore 東門要求 q11 claimed 且 Lv30，沙岸西門可無鎖返回 Frost Shore。SaveData format 1、q01–q11 與 Guardian flags/任務契約未改。
- Regional atlas 現有獨立 sand scope、全域黃金沙海入口點、Frost↔Sand 真實 portal 連線及 q11 鎖定狀態；只有 catalog 真正存在的 maps 才繪出區域節點。當前沙海僅有 1 張可玩探索圖，沒有怪物、NPC、沙海任務或首領；其餘兩個圖位是座標資料、UI 不會假繪成可玩節點。
- 素材 commit c8997ed：960×540 黃金沙海路線圖及 shore sky/far/mid 圖層，far/mid 真 alpha；保留原始 ImageGen PNG、逐項完整 prompt 與 source logs。Chart 在 320×180 可分辨海岸、沙脊、綠洲；三層合成已視檢。Runtime 約 2.5 MiB。
- 程式／區域接線 commit bf2cc2f：MapDef、portal、mapOrder、world validator、兩個資產 manifest、atlas model/UI/CSS、world-map focused test。
- 直接相關檢查 exit 0：npm.cmd run typecheck、npm.cmd run check:content、Vitest tests/world-map.test.ts --exclude **/.worktrees/**（1 file／7 tests）、manifest/file/dimension/alpha Python 檢查與 git diff --check。未對最新 Gold Sand commit 執行 build、pack/validate 或 browser。
- 本開發包開始前，已完整重讀本地 AGENTS.md、Playroom game-agent template 及其七份線上規格，另讀 plan/10-asset-spec.md 與 imagegen skill。適用要求是相對 asset URL、iframe 子目錄相容、format 1 存檔及來源原稿保留；本包最小驗收為新圖可由 q11＋Lv30 到達並自由回程、atlas 只顯示真實 MapDef、舊 save 無新欄位依然有效、manifest/內容/型別/focused tests 通過。未升級 SDK/schema、未發布/push/tag/Release。
- 本區域尚未完成。c498dce 加入 sand-scorpion（Lv30，攻擊碰撞 52×44）、850ms 可讀風報的 190px 低尾刺 sand-stinger，以及保證掉落、可出售 42 金幣的 amber-scale。當前只完成 rules/actor AI definition，尚未在任何 MapDef 生成；正式 actor atlas 尚未交付，不得稱為可遭遇／可拾取。
- amber-scale icon 已由 29820ce 整合為 128×128 RGBA、runtime 32×32；0e2b40b 將其加入 interface manifest 與 required keys。四張6×5 scorpion atlas與一張2×2 attack-strip候選由07382d4/fac1544 source-only保留；均有紅邊或尺寸／格線問題，無runtime atlas，ImageGen重試已停止。
- c498dce 相關檢查通過：npm.cmd run typecheck、npm.cmd run check:content、npx.cmd vitest run tests/rules.test.ts tests/actors.test.ts --exclude '**/.worktrees/**'（2 files／17 tests）；git diff --check 通過。上一輪新增斷言排序曾失敗，修正後 focused run 全通過。
- a65b1d9 修正資產契約：loader 現強制要求 sand 的 sky/far/mid 三層；foundation 測試驗證缺任何一層都會拒絕，也更新 Gold Sand item/map catalog 預期數。npm.cmd run typecheck 與 npx.cmd vitest run tests/integration/app-foundation.test.ts --exclude '**/.worktrees/**'（1 file／10 tests）通過。
- 0e2b40b 將 amber-scale icon 加入 manifest/required keys；typecheck 與更新後的 app-foundation focused test（1 file／11 tests）通過。07382d4/fac1544 僅保存不合格 scorpion 候選與 source notes，無 runtime；沒有因此新增遊戲驗收。
- 32d204a 增加 sand-stinger combat check，證明空中角色能跳過低尾刺、地面角色在相同 90ms active window 受擊；npx.cmd vitest run tests/combat.test.ts --exclude '**/.worktrees/**'（1 file／11 tests）與隨後 npm.cmd run typecheck 通過。
- 3b541f3 新增 test-only sand-scorpion spawn 的完整遊戲流程：攻擊、擊殺、保證琥珀甲片掉落、拾取、回鎮出售；`npx.cmd vitest run tests/integration/app-gameplay.test.ts --exclude '**/.worktrees/**' -t 'amber scale'`通過1項（23 skipped），`npm.cmd run typecheck` exit 0。production MapDef仍無該怪物，不能視為實際遭遇驗收。
- 上一進度快照記錄當時沒有可用沙蠍 runtime atlas；以下為使用者 2026-10-24 指定的目前範圍，取代先前擴展到 sunwell-basin、boss 或 q12–q14 的方向。
## 2026-10-24 黃金沙海有限續作（目前權威計畫；Stage 3 完成即停止）

只完成 production sand-glass-shore 沙蠍遭遇、sand-dune-pass 第二地圖及 q12 手動解鎖任務、一次集中驗證與提交整合。保留 SDK/tools 1.1.0、SaveData format 1、既有 q01–q11/Guardian 行為和相對資源路徑。不新增第三張圖、首領、新區域或後續功能；不 push、tag、Release 或上架。

| 階段 | 負責人與依賴 | 完成條件 |
| --- | --- | --- |
| 1. 沙蠍 production encounter | 本整合代理負責 runtime、MapDef、loader/manifest、focused check 與 main 整合；/root/expansion_art 負責 scorpion 圖像。需先收到通過檢視的隔離 worktree runtime atlas；prototype/source-only 圖不可用。 | sand-glass-shore 實際生成 sand-scorpion；stinger 預警、可躲低尾刺、死亡、保證 amber-scale 掉落、拾取及商人出售都從生產遭遇觸發。Atlas 符合 renderer idle 200ms、dead 100ms 契約，frame 數依實際可用姿勢決定。加一個真實 MapDef/遭遇 focused integration check。 |
| 2. sand-dune-pass + q12 | 本整合代理負責 MapDef、探索路線、portal、quest/runtime 與 focused check；/root/sand_scene_art 負責新 ImageGen 地景和 guide/NPC 圖。接線前確定實際路徑、尺寸、alpha 和 manifest 契約。 | 建立真實第二張可玩圖，含探索迴路/平台與可自由回沙岸的出口。guide 手動接 q12；擊敗可重生沙蠍並交付 3 個 amber-scale 後手動 claim，才解鎖地圖。已售出材料可重取，不軟鎖。atlas/world catalog 只顯示真實定義。舊 format 1 存檔可缺 q12 狀態並安全使用；不改格式。 |
| 3. 集中驗證、分段提交並整合 main | 本整合代理負責；素材只 cherry-pick 通過檢視的 commit，保留 .worktrees/ 且不 stage。 | 只跑直接相關 typecheck/content/focused tests（Vitest 排除 **/.worktrees/**）、一次 build、固定 Playroom tools 1.1.0 pack/validate 和一次隔離 browser smoke，覆蓋入口、遭遇、戰利品、q12、第二圖探索與回程。所有本輪提交整合到 main；文件如實列出未驗證項目。達成後標記完成並停止。 |

基線為 main HEAD 3edb5f7。已有 sand-glass-shore、q11/Lv30 入口、琥珀甲片 icon、沙蠍 AI/低尾刺 prototype 和 test-only loot flow；尚無 production spawn/atlas、sand-dune-pass 或 q12。兩份 art worktree 分別供應沙蠍及 dune scenery/NPC，程式整合不重做圖像生成。

## Agent／worktree／commit

| Agent | Worktree／branch | HEAD／狀態 | 責任／下一步 |
| --- | --- | --- | --- |
| /root | 主協調 | — | 規劃、規格提示與素材協調；不改程式 |
| /root/game_expansion | repository main | Gold Sand scorpion code/art/test checkpoints through 3b541f3; this documentation update pending | sting AI tested; amber icon integrated; no runtime atlas or live scorpion encounter |
| /root/expansion_art | .worktrees/expansion-art／codex/expansion-art | HEAD 6f71d43；clean；四張6×5與一張2×2候選皆source-only，無runtime | 已停止同方式ImageGen重試；amber-scale icon已交付 |
| /root/frost_interface_art | .worktrees/frost-region-map／codex/frost-region-map | 8301ef5；check 通過、工作樹 clean | UI-only 驗收已整合，勿覆寫其 world-map files/tests |
| 舊素材工作樹 | .worktrees/frost-interface-art／codex/frost-interface-art | 2b4bb2a | 歷史素材工作樹；保留 |

## 恢復方式

先讀本報告與本狀態板，再執行 git status --short --branch、git log -1 --oneline、git worktree list --porcelain；保留 .worktrees/ 與使用者修改。Stage D beta.6 build/pack/validate 結果僅適用於 runtime commit 288693e；目前 Gold Sand 改動尚未重新打包或做 browser QA，待本區域內容完成再選下一候選版本執行一次集中驗證。已在 main 的 Cave bf7bfb5、Warden gameplay fa11987、q11/item 87fb9a1、sword sprite 7838c1d、icon 7137479、Warden atlas 3134390、UI 3ec2b8d、UI focused test 9c88e5c 不要重複 cherry-pick。Stage D 開始前已於 2026-10-24 香港時間約 07:30 重讀本專案線上模板及七份指定規格；Vitest 命令排除 **/.worktrees/**。usage 中斷時保留文件所列 WIP，不聲稱未執行檢查通過。禁止推送、建立 tag／Release 或上架。
