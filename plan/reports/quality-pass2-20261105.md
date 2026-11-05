# Plan51 首批交付：場景融合與裝束攻擊精修

2026-11-05（Asia/Hong_Kong）。遊戲 `brightwood-first-oath`，本機候選
**1.0.0-beta.63**，成品 `dist/`。程式、素材、建置及本批無頭視覺驗收完成。
沒有 commit、push、ZIP、tag、Release 或平台上架。

## 完成內容

1. 嫩芽林道新增樹枝分叉、樹幹中段、地面樹根及藤蔓固定結；古礦入口新增
   木柱／斜撐、立柱中段、鐵底座與梯頂固定件。原平台與梯子圖集沿用。
2. 兩張新支撐圖集各 512×128、4 格、2× 密度；支撐分頂／中／底拼接，
   中段原比例重複並裁切。依正式平台／梯子端點定位，只套用兩張樣板圖。
3. 裝飾位於 depth9，在地形、角色及攻擊預警後方；林道 23 個、礦入口 16 個。
   沒有新增碰撞或掩體，保留 beta.62 的平台、怪物、首領選招與戰術用途。
4. 透過內建 ImageGen 分別精修輕革甲、鐵環甲六格攻擊：清楚臉部、手套及
   皮革邊界，統一金屬高光。各保留其餘 58 格逐像素相同，包括未用 padding。
5. 保留 1536×1536 圖集、96×96 顯示框、動畫時序／格序、pivot 及裝備錨點。
   匯出後 12 格 alpha 外框與原本一致，最大定位差異 0 邏輯 px；內部握點另以
   實機代表性左右攻擊檢視，不能只靠外框斷言推定。
6. package／lock／game manifest 同步升至 beta.63。原場景／角色規則檔雜湊
   與 beta.62 基線一致；存檔讀 1–5／寫 5、ID、SDK 及 HUD 配置保持現況。

## 來源與成本

四張原稿使用內建 ImageGen，不使用 CLI/API fallback。完整 prompt、精確編修
目標、原生輸出路徑、原稿、Manifest 基線及可重現匯出器位於
`art-source/quality-pass2-20261105/`，入口為該目錄 `README.md`。

- 新增版本化 runtime 檔共 **1,693,624 bytes**（約 1.62 MiB）。舊 runtime 保留，
  因此目前成品仍同時包含舊檔；不能把替換引用的差額當成實際包體增量。
- 活躍引用素材的壓縮大小相較舊引用淨增 **113,329 bytes**（約 110.7 KiB）。
- 活躍引用的基本 RGBA 解碼量淨增 **524,288 bytes**（0.5 MiB），來自兩張
  支撐圖集；角色圖集尺寸未增加。這不是實測瀏覽器記憶體峰值。
- 每項 key 維持穩定，檔名版本化。來源／runtime hash、格數與尺寸、修改格及
  定位差異見 `export-report.json`；原稿及舊版本可獨立保留／回退。

## 實際檢查

| 項目 | 結果 |
| --- | --- |
| 匯出器 | 4 張 runtime、12 個攻擊格、各 58 格未改、真透明／有效格、外框、未改動畫／素材及 world／actor hashes 斷言通過 |
| `src/render/terrain-style.test.ts` | 一次 6/6 通過，包含既有拼接及新增樣板選材、支撐落地、不跨跳台缺口、梯頂固定與正式 Manifest／PNG 尺寸 |
| `npm run typecheck` | 一次通過 |
| `npm run check:content` | 一次通過 rules／world 跨表檢查 |
| `npm run build` | 一次通過，`dist/assets/index-DPlVVER0.js` |
| 無頭視覺驗收 | 一個獨立 session，1920×1080／DPR1／正常鏡頭；兩圖支撐、兩套左右攻擊及正常傳送離圖後清除通過 |
| 載入／console | 四張新圖 HTTP200；pageerror、requestfailed、HTTP≥400、console error 均 0；最終 CLI 為 0 errors／0 warnings |

沒有重跑已過檢查或完整回歸。PNG 外框與未改格檢查由匯出器執行；沒有為純
素材替換另加動畫系統測試。渲染定位邏輯只執行直接相關地形測試檔。

視覺限制及工具過程：第一次啟動 server 的自動權限審查逾時、未執行；一次
允許重試後成功。Chrome 直接使用既有已驗證的普通使用者無頭路徑，沒有重演
受限 crashpad 問題。初始攻擊圖被正常戰鬥數字與受擊閃爍遮住；同 session
補拍四張安全位置攻擊裁圖。補拍助手起點曾等待錯誤頁面，正常 reload 後修正，
沒有改遊戲來迎合截圖。詳見 [本輪 run record](../../output/playwright/quality-pass2-20261105-01/run-record.md)。

## 畫面與未驗項目

- [林道正常相機](../../output/playwright/quality-pass2-20261105-01/forest-edge-scene-review.jpg)
- [礦入口正常相機](../../output/playwright/quality-pass2-20261105-01/mine-gate-scene-review.jpg)
- [兩套裝束左右攻擊](../../output/playwright/quality-pass2-20261105-01/attacks-clean-review.jpg)
- [攻擊素材前後對照](../../output/quality-pass2-20261105/attack-comparison-review.jpg)

完整截圖、合成 QA 進度、fingerprints、腳本、console 與 CLI 原始日誌保留在
`output/playwright/quality-pass2-20261105-01/`。這是本機指定範圍視覺驗收。
沒有把 QA 已裝備／已領取任務當成真實玩家取得流程；未逐幀播放所有動作。

未執行其他地圖／角色狀態、720p／高 DPI／4K、重新驗證攀爬跳躍物理、
beta.62 守衛戰術手感、後期武器裝備／重擊施放、效能、iframe／全螢幕、
登入／雲端與封包／發布驗收。上述項目不宣稱通過。

指定 session 已正常 close，自有 server 已 Ctrl+C 結束；cleanup 記錄本輪
匹配程序 0、port43768 listener 0（相同使用者觀察範圍）。兩次成功拍攝後都移除
本輪合成正式 key，原始 before storage 為 null。共用服務及其他 session 未碰。

## 交接與停止條件

Plan51 的 W00–W03 首批已完成，停止擴展。冰雪／沙海／遺跡／營地城鎮材質、
背景與地面、其他動畫狀態及未實玩戰鬥項目仍是後續路線。

使用者另要求 2026-11-05 **19:30 HKT** 在本對話單次續作；automation
`19-30-plan51` 已啟用，COUNT=1。屆時讀本報告與最新訊息；首批若仍已完成，
簡短回報即可，不自動擴展下一批，執行後停用／刪除該單次排程。

本次開始前重新以網路取得並核對 Playroom main 範本及其七份完整規格，
內容與同日本計畫規劃時一致。來源清單見 [Plan51](../51-visual-quality-second-pass.md#7-規格來源狀態與下一步)。
適用要求為相對路徑、既有玩法與存檔相容、版本提升、相關檢查與如實記錄；
沒有發布授權，不宣稱已完成平台完整驗收。
