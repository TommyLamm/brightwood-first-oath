# 遠古遺跡 C：誓鐘司鐘者 atlas 組裝交接

日期：2026-10-25（香港時間）。Owner：C boss atlas assembly。只新增司鐘者 atlas、其來源／組裝記錄與 `public/assets/actors/manifest.json` 的 boss 項目。

## 已讀規格與範圍

- 已讀 `AGENTS.md`、`plan/14-ruins-bell-sanctum.md` 第 5／8／9 節、`plan/reports/ruins-c-{profiles,motion,slam-hurt,sweep-dead,scene-audio}.md` 及各素材 metadata。Playroom 模板及七份線上規格沿用主代理在同一開發任務的完整閱讀紀錄，見 `plan/reports/ruins-c-dispatch.md`。
- 本批只使用已接受的 22 個 normalized 姿勢；未重生、替換或修改任何 canonical raw／normalized 圖。正式圖集是 1152×960 RGBA、6×5 格、每格 192×192、display 192×192、pivot (0.5, 1)。
- 驗收含逐格核對 raw／normalized SHA 與 metadata、alpha 邊界／pivot、22 格像素唯一性、8 個 unused cell 精確複製、manifest 原項目保存、atlas 像素回讀與 PNG 輸出預算。

## 逐格來源與 SHA-256

表內 SHA 為來源檔案 SHA；每列的 raw 與 normalized 完整相對路徑、bytes、來源 item／savedPath、metadata 記錄，以及 atlas cell decoded-pixel SHA 均收在 `art-source/ruins-c/assembly/metadata/ruins-bell-keeper-atlas.json`。

