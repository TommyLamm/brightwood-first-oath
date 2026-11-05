# beta.59 無頭瀏覽器修復與局部驗收

2026-11-05（Asia/Hong_Kong）。本機 `brightwood-first-oath`／`1.0.0-beta.59`；未發布。

使用者要求檢查啟動錯誤、修復並繼續測試，且不顯示桌面瀏覽器視窗。已使用 Playwright 技能與既有本機 CLI，以 `headless:true` 成功完成隔離短段測試。

## 啟動問題

受限 shell 中的 Chrome 在 `about:blank` 前因 crashpad pipe 0x6D 自行退出。經使用者要求的診斷與工具審批，在一般使用者執行環境以同一組已安裝 Node／CLI／Chrome、明確無頭設定、新隔離 profile 成功啟動。這支持錯誤與執行環境／Windows IPC 限制有關；未證明具體 ACL 機制。已恢復可用的無頭測試方式，未修改全域安全政策或瀏覽器安全參數。

## 實際發現及修復

- 高解析畫布搭配 zoom 2 時，固定背景受到相機縮放原點位移，只剩左上部分可見。新增 `fixedBackgroundPosition` 抵銷該位移，背景恢復填滿畫面。
- 怪物／掉落物裁切及背景視差仍使用未縮放的 `camera.scrollX/Y`。新增 `cameraWorldViewport`，改用實際可見世界範圍，修正右側怪物提早消失及視差起點不正確。
- 根 `AGENTS.md` 保存使用者無頭模式偏好，後續用截圖檢視實際畫面。

## 已驗證

- 正常 UI 建立 `Clarity QA`，空 origin 的 canonical-null guard、存檔、重載及繼續冒險。
- 正常移動、跳躍、與森芽對話及接取任務。
- 正常攻擊擊殺一隻蝸牛，EXP 20/55，最終 format 5 測試存檔為 q01 active、snail 計數 1。
- 1280×720 與 960×540 實際無頭畫面；畫布保持 1920×1080，背景完整、右側怪物可見。
- 最終短段沒有 pageerror、requestfailed 或 HTTP >=400 資源，整個 run console 沒有 error 行。
- 相機／視差及 viewport 兩個檔案共 22 項測試、typecheck、build 通過。只在相關程式再次修改後重跑。
- 專屬無頭 Chrome session 與 loopback server 已正常收束；本輪 profile 匹配程序及 43760 listening 觀察均為 0。

## 證據及交接

完整 run record：`output/playwright/beta59-headless-20261105-02/run-record.md`。

必要實畫：`camp-1280.png`（修復前）、`camp-fixed-1280.png`（背景修復後）、`jump-1280.png`、`combat-final-1280.png`、`game-final-960.png`；同目錄有 JPEG 品質 72 的檢視圖。全部是實際 headless 截圖，沒有桌面視窗。

詳細結果、來源及清理：同目錄 `runtime-summary.json`、`config.json`、`ownership*.json`、`cleanup-observation.json`、`final.storage.json`。Node v24.19.0、Playwright CLI 0.1.22、Chrome 156.0.8078.80；未安裝／升級依賴。

未執行完整世界／所有裝束／首領實玩、手機及效能矩陣、跨來源 iframe／全螢幕、帳號／雲端存檔、完整回歸或 ZIP 驗證；本次不宣稱完整平台驗收。下一步若準備發布，需完成明確發布範圍的剩餘驗收及取得發布授權。
