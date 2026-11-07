# 下一波畫質規劃證據

日期：2026-11-05，Asia/Hong_Kong。本機 `1.0.0-beta.63`。
對應 [Plan52](../../plan/52-remaining-low-quality-assets.md)。本目錄是離線盤點，沒有生成或修改 runtime 素材。

| 檔案 | 用途／界線 |
| --- | --- |
| `asset-audit.json`、`asset-audit.csv` | 三份現行 Manifest 的 183 筆註冊圖像，包含路徑、SHA-256、格數、尺寸、密度、檔案大小、RGBA 解碼估計與第一格 alpha 外框。註冊不等於有地圖實際使用；不是效能測量 |
| `direct-ui-audit.json` | 44 張 DOM UI 相關圖片，其中 26 張與 Manifest 重疊、18 張額外；目錄級引用核對，不是逐畫面瀏覽器驗收 |
| `map-usage.json` | 從正式 `maps` 與 `terrainStyle()` 匯出 18 圖的實際地形映射、平台／攀爬／斜坡數、怪物 ID |
| `boss-density-review.jpg` | 冰潮首領、失序司鐘者及守衛的待機與代表攻擊格；依相同 192 邏輯 px 顯示框，在 1080p 基線模擬為 384px。角色有效身形不同，不能直接以視覺大小判定優劣 |
| `terrain-actor-review.jpg` | 代表性冰雪怪、其他怪物、NPC、地形；來源按現行顯示框、nearest、2 螢幕 px／邏輯 px 合成，非實玩截圖 |
| `midground-detail-review.jpg` | 四個中景中有內容的 300×135 原始像素裁圖，放到 600×270；座標在 `review-crop-coordinates.json`。只證明局部取樣觀察，不代表全場景缺陷 |
| `hero-other-states-review.jpg` | 三套現行主角各六個代表狀態；未疊帽子／武器、未逐幀播放，不作動畫通過證據 |

所有審圖 JPEG 長邊 ≤1200、quality 72，透明內容合成深灰背景。原始 PNG 仍在 public／art-source，未改動。
`firstFrameAlpha128Bounds` 只作有效身形估算；半透明風格及陰影會影響結果，不用於調碰撞、縮放或自動刪像素。

從 repository 根目錄重現：

```powershell
python output/quality-wave3-plan-20261105/audit-assets.py
node --import tsx output/quality-wave3-plan-20261105/export-map-usage.mjs
```

本輪另外閱讀 beta.63 既有林道／礦入口正常相機縮圖；來源為
`output/playwright/quality-pass2-20261105-01/forest-edge-scene-review.jpg` 及
`mine-gate-scene-review.jpg`。沒有啟動新瀏覽器，亦未把既有截圖算成本輪新驗收。