| Cell | 姿勢 | Canonical normalized 檔 | Raw SHA-256 | Normalized SHA-256 |
| ---: | --- | --- | --- | --- |
| 0 | idle-0 | `profiles/normalized/ruins-bell-keeper-idle-0.png` | `edb67c5bc556a7a0953610aff549766f7f9011193d5f289c21525e2de7c30551` | `b84e99a7c09ec79bd249c1181f4759d4d6cdbf8541211c9bc892cd66bbd9df41` |
| 1 | idle-1 | `motion-frames/normalized/ruins-bell-keeper-idle-1.png` | `e53fadc79ca70f5d21c7143688fbcd5e81991cc35f58a85f63fa25d090f44555` | `6f3523680604916f43012d7dbb527a503913c21eb09251521ea29deaa3b7f74d` |
| 2 | sweep-windup-0 | `sweep-dead-frames/normalized/ruins-bell-keeper-sweep-windup-0.png` | `29aa310d2c9e81843550ceed221cfc04827f767980d2bf377cb635c5e5c8e672` | `2e08375b3c4c15e6d7d6a67d46cd97190c18b805876c4011c09126055866396a` |
| 3 | sweep-windup-1 | `sweep-dead-frames/normalized/ruins-bell-keeper-sweep-windup-1.png` | `b305054e003cc87c69cf672ffa5060386fe8814592994e0a2101f27bcbc87f42` | `38cc912419443baccc11af80f785a1d7a7ce67703cff358c533313e54a17014a` |
| 4 | sweep-active | `profiles/normalized/ruins-bell-keeper-sweep-active.png` | `2c32c490942c215d6e99cb53fcba4cae8c873e8eb38c2fcab5076c30f7f0277e` | `bf2fa533873c01f3ed6742442a27b66aa62cceb8807a2b0cfc7e64ed18b9d975` |
| 5 | sweep-recovery | `sweep-dead-frames/normalized/ruins-bell-keeper-sweep-recovery.png` | `2b342314789501c6dfbaa8df78e2212d2992ed443298bc9ef3be388b7776f044` | `8764484ad121ad98f7c1d61d33ce2084e7fd33cc859d889e0afae7b534f4a884` |
| 6 | walk-0 | `motion-frames/normalized/ruins-bell-keeper-walk-0.png` | `cf3a04f7e39291ef60596e75995fbdebb44ddc1521a5d305f25b65e5464b0150` | `b6168991735f62b5004fec37dcc6bb2dd1063df4db8d1f05642ee44b37088dd6` |
| 7 | walk-1 v3 | `motion-frames/normalized/ruins-bell-keeper-walk-1.png` | `eca3a553ca75d2f1ef3152735d92a1cf5b323d0ace3dcb9a3a4f353ae96961e5` | `f0708ffbefd46a2b3b2784562acbd0e8e1d146f42dc1229f202d257de44f8b6b` |
| 8 | walk-2 | `motion-frames/normalized/ruins-bell-keeper-walk-2.png` | `e5cfd37f038a9cf2b734f20e6038140020cc9c651f55b0c3a38524b8f10e152b` | `02a982600608fe0319ca9691b21be0bd12a334639d3b13a47d40425fcc9fcdc9` |
| 9 | walk-3 v3 | `motion-frames/normalized/ruins-bell-keeper-walk-3.png` | `c6bb6c0666b8c6acd8dc063c387141198888f79419bf37a6c7974ead0db1f33a` | `74bc99870dde6cadbf979d4b0dbdc1672350961a6738cabed5ae059b2babfbce` |
| 10 | walk-4 | `motion-frames/normalized/ruins-bell-keeper-walk-4.png` | `a42d1b01277dbcdce6b66fd9fd1c5a61dcf01b9f78fa88cd593237b358d2f02a` | `6be65a813b1f74f975c471687c94339f99ecba641891ef1fc12145dcd5f8f5b1` |
| 11 | walk-5 | `motion-frames/normalized/ruins-bell-keeper-walk-5.png` | `a1576d4d61504f02089b06695f114b3db9e0e0225201c95f0cd256801625abce` | `74fb40220130375da1c5d39e80d673d14f56a7e285d1f9547cdf40a9f062a5eb` |
| 12 | slam-windup-0 | `slam-hurt-frames/normalized/ruins-bell-keeper-slam-windup-0.png` | `e9572aee72a11373978a722a99d21869f8f85d33ea3a5b662fbdd7a0500f4bed` | `84364dd4c387c8620941013b418eaec690f976853d65e95015746a66b4aa6e42` |
| 13 | slam-windup-1 | `slam-hurt-frames/normalized/ruins-bell-keeper-slam-windup-1.png` | `593d1841d3da605d9cc44ecb07fdc9b7606d3aa829ad8238cecb85de2673f7de` | `3870f9be42412ec9119a3c4ef9dcc2f47ba97a702a637e68aa76cd09a6abfa02` |
| 14 | slam-active | `profiles/normalized/ruins-bell-keeper-slam-active.png` | `932bdb057305318be71ebf48478bd8facf47daf1d7d97930ef3db0c893648c4a` | `bea8cf5e3da93ea2bd74d24682e0cbfbcbe112af9870c89027093267a81ba6d6` |
| 15 | slam-recovery | `slam-hurt-frames/normalized/ruins-bell-keeper-slam-recovery.png` | `2764e274406d5568fc6a08d1752bf1be8fa263ae073e5ae57ab663167c7efa8a` | `69b2691d6873afc367604197a2c31a846835386e54e35cf23bb63d0a9776bfe4` |
| 18 | hurt-0 | `slam-hurt-frames/normalized/ruins-bell-keeper-hurt-0.png` | `e9a13982b112678b133fb4336cc9b12656d730ec40f90eed11bef30d05b70654` | `e74a788df6dc5d796291a7cfe2c108e7e65aca0d6e373f796c96784c40244001` |
| 19 | hurt-1 | `slam-hurt-frames/normalized/ruins-bell-keeper-hurt-1.png` | `82ae4d2c3824cec9adc50e2b67dc33a09895b477395b8dbdcd2a085fd92b0b38` | `433dd8c2422ed3eacdfa31e19d26874477bbcc4f69db149144e126b1767f9b66` |
| 24 | dead-0 | `sweep-dead-frames/normalized/ruins-bell-keeper-dead-0.png` | `641e5ffbde23125e52c0f6a472d7ee1c5b8c4a833774ef056bc4e84c0b77252f` | `9f8ca2ce41c31b014c7e590f1298ba9258755fae0a60284fd595667db0166ab6` |
| 25 | dead-1 | `sweep-dead-frames/normalized/ruins-bell-keeper-dead-1.png` | `dec8907ed88c4e1e50da14b226f8d4ee05f081dd7698ae8b8e04b01de615fd68` | `d8dca18166b54d5d2881186795673b9e00bf740648a168b28bf472e4095eb6e4` |
| 26 | dead-2 | `sweep-dead-frames/normalized/ruins-bell-keeper-dead-2.png` | `8114f8309cf876988146b049bc87ad11a18ec84a15f8515e4938f64e39d9950f` | `b5dffae970329f18818dae6ba882eb3dca756022ffcfc416591154bce7089212` |
| 27 | dead-3 | `sweep-dead-frames/normalized/ruins-bell-keeper-dead-3.png` | `d7aede70adf2813cf7706f11bceb65225d929c95dee890fdd4dead298f4b6134` | `a3ceb55c5b3fb31c17bcece72c96827bb61a42c60f1b01af13967480cdea2fca` |

Cells 14 與 4 分別直接重用 profiles 的 slam-active／sweep-active 正規化稿。walk-1、walk-3 採用 metadata 註明的 v3 接收稿，沒有取用拒稿候選。

## Atlas、unused 格與 animations

