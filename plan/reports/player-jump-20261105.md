# beta.67・跳躍按鍵容錯

2026-11-05 23:58 HKT，`brightwood-first-oath`，本機`1.0.0-beta.67`，成品`dist/`，bundle`assets/index-DDWpA9dL.js`。

離開平台後80ms內可補跳；落地前100ms內的跳躍按鍵，在正常碰撞落地的同一tick起跳。主角專用`stepPlayerMovement()`包住既有movement，普通跳躍的速度、軌跡及碰撞結果相同；敵人仍直接使用原movement。兩個時間窗是本專案的設計選擇，非宣稱沿用其他遊戲的精確數值。

資料只在GameplayState暫存，不進SaveData／MovementState或存檔格式。實際跳躍仍是一段跳，消耗寬限後不會再空跳；下跳不排入普通跳躍佇列，按下方向鍵會取消未執行預輸入。附著攀爬、死亡、墜落重置、換圖、失焦、暫停或面板凍結均清除暫存；受擊期間不使用容錯取消擊退。落地預輸入的音效按實際起跳事件播放一次，即使前後snapshot都是airborne。

來源是原作者[Maddy Thorson・Celeste & Forgiveness](https://www.mattmakesgames.com/articles/celeste_and_forgiveness/index.html)介紹的離地寬限及預輸入方向。本遊戲採短按邊緣佇列，不要求新增長按狀態；沒有引入牆跳、重力改動或自動連跳。

本項開始前再次透過GitHub網路工具完整讀取Playroom main範本與七份規格（開發、操作契約、Schema、workflow、SDK、版本及存檔相容性）。適用要求是保留ID與相容性、更新候選版本、如實記錄驗證；無SDK／存檔格式或發布修改。

實際驗證：

- 既有movement15項通過，之後該底層未再修改。
- 新增10項jump timing測試，第一次有1項錯誤預期：既有落地sweep會在接觸時截斷橫向位移，測試誤以為應走滿tick。改成比較既有碰撞結果後通過；沒有更改底層來迎合測試。
- jump timing、獨立gameplay接線、既有focus與audio四檔共25項通過。後續補手動暫停案例及修窄墜落重置判斷後，只重跑受影響的jump／focus兩檔17項通過。換圖、SaveData不含暫存及airborne→airborne起跳音效均有直接coverage。
- typecheck在最終邏輯後通過；content check、build及相關`git diff --check`通過；四處版本均beta.67，讀1–5／寫5契約相同。

未跑全回歸、瀏覽器實玩、手感調參、iframe／帳號／雲端或ZIP驗證，沒有宣稱通過。仍用已安裝Node24.19.0，未處理正式Release的24.22.1+環境要求。沒有發布、commit或碰玩家存檔。

下一項由[夜間入口](../night-improvements-20261106.md)承接，不需要重新載入前一批素材圖片。
