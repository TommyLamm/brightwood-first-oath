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

單資產平台重試（2026-10-18）：T11-06 的 env:tile-platform 另做一次定向生成與一次檢視後修正。修正版輸出 2172×724 RGBA，alpha≥32 bounds 為 (169,228,2003,510)；原尺寸不是 128×32，且頂邊仍可見黃／紅色邊線。診斷 128×32 預覽在中心 112px 接合邊有 17/32 行不匹配、RGBA 差值總和 564、最大單行 157。候選與修正版保留於 art-source/environment，明確記為 UNFINISHED、source-only；未新增 runtime 或 manifest 項，也未做像素修補。T11-06 維持未勾選。

## T11-06 fresh terrain attempt — 2026-10-18

`env:tile-platform` 與 `env:tile-slope` 各用一次新構圖及一次定向修正，均依指定參考使用內建 ImageGen 與透明背景；生成原圖不經像素改動複製至 `art-source/environment/`。平台修正版預覽在 112px active pitch 邊界 13/32 列不匹配（RGBA delta sum 484、max 125），頂列 alpha 覆蓋 111/112 列；預覽左右 8px 透明側欄是診斷時補的 padding，不能證明來源側欄達標。仍有波浪碰撞面與紅／黃色邊色，拒收。

斜坡修正版 128×128 預覽左右 120/128 列不匹配（RGBA delta sum 9,166、max 343），頂列 alpha 覆蓋 48/128 欄；-16° 旋轉檢視仍見亮色側邊與裁角，拒收。完整輸出／預覽路徑、alpha bounds、hash、工具時間和檢查詳見 `art-source/environment/source-log.md`。斜坡 ImageGen 的逐字 prompt 無法從保留的 tool transcript 取回，source log 僅記錄可確認的 prompt 範圍，沒有假稱逐字原文。

兩個 key 皆 source-only，沒有 runtime PNG 或 manifest row；manifest 仍 18/20，T11 保持 PARTIAL，T11-06／T11-08 未勾選。T07 當前 platform TileSprite 仍按 128px manifest display width 重複，與 112px active tile pitch 規格不一致；本次局部影像檢查不宣稱 runtime seam、旋轉整合或 renderer 通過。未跑 build、typecheck、tests 或 browser。

## T11-06 fresh composition and one targeted correction — 2026-10-18

Per follow-up dispatch, each missing key received one fresh built-in ImageGen composition and one edge/top-geometry correction, using explicit local references and `transparent_background=true`. The four unmodified generated outputs are retained in `art-source/environment/`; source SHA-256 values match their generated originals. Both corrections failed and remain source-only:

- `env:tile-platform`: the correction still has 2,237 nontransparent pixels in the nominal 8px gutters, no active alpha on the top row (0/1,902), and 161/723 mismatching active-edge rows (RGBA delta 5,858); visual inspection shows red/yellow top fringe and lower protrusions.
- `env:tile-slope`: the correction has top-row alpha on only 21/1,254 columns and 60/1,254 left/right edge mismatches (RGBA delta 60); visual inspection shows a wavy grass edge and red/yellow fringe.

No crop, resize, pixel repair, renderer change, or runtime/manifest edit was made. The environment manifest check still finds 18 unique keys, precisely platform and slope missing, no unresolved listed URL, and 16,230,704 referenced runtime bytes. T11-06 and T11-08 remain unchecked; the pack remains PARTIAL. Full prompts, hashes, dimensions, source paths, metrics, and visual notes are in `art-source/environment/source-log.md`. No build/typecheck/tests/browser/full-pack check was run.

## env:tile-platform low-saturation fresh attempt — 2026-10-18

另做一次全新構圖，採用低彩度 moss-sage 頂面、muted warm-gray 土層與少數大塊像素，避免既有高彩 grass/soil/teal details；本次只呼叫一次 ImageGen，沒有第二次修正。輸出 `art-source/environment/env-tile-platform-t11-06-moss-sage-fresh-20261018.png` 是 1983×793 RGBA，而非 128×32；四角透明，raw alpha bounds `(90,64,1915,775)`，alpha≥32 bounds `(207,314,1777,533)`。診斷預覽平頂覆蓋 112/112 欄，但 112px active edge 有 11/32 列 RGBA 不一致（delta sum 359、max 227），且預覽仍見 14 個符合記錄閾值的黃調像素。拒收為 source-only / UNFINISHED；沒有 runtime PNG 或 manifest row，T11-06／T11-08 不勾選，manifest 維持 18/20。完整 prompt、refs、路徑、時間、SHA-256 及檢查在 `art-source/environment/source-log.md`。不驗證 renderer seam，也未跑 build、typecheck、tests、browser 或 full-pack 檢查。
