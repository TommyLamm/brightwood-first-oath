# Plan54・多職業內容補完

2026-11-07，Asia/Hong_Kong。使用者要求實作上一輪列出的四類內容，並明確選用 Lv20 二轉、每職兩分支、保留既有技能及配點。狀態：SOURCE_READY／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL，beta.89本機實作完成、未發布。詳[最終交接](reports/class-completion-beta89-20261107.md)。

## 採用契約

- 盜賊：三裝束專屬短刃攻擊圖集、專屬肖像，保留可共用移動姿勢。使用內建 imagegen 原創素材，保存提示詞、原稿及匯出紀錄。
- 角色管理：改名、以名稱確認刪除、保留一名可恢復的已刪角色；可擴充至六欄。已有刪除備份時拒絕取代，另有明確確認的永久清除。資料過大時拒絕操作，不截短。
- 共享倉庫：同 profile 的24格，在角色列表管理，從指定角色背包存入／取回；裝備中的物品不能直接轉移。整份 profile 原子變更，失敗不部分移動。
- 二轉：Lv20正式職業可選一支，劍衛／狂劍、神射／遊俠、元素／秘法、影刃／飛鏢。原技能與AP／SP保留，分支另提供可切換的技能槽，不允許跨職業或重複領取。
- LUK：新欄位初值0，舊角色AP保持，UI及實際暴擊共用推導。影刃加入背擊／毒傷，飛鏢加入有限射程投射物；不增加等級上限或地區。
- 保存：format9讀1–9／寫9；舊格式按原契約驗證後補預設值、明確備份升級。舊版本不能讀9，回退需相容修正版。沿用revision／requestId與帳號世代，不另建雲端通道。

## 來源與驗收

本輪以網路重新完整閱讀 main 的 game-agent-template、game-development、command-contracts、game.schema、game-release、starter SDK、sdk-versioning、save-compatibility。維持固定ID、desktop、相對路徑、SDK1.1.0／protocol1／tools1.2.0。

只跑角色管理／倉庫交易／歷史遷移／二轉及新戰鬥行為的focused案例，最後型別／內容、build與固定工具ZIP驗證。必要時一輪headless短段，不重跑完整主線或全回歸。正式雲端、完整通關與完整平衡若未操作仍列未驗。不發布。

## 執行進度

- [x] 資料契約與format9保全遷移
- [x] 角色管理與共享倉庫
- [x] 八分支、LUK及進階戰鬥
- [x] 盜賊素材及接線
- [x] focused驗證、候選與交接

71個不同直接相關案例分批通過；最終型別／build、規則內容及固定tools1.2.0 ZIP驗證通過。隔離合成角色的管理、二轉、配點、重載及iframe短段已觀察；完整主線／八分支平衡／正式雲端未驗。自有瀏覽器及兩port已清理，沒有代理或排程。
