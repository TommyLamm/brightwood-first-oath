# T09：本機／雲端進度及失敗安全

目的：角色可跨次恢復，任何讀取／網路失敗都不覆蓋舊資料。所有權src/persistence/**、tests/persistence.test.ts。依賴G0，正式內容驗證T01/T05；SDK正式adapter由T15，不修改vendor／平台API／UI。

公開validateSave、createPersistence與initialize/checkpoint/retry/invalidate/dispose按07。CloudPort可注入fake作純邏輯檢查，不能用fake聲稱真實帳號保存通過。

## 步驟

- [x] T09-01 建format1 SaveData驗證：有限整數、等級／exp／點數／skills範圍、合法job、24物品ID、stack／bag32／equipment槽、quests狀態及counter、settings數值／bindings。
- [x] T09-02 已知map但壞spawn可修到該圖left，未知map修到town/center（visited含town）否則camp/start，回報修復；未知物品／技能／格式不能默默丟掉，拒絕套用並保留原始檔。
- [x] T09-03 JSON UTF-8使用TextEncoder計算，內部48KiB預警，超64KiB或深32拒寫，不截斷。只序列化SaveData，無Phaser物件／循環／NaN。
- [x] T09-04 StorageLike注入，本機key正式`maplewood-swordsman:save:v1`、開發加`:dev`。讀到null才新角色，parse／storage錯誤顯示loadError／memory，不remove原資料。
- [x] T09-05 initialize等待CloudPort.ready；authenticated且progressAvailable走cloud，guest/standalone走local；preview只用診斷連線，不讀寫正式local。ready等待不阻塞title畫面。
- [x] T09-06 cloud先load，成功null才revision0，成功record驗format/data再ready；拒絕不能當null，不允許checkpoint上傳初始值。preview即使progressAvailable=false仍可走診斷load/save，不誤當帳號模式。
- [x] T09-07 checkpoint clone不可變快照，正常合併至少15秒間隔、重要檢查點可立即排入但單寫入且≤60/min；不依賴beforeunload。尚有未確定保存結果不讓後快照超車。
- [x] T09-08 每筆新快照生成requestId，成功saved:true採revision並標saved；null顯unavailable/previewOnly，不標帳號saved。local成功標localSaved。
- [x] T09-09 timeout／回應遺失保留同data/revision/requestId，retry原輸入；新變更排後續快照，不偷換內容用原ID。retry在loadError時重新initialize載入、在saveError時重試固定快照；conflict/incompatible/authLost不自動重送。SDK不自動重試。
- [x] T09-10 SAVE_REVISION_CONFLICT→conflict停止寫，供app重新initialize載入雲端；REQUEST_ID_REUSED／SAVE_FORMAT_INCOMPATIBLE停止原隊列；401/403→authLost。缺machineCode的409保守停，不自加revision。
- [x] T09-11 invalidate增加generation token並取消pending；舊promise回應不能再改revision/status。app離開持久化session（暫時遊玩、雲端重載、dispose或已知身份/session失效）先invalidate；同一保存session只返回title時保留排隊中的checkpoint；訪客檔不自動匯cloud，cloud失效不自動落local。
- [x] T09-12 存檔包含安全出生ID不含當前戰鬥；arena續玩時app轉mine-gate/right，避免載入時立刻被首領攻擊；不清主線狀態。
- [x] T09-13 測成功null初始、讀取失敗無save呼叫、壞本機原檔保留、64KiB、同ID重試、revision衝突無覆寫、舊回應token、preview不正式保存。只跑persistence.test.ts。
- [x] T09-14 report提供fake／真CloudPort注入例、每SaveStatus UI語意、app如何重新載入雲端／臨時遊玩，區分未做實際平台驗收。

完成：沒有「捕捉所有錯誤後返回空存檔」的捷徑；拒絕與成功null嚴格分開，只有真saved:true當保存證據。無直接帳號／管理／snapshot恢復API。