- Runtime atlas：`public/assets/actors/monster-ruins-bell-keeper-v1.png`，1152×960 RGBA，914,509 bytes，SHA-256 `0cfe33f6cc6ce3c349fdd2b04edd352c2c942f32c45677fc21c9dada67727be6`。
- 唯一必要調整是 cell 9：canonical walk-3 alpha bounds `[4,71,187,189]` 的像素中心為 x=95，向右平移一像素後 bounds 為 `[5,71,188,189]`，中心 x=96，四邊透明 margin L/T/R/B 為 5/71/4/3，最低 alpha 列仍為 y=188。沒有裁切、沒有丟棄可見像素，原 normalized 保持不變。單獨調整副本 `art-source/ruins-c/assembly/adjusted/ruins-bell-keeper-walk-3-center96.png` 為 39,982 bytes，SHA-256 `2b07ebe0e7ec184a1f945893a81e7038d867dc437b885d4c1162672c2d92ab0e`。
- 其餘 21 個姿勢不調整。22 個有效 cell 的 decoded RGBA pixel SHA 全部不同。

| Unused cell | 精確複製來源 |
| ---: | ---: |
| 16, 17 | 15 |
| 20–23 | 19 |
| 28, 29 | 27 |

六個 animation 已追加，順序與時間按 plan14：

| Animation key | Frames | Frame ms | Loop |
| --- | --- | --- | --- |
| `ruins-bell-keeper:idle` | 0, 1 | 200, 200 | true |
| `ruins-bell-keeper:attack-sweep` | 2, 3, 4, 5 | 600, 600, 100, 1000 | false |
| `ruins-bell-keeper:walk` | 6–11 | 120 × 6 | true |
| `ruins-bell-keeper:attack` | 12–15 | 450, 450, 100, 1000 | false |
| `ruins-bell-keeper:hurt` | 18, 19 | 100, 100 | false |
| `ruins-bell-keeper:dead` | 24–27 | 100 × 4 | false |

## Manifest 與配套預算

- 組裝開始時 actors manifest 已包含配套 owner 交付的 `equip:oathfarer-circlet` 真實 overlay 項目。其既有 40 個 image entries、116 個 animation entries 的值與順序保持原樣；本批只在 images 尾端追加 `actor:ruins-bell-keeper`，並在 animations 尾端追加上述 6 筆。manifest image count 為 41、animation count 為 122。
- Assembly 開始 manifest SHA-256：`c953614a1c42220467e8a2adb1f2839b8b2610cda1137458f10ee2c4ac62b0a9`；追加後：`5e1e836a2df072f0e79da6b2ac4be608dcc816af34b7e1460409fb6f43a75535`。組裝腳本以原 JSON array 與新增後 array prefix 比較，確認舊 image／animation objects 完全相等。
- 場景／音訊交接所列 10 個配套 runtime 檔合計 6,645,080 bytes；加上 atlas 後 C runtime 合計 7,559,589 bytes，低於 9 MiB（9,437,184 bytes）上限，餘 1,877,595 bytes。

## 自審、來源檔與檢查

- 中性灰 RGB(58,58,58) 背景、JPEG quality 70 接觸表：`art-source/ruins-c/assembly/review/ruins-bell-keeper-atlas-contact.jpg`，1152×960，179,026 bytes，SHA-256 `50c6d4a211d4569321ddd8edb348e77e7ec31e2d4f841a7c2b46b5500c8690ca`；細胞標出 cell 與姿勢／unused 複製來源。
- 動作對照縮圖：`art-source/ruins-c/assembly/review/ruins-bell-keeper-key-poses.jpg`，768×768，JPEG quality 70，61,970 bytes，SHA-256 `a2b91d6c80fe7a063e1fbf8a33869f96746d0ab0d5f25c67f80ba528c3e7c28b`；對照 idle-0／slam windup 起始及低掃／垂鐘 active。
- 審圖可見四足、白石面具、青銅框架與懸鐘身份一致；垂鐘重擊 active 與橫向低掃 active 明確可分；六格 walk 在接觸表中呈現不同踏步、抬足與支撐姿勢。22 個有效姿勢像素互不相同；unused cell 像素逐格等同指定來源。
- 組裝程式與完整來源 metadata：`art-source/ruins-c/assembly/build-bell-keeper-atlas.py`、`art-source/ruins-c/assembly/metadata/ruins-bell-keeper-atlas.json`。metadata 為 55,579 bytes，SHA-256 `7f3fd6d8430e98679f31cef96b6d79171714d80ba725ccaf754fc0c7ad49cdd3`；記錄每格 raw／normalized 路徑與 SHA、來源 metadata、decoded pixel SHA、調整副本 SHA、unused 複製關係、manifest hash、預算及兩張審圖縮圖的路徑與 SHA。
- 已執行 `python art-source/ruins-c/assembly/build-bell-keeper-atlas.py`：逐格來源檔與 metadata SHA 相符；22 格尺寸、RGBA、alpha>0 bounds、pivot x=96、y=188 與透明邊符合；unused 副本逐像素相同；atlas PNG 輸出回讀逐像素相等；manifest 原 arrays 保持；C runtime byte budget 通過。第二次執行 atlas SHA 相同，接觸表重建時一併標出 unused cell 的實際複製來源，manifest 未重複追加。
- 未執行 typecheck、遊戲測試、build 或 browser；未檢查遊戲中的 loader／首領播放、姿勢遮擋與實際動畫時長。這些交 integration owner 接續驗證。
