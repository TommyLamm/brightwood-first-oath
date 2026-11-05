# beta.70・可選較大閱讀字級

2026-11-06 00:55 HKT，`brightwood-first-oath`，本機`1.0.0-beta.70`，成品`dist/`，最終bundle`assets/index-C2PI4HIF.js`／CSS`index-VZJmoYD1.css`。

標題與設定內可選標準／較大閱讀字級，並記住此裝置選擇。放大標題卡、面板基礎文字、對話、手帳說明／目標、任務HUD說明及操作提示；保留世界鏡頭、角色／素材密度與精簡圖示格的比例。這不是把每一個固定px小標籤全數放大的模式。

選擇位於`<gameId>:ui:reading-size:v1`，不進角色／雲端存檔；儲存受阻仍可於本次切換。標準為預設，未識別值回退標準。按鈕aria-pressed及切換後焦點保留。

設計參考[Game Accessibility Guidelines・Basic](https://gameaccessibilityguidelines.com/basic/)的可讀字級及保存設定方向；此模式是本遊戲的實作選擇，不宣稱完整無障礙合規。延續本夜間已完整讀取的Playroom範本與七份main規格，SDK／讀1–5寫5契約不變。

## 驗證

- 偏好3項測試一次通過：裝置／遊戲隔離、保存與恢復、不改角色key、未知值及無儲存情境。沒有為純CSS另外寫測試。
- typecheck及build通過；首次瀏覽器發現標題齒輪被現有screen-layer攔住，不能用它在建立角色前選字級。改為在標題card內提供直接字級按鈕後，對改動再做typecheck／build。最終相關diff檢查通過，沒有重跑不變的偏好測試／內容表／全回歸。
- 一個專用headless session，1920×1080／DPR1及1280×720：標題13→16px、焦點、沒有角色時可切換、沒有因此建立角色存檔、重載保留均通過。正常表單建立Font QA後，檢查設定大／標準／再大、手帳兩尺寸、森芽對話，共6筆面板紀錄；全無橫向溢出及越出視窗邊界，對話18px，Canvas仍1920×1080。垂直內容保留捲動，未宣稱長手帳全內容同時可見。
- pageerror／console error／failed request／HTTP>=400均0。兩張1280實畫JPEG q72已檢視。只檢查本項字級，不重跑beta.69已通過的NPC／跳躍。

原始config、腳本、timeout歷史、metrics與畫面：[QA目錄](../../output/playwright/reading-beta70-20261106-01/README.md)。Font QA存檔與本輪閱讀偏好已清，專屬session及server正常關閉；同一使用者觀察匹配Node／Chrome0、43784 listening0。

未驗其他面板／高DPI／4K、所有長文本／特殊視窗、平台iframe／全螢幕、帳號／雲端、ZIP與發布。現有Node24.19.0限制沿用，未安裝依賴。沒有commit或發布。標題背後齒輪的可操作性仍是另一個已確認缺口；本項提供直接字級入口，下一項處理該設定導覽問題。
