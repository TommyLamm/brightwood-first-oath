# 實作狀態板

只有主 Agent 更新。建立計劃不算實作完成。狀態：NOT_STARTED → READY → IN_PROGRESS → PARTIAL／BLOCKED／REVIEW → DONE。缺驗收標 UNVERIFIED，不寫 PASS。

| 包 | 狀態 | 擁有者 | 輸出／下一步 |
| --- | --- | --- | --- |
| T00 | DONE | 本輪整合代理 | G0、共用契約與根設定完成；T00-09 已隨四包 canonical manifests／素材交付收尾。遊戲接合另由 T14/T16 驗收 |
| T01 | REVIEW | T01 package | 規則、物品、技能、怪物資料與局部測試已交付，待整合驗收 |
| T02 | REVIEW | T02 package | 移動核心及 15 項局部測試已交付，待手感／遊戲整合驗收 |
| T03 | REVIEW | T03 package | 戰鬥核心及死亡清理交接已交付，未驗收完整路線 |
| T04 | REVIEW | T04 package | 成長、背包、經濟 domain 已交付，待 app/主線整合驗收 |
| T05 | REVIEW | T05 package | 七地圖與八任務資料/核心已交付，未做全套跨表建置驗收 |
| T06 | REVIEW | T06 package | actor/boss 核心及局部測試已交付，待 T14 實際遊戲整合 |
| T07 | PARTIAL | T07 renderer | resize／terrain geometry focused checks 已更新（commit `a118ab6`；8 tests、renderer-only strict tsc 通過）；正式素材已補齊，地圖視覺接合仍未驗收 |
| T08 | DONE | T08 UI | 桌面 UI package 已交 T14；完整 app/遊戲驗收仍由 T14/T16 負責 |
| T09 | REVIEW | T09 persistence | 存檔核心與格式驗證已交付，待整合/cloud 環境驗收 |
| T10 | DONE | T10 assets | 素材22 images／64 animations＋96 hero anchors；缺圖已由原ImageGen稿匯出補齊；遊戲接合未驗證 |
| T11 | DONE | T11 assets | 素材20/20 keys；platform／slope由原ImageGen稿確定性匯出入庫（`4765c45`）；遊戲接合未驗證 |
| T12 | DONE | T12 assets | 素材47 images／5 VFX animations；heavy-strike v9匯出入庫（`0520204`）；遊戲接合未驗證 |
| T13 | REVIEW | T13 audio | 16 個原創 WAV/controller 已交付；瀏覽器解碼、播放與生命週期未驗收 |
| T14 | PARTIAL | 本輪整合代理 | app 流程與 16 項音訊 controller 已接線；四包正式 manifests 現已齊全。T07 視覺接合、瀏覽器音訊驗收與 T14-25 完整路線仍未驗證 |
| T15 | PARTIAL | T15 package | SDK/tools/Manifest/workflow 已備妥；缺實際畫面封面，無 ZIP/validate |
| T16 | NOT_STARTED | 主 Agent | 等 T14-c 與 T15 候選 ZIP；不得先填通過 |

## 契約

文件契約 v1；T00 共用骨架與契約已落地並開放 G0。2026-10-18 最新素材同步：T10–T12素材檔已完整，actors22 images／64 animations＋96 anchors、environment20 images、interface47 images／5 animations；本次只完成素材，不宣稱遊戲接合通過。變更記日期、原因、受影響包及接線處置。

## 檢查與阻塞

本次只完成素材：經使用者明確授權，復原既有ImageGen原稿並保留裁切／重排／最近鄰縮放／清邊alpha腳本。新素材完成視檢，離線素材audit通過檔案存在、相對路徑、key唯一、切格、動畫引用、96個anchors、各包體積及新圖16px安全邊／binary alpha。應用程式loadRequiredAssetManifests以本地JSON檔案讀取通過四包（audio沿用既有16 entries）。詳細證據見[素材交付報告](reports/asset-recovery-20261018.md)。

未跑本輪build、typecheck、測試套件、瀏覽器、完整路線、pack/validate或iframe驗收。T07/T14需整合可見腳底邊距、anchors裝備附著及動作／技能節拍；T14-22／T14-25、T15-08／11、T16仍未完成。沒有新可玩候選、封面或ZIP，沒有tag／Release／上架。先前程式檢查結果只見各包歷史report，本次不重複宣稱通過。

2026-10-18 主線節奏補充（package-level 靜態估算，非完整路線試玩）：T01/T03 估算 41 隻必需敵人的高輸出攻擊窗約 58.55 秒（首擊至末擊理想下界約 55.60 秒）；普攻-only 配置約 790.56 次攻擊、約 7.20 分鐘理想連續攻擊。T02 前向地圖走訪為 11,110 px／約 79 秒；T02/T05 代表任務路線約 34,340–35,140 px／約 4.1–4.2 分鐘無阻走路。估值不含完整追敵、互動、選單、失誤、操作與實際戰鬥節奏，不能相加宣稱通關時間；目前沒有證據支持 45–60 分鐘，模型顯示主線很可能偏短。各包依 08 等待整合可玩路線的代表性實測再集中調節奏；T14-25 仍未執行，主線時長未驗證。

2026-10-18 素材復原補充：T10 `actor:hero-cloth` v8（1254×1254，非 8×8 可切尺寸且有彩色柔邊）、T11 `env:tile-platform` cedar-plank one-shot（2172×724，尺寸、頂邊、gutter、接邊失敗）、T12 `vfx:heavy-strike` v7（6×1 尺寸可切但前五格透明內縮 0–3px、低 alpha 與紅邊）皆只保留 source-only。最後 T12 v8 one-shot 仍為 2172×724（3:1 而非 6:1），六格安全邊未達16px、79,683個半透明像素且有紅／粉邊；拒絕後依使用者指示停止素材重試，未加入runtime／manifest。T11 在中止前產生 stone-timber source 候選，但未完成檢視，仍未驗收且不計coverage。T07 terrain geometry focused check commit `a118ab6` 通過8項測試及 renderer-only strict tsc；素材驗收仍待完整資產。canonical coverage 仍為 actors 部分清單、environment 18/20、interface 46 images／4 animations，T14 啟動素材閘門未解除。細節見各包最新 reports 與 source logs。



2026-10-18 本次素材復原完成：下方／前段歷史紀錄中的source-only結論是指未處理原稿，已由本次使用者授權的確定性匯出解除缺圖；原稿仍保留，正式使用新版本PNG與更新manifest。素材完成不等於T14/T16遊戲驗收完成。

2026-10-18 T00-09 收尾：四包正式 manifest／素材齊全（actors 22 images／64 animations＋96 anchors、environment 20 images、interface 47 images／5 animations、audio 16 entries），asset-recovery 報告已記 `loadRequiredAssetManifests` 以本地 JSON 通過。T00 標 DONE。T14 音訊接線已在 app；仍需 T07 將正式角色／地形／VFX 呈現接到實際遊戲並檢查腳底、anchors、動作節拍，另以瀏覽器驗證 WAV 播放。T14-25 完整 45–60 分鐘路線未跑，時長仍 UNVERIFIED；T15 截圖／封面／ZIP 及 T16 驗收未完成。沒有 build、typecheck、測試、瀏覽器、pack/validate 或發布的新結果。
