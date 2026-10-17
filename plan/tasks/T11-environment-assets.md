# T11：環境圖層、圖塊與裝飾

目的：七張可玩地圖共享一致風格的正式素材，背景與碰撞分離。所有權public/assets/environment/**、art-source/environment/**。依08/10文件即可準備；manifest按G0型別。不能改MapDef、傳點或renderer來遷就生成結果。

## 步驟

- [x] T11-01 讀T10已交風格參考（若尚無則按10固定色盤先森林樣板），生成一張森林美術樣板，確定主角比例與遠近景層次。
- [x] T11-02 camp主題sky/far/mid三層，空出主要可玩區，無平台／人物烘焙到背景。
- [x] T11-03 town主題三層，小屋與樹木的背景輪廓可辨；店招不含中文文字，文字由T07畫。
- [x] T11-04 forest主題三層供兩張森林重用，用深度與少量裝飾變化，不生成兩份巨圖浪費體積。
- [x] T11-05 rock主題三層供山徑／礦道／arena，搭mine-door／altar營造區別，不能用未宣告第五theme key。
- [ ] T11-06 生成tile-ground/platform/slope與ladder，依10顯示尺寸，可拼接、透明邊緣清楚；線段頂面對齊腳底，裝飾草不改碰撞高度。
- [x] T11-07 生成portal/town-sign/mine-door/altar，portal透明且明顯，玩家看得到落點。
- [ ] T11-08 建environment manifest，env:{theme}:{layer}及env:{prop} key準確，單圖columns/rows1；不產actors/或interface/的資產。
- [x] T11-09 檢視新圖左右可延展性、圖層無明顯重複硬邊、沒有遮住操作區的巨型前景，透明道具真alpha。
- [x] T11-10 正式runtime檔入public/assets/environment，原稿及prompt入art-source，預算16MiB；不要把生成參考大圖放dist。
- [x] T11-11 report列全部keys、圖層比例及建議切圖／拼接方式，先交forest與共用tile讓T07接線，其餘完成再補。

完成：四theme×三層與全部共用props存在且可引用；不以單張風景圖替代整套可玩地形。若不能精確無縫生成，保留自然可遮接縫構圖，明確交T07使用重疊拼接，不暗改世界幾何。


## 本次交付狀態（2026-10-18）

已完成 T11-01–05、07、09–11。T11-06 尚未完成：ladder 已交付，但 ground、platform、slope 候選未通過精確接縫檢查，均只保留於 art-source。T11-08 目前只有 17/20 keys 的 manifest 子集；缺少三種地形，未生成指向缺失檔案的完整 manifest。整包維持 PARTIAL，不能標 DONE。
