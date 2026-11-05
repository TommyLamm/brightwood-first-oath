# 可選靜止背景 — beta.78

2026-11-06 02:15 HKT，本機`1.0.0-beta.78`，`dist/`已建置，JS`index-BCvR2b6k.js`，未發布。

設定新增「背景視差：跟隨移動／保持靜止」。未手動選擇時，main讀系統prefers-reduced-motion作初始值；明確選擇存於`<gameId>:ui:background-motion:v1`，不進角色／雲端存檔。只調整遠近背景的水平視差，沒有更動角色／相機／戰鬥動畫。

`ParallaxMotion`保留切換當下的相機偏移，靜止不跳回左端；重複同步不重新抓位置，換圖重置靜止錨點。仍使用既有來源圖寬度與viewport clamp，避免寬畫面重複。參考[Game Accessibility Guidelines背景移動選項](https://gameaccessibilityguidelines.com/provide-an-option-to-turn-off-hide-background-movement/)，不宣稱全面可及性符合。

02:07 HKT開工前重新經網路取得Playroom範本與七份規格，8/8與已完整讀全文一致。固定ID、相對路徑、SDK與存檔可讀1–5／寫5保留。

## 驗證

- Node24.22.1：typecheck、5項直接相關測試、build通過。涵蓋保持當前phase、重複同步、既有寬度clamp、換圖、系統預設／手動覆蓋／遊戲隔離／blocked storage。
- 一個隔離headless:true Chrome，1280×720／DPR1／43792，context emulated reducedMotion=reduce。正常建Motion QA，以只讀CDP觀察Phaser，不寫物理／相機。
- 初始UI選靜止；實際走150→705.33，camera0→225，背景phase全0。開跟隨後far45／mid112.5；再切靜止，走回495.33、camera15，phase仍45／112.5。切換沒有跳回0。
- 手動follow重載後仍選取，覆蓋系統reduce；存檔不含backgroundMotion。0page／console／request／HTTP錯誤。
- [證據](../../output/playwright/motion-beta78-20261106-01/)包含runtime-summary、腳本／log／storage及cleanup。Motion QA／本輪背景偏好已按owner清除；具名close、server exec99105 Ctrl+C，程序0／listener0。
- 沒有截圖（動作由phase量測）、全回歸、content／ZIP／平台／帳號驗收。實機僅營地，換圖重置為unit coverage；高DPI及OS實機偏好切換未驗。媒體偏好只在新開遊戲決定初值，不聲稱遊玩中即時監聽OS設定。
