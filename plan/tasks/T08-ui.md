# T08：完整HTML遊戲介面及命令輸出

目的：玩家能透過介面完成全部主線操作，不只展示數字。所有權src/ui/**。G0後可開工，實際內容來T01/T05，正式皮膚T12。禁止改app／contracts或直接呼叫domain寫進度。

公開createUi(root,dispatch)→render/setPanel/isInputCaptured/dispose按07。UI發不含seq的CommandDraft，app提供的dispatch包裝器統一補seq並驗證；UI與鍵盤不各自編號。輸入與移動綁定在app，UI只報焦點，面板按鈕發setPanel／closePanel，不另綁戰鬥鍵。

## 步驟

- [x] T08-01 建title的繼續／新角色、create名稱欄／確認、loading／錯誤／暫停／死亡／結果畫面。取代角色明確二次確認，不能隱藏重置。
- [x] T08-02 建HUD：名稱、職業、L、HP/MP數字條、EXP、coins、快捷欄、目前地圖；不足MP／未學技能顯示狀態。
- [x] T08-03 背包32格、分類、堆疊、物品tooltip、選取與使用／裝備／出售；tooltip含需求／能力／價格，不做未實作的拖曳交易。
- [x] T08-04 裝備三槽與卸下按鈕，能力面板STR/DEX/AP及+1按鈕，derivedStats顯示；不能在render自動花點。
- [x] T08-05 五技能rank／需求／SP／學習按鈕，快捷1/2/3對應，隱藏敵招及不可學basic；未學狀態仍有說明。
- [x] T08-06 任務available/active/ready/claimed分組、目標進度、給交NPC、獎勵；NPC對話提供accept／claim，所有交易結果由app回toast。
- [x] T08-07 商店顯示可買裝備／藥水、數量1..99、總價與背包賣出；不給任務物出售按鈕，但app仍驗證。
- [x] T08-08 地圖列已訪七區／當前位置／傳點條件，提供returnTown命令，arena交戰中依view顯禁用原因，不跳網址。（UI 的所有回城按鈕以 `view.canReturnTown` 禁用，dispatch handler 也以同欄位阻止無效命令；地圖面板明確顯示首領戰期間不能回城的原因。已核對 app gate：一般非城鎮地圖於 playing/result 可回城，guardian-arena 僅 bossResult 後可回城。）
- [x] T08-09 設定master/music/sfx/mute、改鍵、操作說明；不允許同一動作多鍵衝突，保留Esc關頂層，儲存Settings命令由app套用。
- [x] T08-10 儲存狀態精確區分本機已存／雲端已存／保存中／預覽未正式保存／失敗／衝突／登入失效；loadError給retrySave與playTemporary，conflict只提供載入雲端版本，不自動覆蓋。
- [x] T08-11 960×540預設、640×360仍能捲動視窗，頂層panel關閉順序固定，拖移若提供則clamp可達；文字用textContent，名稱不插HTML。
- [x] T08-12 dispose移除監聽，render不反覆重新綁事件／丟失文字焦點；不自行new遊戲或更改localStorage。
- [x] T08-13 純布局／文字不新增測試、不開瀏覽器；只確認實際匯出／命令完整，最終一次整合操作由T16負責。
- [x] T08-14 快捷欄、背包、裝備、技能與商店按正式 `UiSnapshot.interfaceManifest` key 顯示介面圖示；快捷欄按鍵從 `settings.bindings` 讀取。manifest 缺 key 或圖片載入失敗時保留明確提示，移除過期 T12/T05 暫用版面標籤。

完成：每個承諾功能有可用操作和錯誤訊息，非假按鈕；report列所有GameCommand發送點與app需要提供的view欄位。缺欄位報主Agent改contracts，不私讀全局。
