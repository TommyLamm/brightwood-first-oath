# Plan52 首批素材與來源

2026-11-05（Asia/Hong_Kong），候選 `1.0.0-beta.64`。內建 **imagegen** 技能／`image_gen.imagegen`，沒有使用CLI或API fallback。

## 生成與採用

| 原稿／完整提示詞 | 編修參考 | 採用結果 |
| --- | --- | --- |
| `snow-ground-generated.png`／`snow-ground.prompt.txt` | `ground-reference.jpg`，由既有1254px草土地面原稿縮小合成 | `public/assets/environment/env-snow-ground-v1.png`，512×512，顯示128×128 |
| `snow-platform-generated.png`／`snow-platform.prompt.txt` | `platform-reference.jpg`，由既有礦坑平台原稿縮小合成 | `public/assets/environment/env-snow-platform-biome-v1.png`，640×96，5格128×96，顯示64×48 |
| `snow-rope-generated.png`／`snow-rope.prompt.txt` | `rope-reference.jpg`，由既有攀岩繩原稿縮小合成 | `public/assets/environment/env-snow-rope-biome-v1.png`，192×64，3格64×64，顯示32×32 |
| `warden-sample-generated.png`／`warden-sample.prompt.txt` | `warden-edit-target-review.jpg`，由現行首領0、1、12、14格合成 | 四格技術樣本 `warden-detail-samples.png`；**不接入runtime** |

`generation-record.json` 保存四次內建生成的原生路徑、工作區副本、精確prompt／source hash。
所有原生輸出均保持原位，副本未經修改。`prepare.py` 保存本批Manifest與玩法檔案基線並建立參考，參考圖只是編修輸入，不是新素材。

## 匯出與重現

```powershell
python art-source/quality-pass3-20261105/export.py
node --import tsx art-source/quality-pass3-20261105/preview-layout.mjs
python art-source/quality-pass3-20261105/preview.py
```

使用既有Pillow／numpy及專案tsx，沒有安裝或升級依賴。匯出沿用
`art-source/terrain-biomes-20261105/export-terrain.py` 的預乘alpha縮放、切片與內部接縫包邊；沒有程式繪製替代美術。

- 平台上緣沿用8邏輯px inset，端蓋保持外側輪廓，中段邊緣共用接縫profile。
- 攀爬維持頂／中／尾，中段按原比例重複並裁切。
- 雪地先找連續實心雪線並對齊地面y，左右邊緣包邊；原稿地質區alpha為244–253近不透明，經斷言確認整個裁切矩形alpha≥240後正規化為255，避免地面透出背景。沒有填補透明洞或移除美術物件。
- 首領樣本按原姿勢的alpha≥128主體外框定位，沒有把很淡的alpha殘留當身形。只是候選樣本，未改角色Manifest、原圖集、格序或時序。
- 樣本的冰晶／毛皮層次可見改善，但前鰭體積感及線條相較舊圖已有差異；四格尚未與剩餘動作連續比較，因此不混入正式動畫。後續接入需按同一身份標準處理銜接，不自動整套生成。

`export-report.json` 記錄來源／runtime尺寸、hash、裁切、容量、原玩法檔hash與未採用決定。
新增runtime共550,404 bytes，基本RGBA解碼量1,343,488 bytes；舊檔保留，三張皆新增而非刪舊換算。這不是瀏覽器記憶體峰值。

## 審圖與驗證

`output/quality-pass3-20261105/` 包含兩張正式地圖資料驅動的前後局部、四格首領比較。
`*-comparison.jpg` 為≤1200px／quality72的交接圖；地形PNG是1200×720離線世界裁圖。這些皆**不是遊戲瀏覽器截圖**，沒有驗證Phaser實際合成、操作、載入或動畫。

正式結果與未驗界線：[首批交接](../../plan/reports/quality-pass3-20261105.md)。
