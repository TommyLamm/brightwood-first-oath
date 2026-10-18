# 實作狀態板

只有主 Agent 更新。建立計劃不算實作完成。狀態：NOT_STARTED → READY → IN_PROGRESS → PARTIAL／BLOCKED／REVIEW → DONE。缺驗收標 UNVERIFIED，不寫 PASS。

| 包 | 狀態 | 擁有者 | 輸出／下一步 |
| --- | --- | --- | --- |
| T00 | PARTIAL | 主 Agent | G0 已開放；T00-09 待 T10–T12 正式素材包補齊，見 T00 report/task |
| T01 | REVIEW | T01 package | 規則、物品、技能、怪物資料與局部測試已交付，待整合驗收 |
| T02 | REVIEW | T02 package | 移動核心及 15 項局部測試已交付，待手感／遊戲整合驗收 |
| T03 | REVIEW | T03 package | 戰鬥核心及死亡清理交接已交付，未驗收完整路線 |
| T04 | REVIEW | T04 package | 成長、背包、經濟 domain 已交付，待 app/主線整合驗收 |
| T05 | REVIEW | T05 package | 七地圖與八任務資料/核心已交付，未做全套跨表建置驗收 |
| T06 | REVIEW | T06 package | actor/boss 核心及局部測試已交付，待 T14 實際遊戲整合 |
| T07 | PARTIAL | T07 renderer | resize 幾何與局部測試已更新（commit `32eb79e`）；正式地圖仍缺素材，視覺未驗收 |
| T08 | DONE | T08 UI | 桌面 UI package 已交 T14；完整 app/遊戲驗收仍由 T14/T16 負責 |
| T09 | REVIEW | T09 persistence | 存檔核心與格式驗證已交付，待整合/cloud 環境驗收 |
| T10 | PARTIAL | T10 assets | partial canonical manifest 有 13 images／14 animations；hero sheets、anchors、五種怪、merchant 未完成 |
| T11 | PARTIAL | T11 assets | 18/20 keys；`env:tile-platform`、`env:tile-slope` 僅有 source-only 候選 |
| T12 | PARTIAL | T12 assets | 46 images／4 VFX animations；`vfx:heavy-strike` 仍缺於 manifest |
| T13 | REVIEW | T13 audio | 16 個原創 WAV/controller 已交付；瀏覽器解碼、播放與生命週期未驗收 |
| T14 | PARTIAL | 主 Agent | app 流程已接線；T14-22 正式視覺與 T14-25 完整路線未完成，無可玩候選 |
| T15 | PARTIAL | T15 package | SDK/tools/Manifest/workflow 已備妥；缺實際畫面封面，無 ZIP/validate |
| T16 | NOT_STARTED | 主 Agent | 等 T14-c 與 T15 候選 ZIP；不得先填通過 |

## 契約

文件契約 v1；T00 共用骨架與契約已落地並開放 G0。2026-10-18 狀態同步：T10 新增只含已驗收子集的 partial canonical manifest；不改變其缺 hero/anchors/怪物/NPC 的 PARTIAL 狀態。變更記日期、原因、受影響包及接線處置。

## 檢查與阻塞

最近一次整體程式 typecheck/build 證據見 T00 report；本輪未重跑聚合 typecheck/build/content check。T07 只跑其 renderer 核心測試（1 file／7 tests，通過）。T10/T11/T12 只做來源圖格、alpha、hash/manifest 檢查，拒收素材均為 source-only。當前發行阻塞：T10 缺 hero/anchors/五種怪/merchant，T11 缺 platform/slope，T12 缺 heavy-strike；因此 T14-22/T14-25、T15-08/T15-11 和 T16 都未完成。沒有可玩候選、封面或 ZIP；沒有 tag、Release 或平台上架。子代理報告放 reports/Txx.md。

