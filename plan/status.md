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
- 本聊天一次性 heartbeat automation 06-55-2：2026-10-24 香港時間 06:55、COUNT=1、ACTIVE，目標本聊天。建立時五小時用量窗讀值 8%、重設時間 06:51 香港時間；這是當時快照，不代表目前用量。
- 下一步：整合 expansion_art 的 pine/cave 背景後接入第二圖及霜雪群島區域圖；接著由程式代理實作 frost-crab 的 windup→有界短衝→recovery 與可躲預告測試，並接入 q09–q11／frost-guide。crab atlas 目前不合安全切格要求，不能放進 runtime 或宣稱已接入。再集中驗證三圖入口、區域切換、蟹戰鬥、區域任務及舊格式存檔。
