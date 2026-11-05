# Plan52 首批交接：冰雪地形與冰潮首領樣本

2026-11-05（Asia/Hong_Kong）。遊戲 `brightwood-first-oath`，本機候選 **1.0.0-beta.64**，成品 `dist/`。
W00–W03首批完成，停止擴展；未commit、push、pack／ZIP驗證、tag、Release或平台上架。

## 完成內容

1. 雪痕海岸、霜松隘道新增專屬雪地、積雪頁岩平台與覆霜繩。兩圖共7個平台、7條攀爬路線，保持原座標與範圍；冰潮洞窟及其他地圖沿用原選材。
2. 三張runtime分別為512×512地面、640×96五格平台、192×64三格攀爬。地面4×、平台／攀爬2×密度，沿用落腳線、端蓋與中段重複／裁切規則。
3. `terrainStyle()`統一選取ground／platform／climb，`requiredTerrainImageKeys()`提供同一地圖的載入需求；renderer實際畫地面使用該ground key，防止新增雪地後仍讀草地或漏載新資產。
4. environment Manifest新增三個穩定key與版本化PNG，必需資產清單同步加入。原有58筆環境圖、動畫與音效項目保留。
5. 冰潮首領0、1、12、14格細節樣本完成，提供正常世界密度的局部比較。**四格未採用到runtime**：冰晶與毛皮細節改善，但前鰭與線條已有差異，尚未與剩餘動作連續比較。本批不混入部分新風格，角色Manifest／原圖集保持現況。
6. package／lock／game manifest同步為beta.64，`dist/game.json`一致；玩法、相機、HUD、存檔讀1–5／寫5與SDK保持現況。

## 來源、圖片與成本

四份原稿由內建imagegen編修產生，真正透明輸出；原生檔保留，完整prompt、來源hash、參考圖、可重現匯出器及採用結果見
[素材入口](../../art-source/quality-pass3-20261105/README.md)。沒有API／CLI fallback或新增依賴。

| runtime | 壓縮bytes | 基本RGBA bytes |
| --- | ---: | ---: |
| `env-snow-ground-v1.png` | 485,597 | 1,048,576 |
| `env-snow-platform-biome-v1.png` | 54,230 | 245,760 |
| `env-snow-rope-biome-v1.png` | 10,577 | 49,152 |
| 合計 | **550,404（約537.5 KiB）** | **1,343,488（1.28125 MiB）** |

三張皆為成品新增檔，舊圖仍供其他地圖使用；不以減去舊圖後的淨額冒充包體增加量。RGBA數字只為靜態解碼估計，不是瀏覽器峰值記憶體／FPS。

- [雪痕海岸前後局部](../../output/quality-pass3-20261105/frost-shore-comparison.jpg)
- [霜松隘道前後局部](../../output/quality-pass3-20261105/frost-pine-pass-comparison.jpg)
- [冰潮首領四格樣本](../../output/quality-pass3-20261105/warden-sample-comparison.jpg)

地形預覽使用正式maps與拼接helper，完整1200×720前後PNG、layout JSON也在同目錄。
審圖使用必要JPEG／局部，長邊≤1200、quality72。皆為**離線材質比較**，不能當本次遊戲實玩／瀏覽器驗收。

## 實際檢查

| 項目 | 結果 |
| --- | --- |
| 素材匯出 | 最終通過尺寸／有效格、平台及攀爬接縫、雪地左右包邊與實心alpha、非目標Manifest保留及基線玩法檔hash檢查 |
| `src/render/terrain-style.test.ts` | **7/7通過，一次**；新增兩圖選材／冰洞及其他圖fallback、正式Manifest與PNG存在／尺寸案例，既有拼接幾何一併覆蓋 |
| `npm run typecheck` | **一次通過** |
| `npm run check:content` | **一次通過**，rules／world與跨表引用 |
| `npm run build` | **一次通過**，`dist/assets/index-z794bujz.js` |
| 版本與差異 | package／lock／public及dist為beta.64；所改程式／Manifest的`git diff --check`通過 |

本機使用現有Node **24.19.0**；以上是該環境的實際結果，未另下載或切換到package宣告的24.22.1+環境。正式Release仍須按線上規格使用符合版本的固定工具與Node。

匯出過程：第一次斷言發現生成地面是244–253近不透明而非完全不透明，未寫入地面與Manifest；前後預覽曾因該未完成輸出回報缺key。確認alpha分布後，只將經驗證的實心裁切矩形正規化為255，重新匯出通過。這是素材技術處理，沒有遊戲測試失敗，也沒有反覆重跑已通過的遊戲檢查。

未執行：新瀏覽器／Phaser實際合成與攀爬操作、首領動作銜接、其他地圖實玩、高DPI／4K、效能、跨來源iframe／全螢幕、雲端帳號矩陣及封包／發布驗收。沒有宣稱上述項目通過。

## 規格與下一步

本次實作開始前重新透過網路完整讀取Playroom main範本及七份規格，清單見
[Plan52規格來源](../52-remaining-low-quality-assets.md#7-本輪線上規格來源)。本批遵循相對路徑、保留既有玩法／存檔、版本化素材、候選版本提升及如實記錄驗證；沒有發布授權。

本批停止於兩張冰雪地圖材質接入與四格首領樣本決定。後續可按需求做一次正常相機視覺驗收，再決定首領銜接及冰洞變體；砂海／遺跡／城鎮、中景與礦區背景仍保留在Plan52後續，不自動擴展。
