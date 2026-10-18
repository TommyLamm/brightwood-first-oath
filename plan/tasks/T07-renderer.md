# T07：世界渲染、鏡頭、動畫與資源生命週期

目的：把共享WorldSnapshot畫成可玩的經典場景，不持有玩法權威。所有權src/render/**。G0後可開工，正式完成依T05及T10–T12；開發占位標示清楚，不當正式素材交付。

目前狀態：核心 renderer 接合已完成；正式資產已到齊，T07-11 視覺驗收仍 **UNVERIFIED**，由 T16 統一檢查。2026-10-18 正式交付為 actors 22 images／64 animations／96 hero anchors、environment 20 images、interface 47 images／5 VFX animations；audio canonical manifest 有16項。請勿沿用歷史紀錄中的舊缺圖數字；素材完成不等於遊戲視覺驗收完成。

公開createWorldRenderer(scene,assetManifests,catalog,heroAnchors?)及loadMap(map)/render/resize/dispose按07；正式app傳入已載入的anchors manifest。scene由app建立，不另建Game或update；catalog只唯讀查表，背包與商店由T08。

## 步驟

- [x] T07-01 建manifest loader，relative URL、key衝突檢查、實際寬高除格數切sprite，不能假設生成圖像固定尺寸。
- [x] T07-02 loadMap先載入theme及本圖actor依賴，Promise成功才顯示；失敗回可重試錯誤，保留舊地圖供app恢復。
- [x] T07-03 按sky/far/mid／platform／actors／foreground／effects固定層級，視差依10；ground沿foothold以16px重疊拼接，platform完整顯示128×32格、以左右各8px透明gutter形成112px有效pitch，水平foothold從有效左緣定位並覆蓋末端；斜坡材質沿真線段旋轉。地圖實際外觀仍待T07-11。
- [x] T07-04 畫梯繩／傳點／NPC名／任務marker，位置皆foot coords；marker由snapshot.questViews及QuestDef giver/turn-in決定。
- [x] T07-05 畫hero三衣服sheet、四武器及三帽，依96×96 frame-top-left anchors讀取有效pose/frame，翻向時同步鏡射；裝備與角色共用逐幀可見腳底修正，不改碰撞／角色foot。
- [x] T07-06 根據movement／attack／hurt／dead選動畫；attack按技能總時長縮放，技能VFX從windup結束開始，VisualEvent VFX按id只播一次，不因動畫callback再次扣血。
- [x] T07-07 畫六怪／boss、掉落物／coins、HP條、telegraph、傷害數字、升級與技能特效；視覺事件按id只播一次。可讀性待T07-11驗收。
- [x] T07-08 鏡頭跟隨玩家，deadzone寬200高120，邊界clamp；基準960×540等比resize，UI不隨世界鏡頭漂。
- [x] T07-09 資源pool與離屏圖像休眠，粒子≤100，傷害字≤30，同屏drop≤60（超出只畫最近，不刪資料）。不提前做無證據的大型效能改造。
- [x] T07-10 dispose清Sprite／timer／listener，切圖不殘留；保留共用角色／UI紋理但不用的圖層可卸載。
- [ ] T07-11 檢查本包型別與所引用asset key，正式資產到齊後查看一組主角動作及一張地圖；不自行啟共用瀏覽器反覆截圖。
- [x] T07-12 report提供Scene接線範例、load failure處理、資產缺項及哪些視覺尚未實測。

完成：世界可由snapshot與正式anchors完整畫出、尺寸改變不重置進度；缺圖不能靜默用色塊假裝完成，缺項明確交主Agent協調素材包。T07-11仍未完成：本包不開瀏覽器，正式視覺檢查由T16統一執行。
