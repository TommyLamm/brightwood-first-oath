# 畫質第一批實作與交接

日期：2026-11-05（Asia/Hong_Kong）。本機候選 `brightwood-first-oath`／`1.0.0-beta.60`，成品 `dist/`。未提交、推送或發布。

## 已完成

1. 透過內建 ImageGen 精修布衣攻擊六格，保留原有圖集尺寸和其他動作。原稿、實際 prompt、編修目標及可重現匯出器位於 `art-source/quality-pass1-20261105/`。
2. 從既有高解析 ImageGen 原稿重新匯出兩把後期武器（64→256px）、平台、梯子、傳送門、營地牌、礦坑門、祭壇，以及重擊六格（128→256px）。共十張新版本 runtime PNG；舊版保留。
3. 平台沿用原內部材質裁切、8 邏輯 px 透明邊和接縫匹配，取消低色數限制；其餘物件保持顯示框和定位。
4. 八處世界文字建立處明確使用 resolution 2：NPC／怪物／首領名稱、傳送門、掉落標籤、傷害、經驗和升級文字。原邏輯字級與位置維持一致。
5. 新增 `src/ui/image-quality.css`，將頭像、選單、快捷列、控制圖示、對話與裝備圖像改用正常插畫縮放。保持已選定的 B 版排列與羊皮紙按鈕。
6. 對照發現全域 antialias 會讓小主角變軟，因此最終保留世界 nearest 取樣，只讓整個 Canvas 的 FIT 呈現使用 CSS auto。文字以較高密度貼圖保留清晰度，沒有提高畫布或改相機幾何。
7. package、lockfile 與 game manifest 提升至 beta.60。遊戲 ID、desktop 宣告、存檔可讀 1–5／寫 5 未變。

## 成本與結構

- 十張素材新增 326,877 bytes，約 319 KiB。
- 基本 RGBA 解碼估計新增 2,365,440 bytes，約 2.3 MiB；不是實測記憶體峰值。
- 布衣圖集維持 1536×1536，避免整張圖集加倍的記憶體成本。
- 匯出器核對布衣全部 64 格：非攻擊列逐像素相同；更新動作外框與原先相同。六種環境及重擊外框差異為 0 邏輯 px；兩把劍最大為 0.5 邏輯 px。
- 三份 Manifest 的動畫資料、資產 key、display／pivot 保留。明細與來源雜湊：`art-source/quality-pass1-20261105/export-report.json`。

## 已執行檢查

- 匯出器：透明／有效格／圖集整除、身形外框、未變影格、平台邊界與動畫契約斷言通過。
- `npm run typecheck`：通過。
- `npm run check:content`：通過（rules／world 跨表）。
- `npm test -- src/render/animation-contract.test.ts tests/integration/app-hero-anchors.test.ts`：2 檔、4 項通過。
- `npm run build`：通過；最終取樣選擇後再次建置，入口為 `index-7rPgXIzR.js`／`index-D-bqeIw_.css`。
- scoped `git diff --check`：通過。
- 最終 headless run 02：1920×1080／1280×720 截圖與 960×540 佈局；底部三組均在視窗內且不重疊。正常 UI 建立合成角色、左右攻擊及移動／跳躍輸入，實際左右攻擊裁圖已視審。
- 實際 renderer 載入七張本批素材；另以瀏覽器 Image.decode 核對全部十張。沒有把後期武器「載入」稱為已實際裝備、或把重擊貼圖「載入」稱為已學習施放技能。
- 最終 Canvas 1920×1080、DPR1、CSS image-rendering auto、context smoothing false；十三張 HUD 相關圖像載入且使用 auto。
- 最終 pageerror／requestfailed／console error／HTTP≥400 均空；CLI console 0 errors、0 warnings。

最終詳情：`output/playwright/quality-pass1-20261105-02/run-record.md`。檢查輸出集中在 `output/quality-pass1-20261105/*.log`，未反覆執行無關回歸。

## 瀏覽器過程與限制

原定 run 01 初次 server 啟動因自動審批用量限制未執行；提示的重試時間經過、使用者要求繼續後，普通使用者執行環境通過當次審批並成功開啟 headless。沒有重演受限 Chrome crashpad 問題，沒有更改全域安全設定。

Run 01 保存 beta.59 基線及全域平滑候選比較。其後指定 CLI 回報 session 不再開啟；一次唯讀查詢沒有匹配程序，port43764 listener 為 0。沒有證明中斷原因，也沒有宣稱它是遊戲錯誤；未完成 run 01 的正常 final raw／close 流程，保留 baseline raw、profile、圖和 log。

Run 01 資源 timing 陣列沒有捕捉到本批貼圖；因此不以該陣列判定載入成功或失敗。Run 02 的 response 觀察及較大的 timing buffer，直接捕捉七張 runtime 新素材 HTTP200；全部十張的解碼另有獨立記錄。沒有修改遊戲載入程式來處理測試觀察工具的緩衝範圍。

Run 02 最終已正常暫停、保存 before／final 合成 storage、指定 session close，再向自有 server exec 傳 Ctrl+C。14:42:43 同一執行環境觀察本輪匹配程序 0、port43765 listening0；不宣稱整台主機或其他權限上下文已清理。

## 視覺成果

- `output/quality-pass1-20261105/asset-comparison.jpg`：素材前後合成。
- `world-final-comparison.jpg`：beta.59 與最終 1080 原尺寸局部，文字邊緣明顯改善。
- `attack-final-review.jpg`：真正遊戲中的左右攻擊；原武器貼合，沒有新增明顯彩邊。
- `game-final-1920-review.jpg`／`game-final-1280-review.jpg`：最終實機 JPEG 預覽。
- 完整 PNG、storage、owner、fingerprints 與原始日誌保存在兩個 run 目錄，沒有輸出 base64。

## 未執行與下一步

未執行全套回歸、所有主角裝束／世界場景、後期獎勵武器實際裝備流程、重擊技能實際施放、DPR2／4K、效能基線與相對幀時間、平台 iframe／全螢幕、雲端／跨設備或 ZIP／發布驗證。

其他裝束與背景維持下一批，按本計畫先檢查實際問題再決定是否重製，不把原本已清楚的資產列為必須重畫。可沿用本批來源恢復與匯出標準；若準備發布，重新讀取當時規格並完成發布所需範圍。

本批在修改前以網路工具重新完整讀取 Playroom 範本及其七份線上規格，來源連結見 `plan/visual-quality-upgrade-20261105.md`。保留既有使用者對 `plan/status.md` 及 beta57 報告的修改。
