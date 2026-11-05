# Plan52 冰洞變體與冰潮首領完整精修

日期：2026-11-05（Asia/Hong_Kong）。本機候選 `1.0.0-beta.65`。
使用內建 **imagegen** 技能／`image_gen.imagegen`，沒有CLI或API fallback，沒有新增依賴。

## 原稿與精確提示詞

| 未加工原稿／完整prompt | 輸入／用途 | runtime |
| --- | --- | --- |
| `cave-ground-generated.png`／`cave-ground.prompt.txt` | 上一批雪地原稿的緊湊參考，改為洞窟玄武岩／冰脈 | `public/assets/environment/env-cave-ground-v1.png`，512×512 |
| `cave-platform-generated.png`／`cave-platform.prompt.txt` | 上一批平台參考，改為薄冰覆岩棚 | `public/assets/environment/env-cave-platform-biome-v1.png`，640×96、5格 |
| `cave-chain-generated.png`／`cave-chain.prompt.txt` | 上一批攀爬繩參考，改為連續覆霜鐵鏈 | `public/assets/environment/env-cave-chain-biome-v1.png`，192×64、3格 |
| `warden-walk-generated.png`／`warden-walk.prompt.txt` | 原6–11格姿勢＋上一批4格風格參考 | 精修6個行走姿勢 |
| `warden-action-generated.png`／`warden-action.prompt.txt` | 原13、15、18、19格姿勢＋同一風格參考 | 精修2攻擊／2受傷姿勢 |
| `warden-dead-generated.png`／`warden-dead.prompt.txt` | 原24–27格姿勢＋同一風格參考 | 精修4個倒地姿勢 |

首領0、1、12、14格沿用 `../quality-pass3-20261105/warden-sample-generated.png` 的4個已製作樣本，沒有重複生成。
全部18個不同姿勢組成 `public/assets/actors/monsters/frost-tide-warden-clarity-v1.png`，1632×1360、6×5、單格272，顯示框192、pivot0.5／1保持原值。
其餘12格保留原本的重複映射，不生成不需要的新姿勢。

`generation-record.json` 保存本輪6次原生輸出路徑、工作區原稿、實際prompt／source hashes與輸入角色。
原生輸出與以上原稿皆保留，不以技術處理後的runtime冒充原生圖。

## 匯出、定位與保留契約

```powershell
python art-source/quality-pass4-20261105/export.py
node --import tsx art-source/quality-pass4-20261105/preview-terrain.mjs
python art-source/quality-pass4-20261105/preview-terrain.py
```

`prepare.py` 保存beta.64 Manifest／玩法基線及精確姿勢參考；不要以重新擷取後的資料覆蓋這個基線。
`export.py` 使用既有Pillow／numpy，沿用terrain-biomes匯出器的預乘alpha縮放、切片與接縫包邊，沒有程式繪製替代美術。

- 洞窟地面：尋找連續實心上緣，裁去透明上方，經alpha≥240矩形檢查後正規化實心區為255，512px來源／128邏輯px；左右接縫一致。
- 平台：五格128×96來源／64×48邏輯；上緣inset8及原端點、原比例中段重複不變。
- 鐵鏈：三格64×64來源／32×32邏輯，頂／中／尾拼接；檢查接縫不是空白橫列。
- 首領：先依每格原alpha≥128主體外框擬合，再按不透明外框底邊／水平中心定位。18姿勢的外框底邊與中心定位差均0邏輯px；這是外框指標，不是骨架或內部五官定位證明。沒有用淡alpha殘留擴大角色。
- 圖集30格全部有來源；保留原重複格對應、動畫格序、frameMs、loop、顯示框與pivot。非目標角色Manifest條目、environment舊條目及玩法基線保持一致，原runtime PNG保留。

完整輸出hash、姿勢外框、來源分區、重複映射及容量在 `export-report.json`。
本輪4張新runtime檔合計1,051,722 bytes；首領替換引用後的活躍壓縮淨增532,895 bytes。
新增圖像基本RGBA總量10,221,568 bytes；活躍參照集合淨增1,343,488 bytes，來自洞窟3圖。上述皆靜態估計，不是瀏覽器峰值記憶體。

## 預覽與觀察界線

`output/quality-pass4-20261105/` 提供洞窟材質前後、五種首領狀態的逐格JPEG及依原frameMs匯出的GIF。
JPEG長邊≤1200、quality72；GIF為384×384來源動畫預覽，loop設定沿用Manifest。
逐格圖以現行1080p世界密度呈現必要局部，沒有額外放大主體。

人工檢視行走、攻擊、受傷、倒地逐格圖：姿勢差異、倒地進程與統一細節保留。GIF是交付用的時間序列輸出，不代表已在遊戲／Phaser中實際播放驗收。
材質圖使用正式maps與拼接helper，是離線局部，不是正常相機遊戲截圖。沒有開啟瀏覽器或更動玩家存檔。

[完整交接與實際檢查](../../plan/reports/quality-pass4-20261105.md)。
