# B 林地懸浮 HUD 實作

2026-11-05（Asia/Hong_Kong）。遊戲 `brightwood-first-oath`，本機候選 `1.0.0-beta.59`，成品 `dist/`；未發布。

## 使用者選擇與完成項目

使用者選擇 [B 概念圖](../../output/imagegen/bottom-hud-b-floating-v1.png)，並要求移除左側保存、拾取、互動，以原左上方人物資訊覆蓋該區。本次將既有人物卡移至左下角，不保留左上重複卡片。

- 下方形成左側人物卡、中央深綠細金邊快捷列、右側獨立圖示選單。
- 六個常用面板取消大型羊皮紙底板，保留既有繪製圖示、文字、焦點提示及 AP／SP／任務數量徽章；選單「世界地圖」短標籤為「地圖」，面板名稱與可存取名稱仍沿用完整名稱。
- 快捷列保留六格實際可互動按鈕、藥水數量、技能冷卻／狀態與設定的鍵位。預設左右 Ctrl 在小鍵帽上簡寫為 Ctrl，完整提示仍保留。
- 未學習技能以小鎖頭和淡化圖示呈現，title／aria-label 保留原因；沒有修改學習條件或施放邏輯。
- 移除拾取、互動兩個常駐按鈕；原鍵盤操作及靠近物件的提示沿用。
- 移除一般保存狀態標籤；讀取／保存失敗與衝突仍顯示既有重試／恢復操作，沒有更動自動保存、SDK 或存檔格式。
- NPC 對話／商店及回城等情境入口保留，移至人物卡上方，無內容時隱藏。
- 追加 `src/ui/forest-hud.css`，沿用既有點陣素材和 DOM 控制，覆寫舊底座、選單及窄視窗佈局。沒有從效果圖截取帶文字的按鈕來取代互動介面。

## 規格與實作來源

開始修改前於 2026-11-05 透過網路工具再次完整讀取 Playroom 遊戲範本與其七份 main 分支文件。清單與 URL 同 [先前規格來源清單](compact-hud-20261105.md#來源與適用規格)；本次有重新讀取，不依賴前次快取記憶實作。

適用要求：沿用現有玩法與素材、相對資源路徑、適應 iframe 實際尺寸、保留存檔相容與失敗恢復；本次不更動 SDK、裝置宣告或發布流程。

參考圖與原提示詞：[B PNG](../../output/imagegen/bottom-hud-b-floating-v1.png)、[ImageGen prompt](../../output/imagegen/bottom-hud-b-floating-v1.prompt.txt)。本次執行為既有介面的 CSS／DOM 實作，未另外生成或改寫圖片。

## 驗證與界線

- `npm run typecheck`：通過，exit 0。
- `npm run build`：通過，exit 0；產生 `dist/assets/index-CZLHq8eZ.js` 與 `dist/assets/index-C1WwPPIx.css`。
- `git diff --check -- src/ui/index.ts src/ui/forest-hud.css`：通過。
- 審閱程式，確認拾取／互動舊按鈕引用已移除，保存錯誤恢復分支仍存在，商店仍有 NPC 對話面板入口。

依最少驗證要求，此介面重排沒有新增單元測試，未啟動瀏覽器或執行完整回歸。尚未實際確認本版畫面尺寸、懸浮效果、按鈕點擊與小視窗外觀，不把建置成功當成瀏覽器視覺通過。上輪 HUD 的實機紀錄屬改版前的證據，不用來宣稱這一版已驗收。

## 交接

實作與必要靜態檢查已完成。若使用者要求後續實際畫面測試，依根 AGENTS.md 的固定無頭 Chrome 做法，以新 run／profile 確認下方三組排列及鍵盤／選單即可，避免重測不相關世界流程。

既有角色素材、鏡頭、任務收合及使用者文件修改均保留。未提交、推送、打包發布或上架。

## 後續無頭 Chrome 畫面測試（2026-11-05）

使用者後續明確要求實機畫面測試，已用全新 profile、空 loopback origin、正常建立的 Forest QA 角色完成局部驗收：

- 960×540、1280×720、1920×1080 下三組底部 UI 的邊界及互不重疊檢查通過；已審閱 960 與 1280 截圖，1920 為 DOM 量測。
- 人物卡確實位於左下；一般保存、拾取、互動常駐元件已移除。六個選單與頭像入口可點擊，普通攻擊按鈕點擊後恢復遊戲焦點。
- 方向鍵／Space 成功與森芽交談；Z 在空場景顯示無可拾取物品提示。
- 未發現 pageerror、requestfailed、console error 或觀測頁面 HTTP >=400；沒有需要修改的遊戲問題。
- 已正常暫停並關閉本輪 Chrome／server，對應程序及 port 43762 listening 觀測均為 0。

完整操作、初段測試器步行路線逾時及接續結果、owner／raw／收束界線見 [run record](../../output/playwright/forest-hud-b-20261105-01/run-record.md)。[1280 實際畫面](../../output/playwright/forest-hud-b-20261105-01/hud-1280.png)。本輪未重跑已通過的靜態檢查，也未擴大成完整平台驗收或發布。

## 後續依使用者貼圖修正右下選單

2026-11-05 使用者提供六個羊皮紙按鈕的局部參考，指出目前該區不符。依最新貼圖恢復小型羊皮紙按鈕、深色文字；固定圖示／標籤列高，統一六個按鈕尺寸及底邊。左下人物卡與中央 B 方案快捷列沿用。

開始前重新取得並閱讀 Playroom 範本及七份指定 main 文件（URL 同本報告所連規格清單）；適用要求為既有相對素材路徑、可操作與尺寸適配，未修改存檔／SDK。

`npm run build`、`git diff --check -- src/ui/forest-hud.css` 通過。針對此具體視覺問題完成一次獨立無頭局部驗收：960／1280 置中、標籤與底邊對齊、命中範圍及代表性地圖按鈕均通過，1280 局部實畫已視審；沒有重跑無關測試或完整回歸。程序已正常收束。

[修正後實際局部圖](../../output/playwright/menu-align-20261105-01/menu-review.jpg) · [完整 run record](../../output/playwright/menu-align-20261105-01/run-record.md)。舊圖及先前驗收保留為歷史證據；本次仍為 beta.59 本機候選，未發布。

## 2026-11-05 使用者要求再次執行測試（13:14 HKT）

- 本輪沒有修改遊戲程式。
- `npm run build`：通過；產物仍為 `index-DTl8Tkq7.js`／`index-BgWEIikE.css`。
- `npm test -- src/ui/quest-tracker.test.ts tests/journal-selection.test.ts`：2 個檔案、11 個測試全部通過。
- 依最少必要驗證原則，未跑完整回歸；沒有重啟瀏覽器或重截圖。相同產物的 960／1280 選單對齊、點擊及錯誤觀察沿用 `output/playwright/menu-align-20261105-01/run-record.md`，不宣稱本輪重新執行。
- 本輪未啟動 QA server／browser，沒有新增待收束程序。
