# T02：角色移動與foothold碰撞

目的：提供與畫面無關、可供玩家及怪物重用的經典走跳。所有權：src/domain/movement/**、tests/movement.test.ts、src/content/dev/movement-lab.ts。依賴G0，正式參數用T01；未到可用時在測試建立文件規格fixture，不新增正式規則副本。

公開介面嚴格按07：createMovement、stepMovement；無Phaser／DOM／真實時間。輸入foot pivot、固定dt、nowMs及MapDef，回新MovementState。

## 步驟

- [x] T02-01 建createMovement初始airborne／速度0／facing1／無foothold梯繩；死亡狀態固定不動。
- [x] T02-02 左右速度直接採config.speed、放開即停，空中可改水平；左右同按moveX=0由輸入層處理。nowMs<knockbackUntilMs時保留既有vx，不受輸入覆蓋，垂直仍有重力；初始化knockbackUntilMs=0。
- [x] T02-03 grounded才可jumpPressed起跳，vy=jumpVelocity、清foothold；無二跳／coyote／跳躍緩衝，固定單跳基準。
- [x] T02-04 重力及終速、用前後腳底位置掃越線段求落地；只下降且由上往下跨平台才落地，選最早碰到地形，斜坡用線性插值。
- [x] T02-05 ground水平移動接相鄰線段或離地；斜坡不抖動、不任意吸到高處平台。牆與頭頂依walls阻擋，不能把上方單向平台當天花板。
- [x] T02-06 下＋jump只對dropThrough=true平台啟用300ms忽略該層、輕推向下；主地面不可下跳，不能穿地面。
- [x] T02-07 與梯x距≤16且範圍相交時，按上下入climbing，吸x、vy按climb90；停爬凍位置，jump可離梯；頂端到平台腳底，底端正常落地。
- [x] T02-08 限制世界邊界，若超height+100回該圖left出生，避免壞位置永久掉落；安全修正回傳狀態，不讀存檔。
- [x] T02-09 建movement-lab包含地面／斜坡／薄平台／牆／低頂／梯，不進正式world七圖清單。
- [x] T02-10 測落地、高速下降、平台下起跳、斜坡轉換、下跳、梯頂／跳離、死亡不動；單跑movement.test.ts。
- [x] T02-11 report列行為、容許誤差、實際測試及T07灰盒可用fixture。調參需求報主Agent／T01，不改其他包。

## 完成條件

固定tick路線可重現，不隨顯示FPS改跳高；角色站在y=地形，外觀換裝不影響碰撞。沒有畫面只能宣稱純邏輯檢查，實際手感對照由T14整合後做一次。
