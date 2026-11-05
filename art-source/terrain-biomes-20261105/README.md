# 地圖平台與攀爬素材，第一批

日期：2026-11-05（Asia/Hong_Kong）。遊戲版本：1.0.0-beta.61。

## 來源

六份 `*-generated.png` 都由內建 **imagegen** 工具獨立生成，使用真正透明背景。
每張圖的完整最終提示詞位於同名 `*.prompt.txt`；原生輸出路徑及工具記錄見
`generation-record.json`。原稿已複製到本目錄，遊戲執行時只讀取 public 中的圖集。

- forest-platform：覆苔樹幹平台
- forest-vine：帶葉粗藤
- ridge-platform：紅砂岩平台
- ridge-rope：帶固定環的打結攀岩繩
- mine-platform：帶鐵件的木棧台
- mine-ladder：礦工木梯

`output/terrain-biomes-20261105/style-reference.jpg` 是生成前檢視既有背景與通用素材的聯絡圖。
生成提示詞以文字描述現有暖色手繪風格；未把參考聯絡圖當作編輯目標。

## 技術匯出

執行：`python art-source/terrain-biomes-20261105/export-terrain.py`

依賴現有 Pillow、numpy。只做透明度清理、預乘 alpha 縮放、切片與內部接縫包邊，
沒有程式繪製替代素材。輸出採新檔名 `*-biome-v1.png`，保留所有舊圖與 manifest 項目。
SHA-256、裁切範圍、尺寸與容量見 `export-report.json`。

- 平台圖集 640×96，五格 128×96，每格顯示 64×48 世界單位。
  順序為左端、三款中段、右端。標準落腳表面位於每格第 16 個來源像素（8 世界單位）。
- 攀爬圖集 192×64，三格 64×64，每格顯示 32×32 世界單位。
  順序為頂端、中段、尾端。
- 所有新圖密度均為 2×。中段按固定世界尺寸重複，剩餘長度裁切，端蓋對齊原本座標。
- 新增壓縮 PNG 合計 200,663 bytes；基礎 RGBA 合計 884,736 bytes。
  這是靜態素材估算，不是瀏覽器峰值記憶體或效能測量。

## 離線預覽

1. `node node_modules/tsx/dist/cli.mjs tools/preview-terrain-biomes.ts`
2. `python art-source/terrain-biomes-20261105/preview-terrain.py`

預覽使用正式 `terrain-style.ts` 產生的座標與實際匯出圖集，
輸出為 `output/terrain-biomes-20261105/materials-preview.jpg`。
此圖是素材拼接聯絡圖，**不是實機遊戲截圖**；沒有驗證 Phaser 中的實際顯示或操作。

完整修改與驗收紀錄：`plan/reports/terrain-biomes-20261105.md`。
