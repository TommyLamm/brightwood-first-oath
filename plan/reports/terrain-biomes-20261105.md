# 地圖材質第一批：森林、紅岩、礦坑

日期：2026-11-05，Asia/Hong_Kong。
遊戲 ID：`brightwood-first-oath`。版本：`1.0.0-beta.61`。
程式與靜態建置完成，成品為 repository 的 `dist/`。尚未打包 ZIP、提交、建立 Release 或發布。

同日使用者追加實機測試後，森林、紅岩、礦坑三區無頭操作驗收已完成。
結果與實際截圖見 [實機驗收報告](terrain-biomes-live-20261105.md)。

## 授權與範圍

使用者提出各地圖共用平台與木梯單調，希望加入繩子、森林藤蔓等配套素材，
接著要求「開始實作」。本批依上一輪建議先完成森林、山區、礦坑三套。

本次開始前已透過網路完整閱讀 main 分支：

- [遊戲代理範本](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)
- [開發與發布規格](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)
- [操作與錯誤契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)
- [Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)
- [Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)
- [SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)
- [版本規範](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)
- [存檔相容性](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)

適用事項：素材採相對路徑、沿用固定 ID 與既有玩法、保留舊素材、提高候選版本、
維持存檔相容、未經發布指令不發布。沒有調整 SDK、雲端存檔格式或裝置宣告。
依使用者的最小驗證要求，本輪只做相關幾何／manifest 測試、型別檢查、建置及離線素材檢視。

## 完成結果

| 地圖 | 平台 | 攀爬素材 |
| --- | --- | --- |
| 嫩芽林道 | 覆苔樹幹 | 帶葉粗藤 |
| 菌傘深林 | 覆苔樹幹 | 帶葉粗藤 |
| 赤岩山徑 | 紅砂岩棚 | 打結攀岩繩 |
| 古礦入口 | 鐵件木棧台 | 礦工梯 |
| 守衛祭壇 | 紅砂岩棚 | 打結攀岩繩 |

共五張地圖、13 段高架平台、10 條攀爬路線。其他十三張地圖沿用舊素材。

### 程式

- `src/render/terrain-style.ts`：共用選材入口；森林與 rock 主題各有預設，
  `mine-gate` 可覆寫共用 rock 背景的材質；未知主題沿用通用素材。
- 新平台採左端／三款中段／右端拼接，依平台 ID 穩定選擇中段。
  末段裁切到實際 foothold 端點，不把新平台延伸到可站立範圍之外。
- 新攀爬物採頂端／中段／尾端拼接；中段固定尺寸重複，餘數裁切，
  視覺中心、起點與終點沿用原本梯子設定。
- `src/render/index.ts`：所需圖片與地圖繪製使用同一份樣式選擇；
  使用正式圖格裁切與密度換算，圖集格數／顯示尺寸不符時回報資產錯誤。
- `src/app/assets.ts`：六個新 key 加入既有 manifest 必要資產契約。
- `public/assets/environment/manifest.json` 只新增六筆，既有條目、動畫與音訊項目保持原值。
- package、lock 與 `public/game.json` 同步提高到 beta.61。
  未修改碰撞、攀爬操作、地圖路線、任務、世界資料或存檔格式（讀 1–5、寫 5）。

### 圖像與成本

使用內建 imagegen 生成六張獨立透明原稿；完整提示詞、原稿、原生工具輸出路徑、
技術匯出腳本與雜湊見 `art-source/terrain-biomes-20261105/`。

正式素材皆採 2× 密度。新增 PNG 共 200,663 bytes（約 196 KiB），基礎 RGBA 為
884,736 bytes（約 0.84 MiB）。只代表靜態資產成本，沒有做瀏覽器峰值記憶體／效能評測。
六個圖集皆使用新的 `*-biome-v1.png` 檔名，舊素材未覆寫。

## 已執行檢查

- 匯出器的透明度、非空圖格、同格尺寸與標準內部接縫像素檢查通過。
- `npm test -- src/render/terrain-style.test.ts`：一個檔案、五項測試通過。
  覆蓋選材／礦坑覆寫、所有本批地圖的平台連續覆蓋與端點、攀爬中心與完整範圍、
  短段／無效長度處理、正式 manifest 解析與 PNG 2× 圖格尺寸；確認幾何計算不改寫世界資料。
- `npm run typecheck` 通過。
- `npm run build` 通過。JS 入口 `dist/assets/index-DUD8m3mO.js`。
- 本輪已追蹤修改的 `git diff --check` 通過。
- 確認新增 manifest 未改寫任何原有 image、animation、audio 項目。
- 檢視必要的離線聯絡圖，並修正預覽畫布底部留白，避免繩尾與梯腳在預覽中被裁掉。
  預覽來源座標由正式幾何函式輸出。此預覽**不是實機截圖**。

紀錄：`output/terrain-biomes-20261105/` 的 `focused-tests.log`、`typecheck.log`、`build.log`、
`map-materials.json`、`preview-layout.json`、`materials-preview.jpg`。

## 首輪實作交付時未執行的項目與後續

未啟動瀏覽器、未做實機攀爬／跳躍畫面核對、完整回歸、iframe／全螢幕、效能測量、
ZIP 驗證或平台發布。沒有把離線聯絡圖當作 Phaser 顯示驗收。

後續若要求實機測試，維持 `headless: true`，直接沿用 AGENTS.md 已驗證的一般使用者執行路徑，
針對森林、紅岩、礦坑各短段檢查圖格裁切、平台落腳、攀爬及換圖素材載入即可。
不要重演已知受限 Chrome crashpad 啟動失敗，亦無須擴成全部地圖回歸。

後續素材批次可接冰雪、砂岩與遺跡，再處理同區不同地圖的專屬裝飾。
地面、斜坡和背景本批沒有新增主題素材。
