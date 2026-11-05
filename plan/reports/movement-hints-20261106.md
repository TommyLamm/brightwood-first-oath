# beta.68・攀爬與下跳情境提示

2026-11-06 00:05 HKT，`brightwood-first-oath`，本機`1.0.0-beta.68`，成品`dist/`，bundle`assets/index-CSaX51Ka.js`。

沿用既有HUD提示列，加入靠近攀爬路線、攀爬中跳離、站立可穿越平台下跳三種提醒。採用玩家目前綁定的上／下／跳躍鍵；不硬寫方向鍵或Alt。NPC及出入口仍優先顯示，受阻入口的原原因全文保留。一般地面／空中不顯示下跳提示；暫停、面板與焦點恢復閘門隱藏。

攀爬提示與實際附著共同使用同一`findNearbyLadder()`，沒有複製一套近距離門檻或修改移動規則。資料由live movement推導，不進SaveData。沒有改CSS、版面或增加UI控制。

設計參考[Game Accessibility Guidelines：遊玩中可重看控制提醒](https://gameaccessibilityguidelines.com/indicate-allow-reminder-of-controls-during-gameplay/)。依此選擇補足當下所需操作，既有快捷鍵說明仍保留。此項屬使用者授權的同一夜間續作；Playroom範本與七份main規格在本夜間工作開始前及上一項開始前已完整重讀，無SDK／格式變更。

實際驗證：新增5項context測試＋既有UI snapshot3項，**8/8一次通過**；typecheck、一次build及相關`git diff --check`通過。測試覆蓋實際附著邊界、自訂鍵、互動優先、入口受阻原因、暫停／面板隱藏與不改存檔。

沒有改內容表，本項不重跑content check、底層movement或全回歸。未啟動瀏覽器，實際顯示／排版／遊玩未驗；未發布、commit、操作玩家存檔或建立server。現有Node24.19.0限制沿用。

最新下一項見[夜間入口](../night-improvements-20261106.md)。
