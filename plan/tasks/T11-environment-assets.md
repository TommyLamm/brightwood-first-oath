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

已完成 T11-01–05、07、09–11。T11-06 尚未完成：ground 已作正式素材並需 T07 每格重疊 16px；platform 與 slope 經舊候選／修正及本次各一次新構圖生成與一次定向修正後，目標尺寸仍見亮色 alpha 邊緣與接縫，不採用、保留 source-only。T11-08 manifest 仍有 18/20 keys；不加入缺少的 platform、slope 占位項。整包維持 PARTIAL，不能標 DONE。

本次 follow-up（2026-10-18）：平台 128×32 修正版左右邊界 28/32 行不匹配，RGBA edge delta sum 414、max 60；斜坡 128×128 修正版左右邊界 121/128 行不匹配，delta sum 27,615、max 546。兩者在目標尺寸均仍見亮邊；已停止重試，保留原稿／修正稿與預覽於 `art-source/environment/`，沒有像素修補或 runtime／manifest 變更。完整 prompt、來源路徑、尺寸、hash 與檢查在 `art-source/environment/source-log.md`。
