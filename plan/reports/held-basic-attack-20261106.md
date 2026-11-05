# 可選按住普通攻擊 — beta.77

2026-11-06 02:04 HKT，本機`1.0.0-beta.77`，`dist/`已建置，JS`index-DIwm1ONK.js`，未發布。

原操作說明明確採單次施放，本輪保留此預設，在設定加入「按一下施放／按住連續攻擊」可選項。裝置偏好key為`<gameId>:ui:hold-basic-attack:v1`，不進角色／雲端存檔。儲存受阻仍可於本次遊玩使用。

開啟後，普通攻擊在原冷卻與動作完成後才重複，技能／其他已排命令優先，沿用實際game command與原攻擊規則。放開、面板、暫停、失焦、地圖載入、攀爬、受擊位移或死亡不發重複命令。技能仍維持按一下。`KeyboardInputState.isHeld`讓右Ctrl／Alt別名與初次按下採同一解析，保留舊移動鍵原始held語意。

參考[Game Accessibility Guidelines重複輸入](https://gameaccessibilityguidelines.com/avoid-repeated-inputs-button-mashing-quick-time-events/)的替代操作方向；沒有聲稱全面可及性驗收。開工前重新網路取得Playroom範本及七份規格，8/8與已完整讀全文一致。固定ID／相對資源／SDK及存檔可讀1–5寫5未變。

## 驗證

- Node24.22.1：`held-basic-attack.test.ts`4項（含7種停止狀態）＋`key-bindings.test.ts`8項，共12/12通過；typecheck與build通過。
- 預設不連發、原550ms／動作間隔、放開停止、實際重斬buffer優先、面板／暫停／失焦／載入／攀爬／受擊／死亡、裝置隔離與blocked storage、右Ctrl及重綁held都有focused coverage。
- 最後僅把選項改用既有`ms-chip is-active`呈現，build後沒有重跑無變動的邏輯測試。
- 沒有新增browser、截圖、content（資料未改）、全回歸、ZIP或平台／帳號驗收；設定新選項實際排版及長按手感未實機確認。
