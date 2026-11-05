# 背包鍵盤切換 — beta.80

2026-11-06 02:39 HKT，本機`1.0.0-beta.80`，`dist/`已建置，JS`index-BgEtSa6I.js`，未發布。

背包物品格取得焦點後，可用方向鍵切換選取，Home／End到首末物品。依當前可見bagIndex與實際CSS欄數處理，分類後仍指向原背包格；只呼叫既有select-bag UI行為，焦點與內容一起更新。Tab／Enter與既有物品動作保留。暫停／modal、其他面板、修飾鍵及文字控制不攔截。

開工前02:28 HKT重新經網路取得Playroom範本及七份規格，8/8與已完整讀全文一致。固定ID、相對路徑、SDK／存檔可讀1–5寫5未變。

## 最小驗證

- Node24.22.1：`inventory-navigation.test.ts`3項、typecheck、build通過。涵蓋分類後實際bagIndex、不同欄數、首末／不完整末列、過期選取與原生Tab／Enter保留。
- 一輪限定headless:true Chrome，1280×720／DPR1／43794，正常建Controls QA，沒有注入遊戲狀態。
- 兩個正常起始物品：右／Home／End／上／下／左均使focus與aria-pressed同步到預期0或1格；背包數量不變。實際分類後多列與其他視窗尺寸未browser驗（pure model有coverage）。
- 同輪補兩個尚未實機確認的新輸入：預設按住一次右Ctrl只有1輪普攻；開選項後一次按住1600ms出現3次attack首幀32，放開後待機且無新攻擊；設定未進存檔。這是畫面幀觀察，不宣稱測得精確攻速，攻速由focused測試覆蓋。
- 正常攀爬到營地平台，移到x650.33，按下＋Alt實際下跳；腳位500→517.33→600，min=500，沒有誤成向上跳。沒有重跑coyote／buffer或全世界流程。
- 0page／console／request／HTTP錯誤，沒有截圖。按owner只刪Controls QA與本輪hold偏好；具名close、server exec77686 Ctrl+C，程序0／listener0。
- [原始證據](../../output/playwright/controls-beta80-20261106-01/)保留腳本／log／runtime-summary／storage／cleanup。setup最初即時slot count在queued panel套用前為0，後續snapshot與實際控制等待正確物品，不將該即時值當完成證據。

未做全回歸／content（資料未改）、ZIP、平台／帳號／雲端、高DPI或真OS鍵盤焦點驗收。
