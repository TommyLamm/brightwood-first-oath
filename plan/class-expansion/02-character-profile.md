# 53-02・多角色資料、容量與遷移

2026-11-06，Asia/Hong_Kong。狀態：DONE。

母計畫：[Plan53](../53-class-expansion-roadmap.md)。執行入口：[小Plan索引](README.md)。對應：W02。

## 目標與範圍

- 建立最多四角色的profile及穩定角色ID，保留原角色的所有資料。
- 格式6讀取／驗證／舊1–5遷移、備份確認、48KiB預警／64KiB上限。
- 沿用同一SDK revision與保存佇列；異常停止寫入。

## 順序與完成條件

前一個一期小Plan完成並記錄結果後再開始；後續職業依母計畫的階段邊界處理。 不啟動自動派工／排程，不操作真實玩家存檔；發布不在此次授權內。規格來源沿母計畫第2節，本輪開始已重新完整讀取。

## 最小驗證

- 原件保全、無效資料拒絕與遷移冪等。
- 最大合法profile容量。
- 保存失敗、重試與衝突的focused案例。

## 執行結果

- 新增 `GameProfile`／`CharacterSave`、四個固定欄位、穩定角色ID、共用設定與逐角色進度驗證。`plannedJob`只保存在player，避免profile與player兩份路線互相矛盾。
- persistence保存整份profile；既有世界模擬仍使用active角色投影，checkpoint只更新該角色，其他角色資料完整保留。共用一份revision／序列佇列，原請求重試先於新快照；失效世代仍拒收舊回覆。
- 格式讀1–6／寫6，舊1–5只在副本轉入固定`legacy-1`；不複製、不重給獎勵。沿用玩家明確備份升級流程，新增備份後寫入前的來源競爭檢查。錯誤／未知格式及超容量不寫入、不截斷。
- 角色HP／MP與裝備、技能職業檢查沿用共同規則。空profile及主動未選角狀態合法；懸空ID拒絕套用並保留原件，不猜測角色。
- `public/game.json`同步讀1–6／寫6，候選版本提高至beta.86（package／lock一致），尚未build或發布。升級說明明示原角色保留、四個欄位及舊版不能讀6。
- 容量樣本：四名Lv30角色、24字多位元名稱、32格滿堆疊、全部任務／地圖、64組各64字的最大按鍵欄位，序列化為 **39,913 UTF-8 bytes**，低於48KiB預警及64KiB上限。樣本見`tests/fixtures/full-character-profile.ts`。舊版允許較長名稱，遷移保留全文；若整份資料因舊長名稱超限則拒絕升級，不能以樣本大小聲稱所有任意文字必然容納。
- 實際檢查：Node24.22.1型別檢查通過；8份存檔相關檔案98案例通過，設定抽取／升級文字調整後只重跑受影響的character-profile、persistence及world-progress（37案例，包含新增2案例及5個world-progress案例），本步共105個不同相關案例。無全回歸、browser、正式雲端或真玩家資料操作。
- 本輪重新完整讀取範本、game-development、command-contracts、Manifest Schema、release workflow、SDK、sdk-versioning及save-compatibility的main文件；終端機DNS失敗，網路工具成功取得完整文件。平台正式格式6保存／跨設備驗收仍待正常相容版本環境，不以mock稱正式通過。
- 下一步53-03：選角／空位建角與安全切換；目前尚沒有完整可玩的弓箭手。

