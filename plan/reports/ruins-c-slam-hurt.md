# Ruins C Bell Keeper: Slam and Hurt Frames

日期：2026-10-25。此批只交付首領姿勢來源；沒有改 public、manifest、atlas、runtime 或程式。

## 規格與參考來源

- 依 `plan/14-ruins-bell-sanctum.md` 第 5 節及第 8 節：6×5 atlas 的 attack cells 12–15、hurt cells 18–19；cell 14 重用已核准的 slam-active。每格 192×192、朝右、四足完整、x 中心 96、alpha 最下像素 y=188、四邊至少 3px 透明。
- 已讀 `AGENTS.md`、imagegen skill、`art-source/ruins-c/profiles/metadata/ruins-c-bell-keeper-profiles.json`、idle 與 slam-active prompt；三張共同參考（idle、slam-active、sweep-active）先以 1000px、JPEG q70、中性 RGB(70,70,70) 檢視。Playroom 遠端模板及七份規格依主代理本輪完整網路讀取及 `plan/reports/ruins-c-dispatch.md` 記錄沿用。
- 使用內建 image_gen、請求真透明背景。各張完整 prompt、實際提交 prompt、輸出 savedPath/item id、SHA、拒收原因及正規化細節存於 `art-source/ruins-c/slam-hurt-frames/metadata/ruins-c-bell-keeper-slam-hurt-frames.json` 與 `prompts/`。

## Cell 來源

| Cell | 姿勢 | Raw PNG | Raw SHA-256 | Normalized PNG | Normalized SHA-256 |
| --- | --- | --- | --- | --- | --- |
| 12 | slam-windup-0 | `art-source/ruins-c/slam-hurt-frames/raw/ruins-bell-keeper-slam-windup-0.raw.png` | `e9572aee72a11373978a722a99d21869f8f85d33ea3a5b662fbdd7a0500f4bed` | `art-source/ruins-c/slam-hurt-frames/normalized/ruins-bell-keeper-slam-windup-0.png` | `84364dd4c387c8620941013b418eaec690f976853d65e95015746a66b4aa6e42` |
| 13 | slam-windup-1 | `art-source/ruins-c/slam-hurt-frames/raw/ruins-bell-keeper-slam-windup-1.raw.png` | `593d1841d3da605d9cc44ecb07fdc9b7606d3aa829ad8238cecb85de2673f7de` | `art-source/ruins-c/slam-hurt-frames/normalized/ruins-bell-keeper-slam-windup-1.png` | `3870f9be42412ec9119a3c4ef9dcc2f47ba97a702a637e68aa76cd09a6abfa02` |
| 14 | slam-active (reused) | `art-source/ruins-c/profiles/ruins-bell-keeper-slam-active.png` | `932bdb057305318be71ebf48478bd8facf47daf1d7d97930ef3db0c893648c4a` | `art-source/ruins-c/profiles/normalized/ruins-bell-keeper-slam-active.png` | `bea8cf5e3da93ea2bd74d24682e0cbfbcbe112af9870c89027093267a81ba6d6` |
| 15 | slam-recovery | `art-source/ruins-c/slam-hurt-frames/raw/ruins-bell-keeper-slam-recovery.raw.png` | `2764e274406d5568fc6a08d1752bf1be8fa263ae073e5ae57ab663167c7efa8a` | `art-source/ruins-c/slam-hurt-frames/normalized/ruins-bell-keeper-slam-recovery.png` | `69b2691d6873afc367604197a2c31a846835386e54e35cf23bb63d0a9776bfe4` |
| 18 | hurt-0 | `art-source/ruins-c/slam-hurt-frames/raw/ruins-bell-keeper-hurt-0.raw.png` | `e9a13982b112678b133fb4336cc9b12656d730ec40f90eed11bef30d05b70654` | `art-source/ruins-c/slam-hurt-frames/normalized/ruins-bell-keeper-hurt-0.png` | `e74a788df6dc5d796291a7cfe2c108e7e65aca0d6e373f796c96784c40244001` |
| 19 | hurt-1 | `art-source/ruins-c/slam-hurt-frames/raw/ruins-bell-keeper-hurt-1.raw.png` | `82ae4d2c3824cec9adc50e2b67dc33a09895b477395b8dbdcd2a085fd92b0b38` | `art-source/ruins-c/slam-hurt-frames/normalized/ruins-bell-keeper-hurt-1.png` | `433dd8c2422ed3eacdfa31e19d26874477bbcc4f69db149144e126b1767f9b66` |

## 正規化及視覺審查

Raw 圖保留不變。5 張 raw 均為 RGBA 1254×1254。將 raw alpha <8 設為透明，再只按 alpha≥8 的外框裁除透明留白；以 premultiplied RGBa LANCZOS 等比縮至最多 186×186，完整置入 192×192 透明畫布。沒有裁到非透明肢體。每張 normalized PNG 的 alpha>0 bounds、SHA 及 offset 已記入 metadata；五張皆驗證 bounds 中心 x=96、exclusive bottom=189（最後非透明 y=188）、左右各 3px、底 3px 透明，上邊至少 46px 透明。

已在中性底逐張檢視 raw JPEG 縮圖（1000px、q70）與 normalized 預覽（768px 最近鄰放大、q70），預覽皆保存在本子目錄 `review/`。五個選定姿勢維持朝右的青銅四足、白石面具、單一懸鐘身份：windup-0 抬鐘初始蓄力；windup-1 四肢屈曲且鐘收高；recovery 離開撞地低位並回彈；hurt-0 強烈向後回震；hurt-1 回震收束但仍非 idle。四足、完整石足與附件可辨，未見碎裂成另一隻怪物。

windup-0 candidate 01 因與 idle 過於相近而拒收，raw 與 q70 review 均保留於 `rejected/`、`review/`，SHA 與理由在 metadata。candidate 02 入選。前兩次 windup-0 的 Get-Content stdout 意外包含固定 PowerShell InitializeDefaultDrives 警告前綴；實際提交字串已保留為 `*.actual-submitted.txt`，metadata 明記此事。後續四個生成 prompt 在提交前移除該警告。nested image_gen 結果只提供 image_url/output_hint；沒有提供外層 functions.exec call ID 或 revisedPrompt，故 metadata 記為 unavailable，並保留 savedPath 中的 image result item id。

## 下游交接

Assembly owner 可直接取 `normalized/ruins-bell-keeper-slam-windup-0.png` → 12、`...slam-windup-1.png` → 13、沿用 profile normalized `...slam-active.png` → 14、`...slam-recovery.png` → 15、`...hurt-0.png` / `...hurt-1.png` → 18/19。其餘 unused cells 保持 plan14 規定；本批未建立圖集或修改 loader/manifest。

## 檢查與未完成

已驗證五張輸出尺寸、RGBA、SHA-256、alpha bounds、中心點、最底像素與透明邊界；完成參考、raw、normalized 的中性底視覺審查。未跑測試、typecheck、build 或 browser：這是來源素材批次，沒有改動 consumer 程式。未完成項是後續 assembly owner 將這五格與 profile 參考組成 22 姿勢 atlas，並核對 14/其餘 unused cells。
