# beta.71・隱藏開始前不可操作的HUD控制

2026-11-06 01:00 HKT，`brightwood-first-oath`，本機`1.0.0-beta.71`，成品`dist/`，bundle`assets/index-BUt8SBDn.js`／CSS`index-Cc1tJhk2.css`。

beta.70實機已確認標題背後gear被screen-layer攔截。既有設定面板主要服務角色內音量及按鍵，標題／建角階段原本已隱藏角色卡、地圖、追蹤與底列，卻漏了包含gear／按鍵提示的header。補入相同visibility:hidden規則，使這些開始前不可操作的控制不再顯示或進入鍵盤焦點；進入遊戲後原控制恢復。beta.70的標題內閱讀字級正常入口保留。

本項只有一條CSS規則及候選版本同步。確認實際DOM階層與is-pregame切換來源，執行一次build通過。依AGENTS跳過新增測試、typecheck、content check與新瀏覽器；**本項最終CSS顯示未在瀏覽器重新觀察**。不重跑beta.70字級或beta.69遊玩案例。未改玩法／存檔／SDK，未發布。
